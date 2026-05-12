require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const basicAuth = require('express-basic-auth');
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const agentRoutes = require('./routes/agentRoutes');
const llmRoutes = require('./routes/llmRoutes');
const documentRoutes = require('./routes/documentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const paymentController = require('./controllers/paymentController');
const { setupSockets } = require('./socket/handler');
const { canSendMessage } = require('./utils/messageLimit');
const logger = require('./utils/logger').child({ module: 'server' });

// Initialize background workers and queues (BullMQ)
const { documentQueue } = require('./queues/documentQueue');
require('./workers/documentWorker');

// Run DB cleanup on start and initialize cron schedule
const { startCleanupCron } = require('./utils/cleanup');
startCleanupCron();

const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const app = express();
const PORT = process.env.PORT || 5000;

// Protect Bull-Board with Basic Auth
const dashboardAuth = basicAuth({
  users: {
    [process.env.ADMIN_USERNAME || 'admin']: process.env.ADMIN_PASSWORD || 'admin'
  },
  challenge: true,
  realm: 'AgentHub Admin Area'
});


// Create HTTP server and Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for widget
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// CORS Configuration
const allowedDashboardOrigins = [
  'https://agenthub.pl',
  'https://www.agenthub.pl',
  'http://localhost:3000'
];

const dashboardCors = cors({
  origin: function (origin, callback) {
    // Brak origin oznacza żądanie np. z tej samej domeny, z mobile, lub z Postmana
    if (!origin || allowedDashboardOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Niedozwolone źródło żądania (CORS).'));
    }
  },
  credentials: true,
});

const publicCors = cors({
  origin: '*', // Widget instalowany na obcych stronach
});

// Wrzucamy wczesniej zeby byl nad dashboardCors
// Serve static files (widget) - MUST be before dashboard CORS to allow public access to widget.js
app.use(express.static(path.join(__dirname, '../public')));

// Zabezpieczenie ścieżki admin/queues hasłem PRZED wykreowaniem bull-board
app.use('/admin/queues', dashboardAuth);

// Bull-Board setup
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(documentQueue)],
  serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// Middleware for API CORS
app.use((req, res, next) => {
  // Jeśli zapytanie jest do widgetu API lub endpointu health uwalniamy mechanizm zasobów (każda domena dozwolona)
  if (req.path.startsWith('/api/widget') || req.path.startsWith('/api/health')) {
    return publicCors(req, res, next);
  }
  // W przeciwnym razie wszystkie zapytania panelu (/api/auth, /api/agents itp.) idą przez zamek
  return dashboardCors(req, res, next);
});

// Mount Stripe webhook BEFORE express.json() so it can access raw body
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AgentHub API is running' });
});

// Widget branding endpoint (public, no auth, no cache)
app.get('/api/widget/branding/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        deletedAt: null
      },
      select: {
        brandColor: true,
        userId: true,
        welcomeMessage: true,
        quickReplies: true,
      }
    });

    if (!agent) {
      return res.status(200).json({ disabled: true, error: 'Agent not found or deleted' });
    }

    // Check message limit for user
    const limitCheck = await canSendMessage(agent.userId);

    const responseData = {
      brandColor: agent.brandColor || '#2563EB',
      welcomeMessage: agent.welcomeMessage || 'Cześć! W czym mogę pomóc?',
      quickReplies: Array.isArray(agent.quickReplies) ? agent.quickReplies : [],
      limitReached: !limitCheck.allowed,
    };

    // No cache - always fresh data for instant updates
    res.set('Cache-Control', 'no-cache');
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching widget branding:', error);
    res.status(500).json({ error: 'Failed to fetch branding' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Coś poszło nie tak!' });
});

// Setup Socket.io event handlers
setupSockets(io);

server.listen(PORT, () => {
  logger.info({ port: PORT }, `🚀 Server running on http://localhost:${PORT}`);
  logger.info('🔌 Socket.io ready for connections');
});
