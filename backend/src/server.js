require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const agentRoutes = require('./routes/agentRoutes');
const llmRoutes = require('./routes/llmRoutes');
const documentRoutes = require('./routes/documentRoutes');
const { findOrCreateConversation, getConversationHistory, saveMessage, getConversation } = require('./services/conversation.service');
const { processMessage, invalidateChainCache } = require('./services/langchain.service');
const rateLimiter = require('./utils/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server and Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for widget
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for widget
  credentials: true,
}));
app.use(express.json());

// Serve static files (widget)
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/documents', documentRoutes);

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

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        brandColor: true
      }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const responseData = {
      brandColor: agent.brandColor || '#2563EB'
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

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Join conversation
  socket.on('join_conversation', async (data) => {
    try {
      const { agentId, sessionId, channel } = data;

      if (!agentId || !sessionId) {
        socket.emit('error', { message: 'agentId and sessionId are required' });
        return;
      }

      // Find or create conversation with specified channel (default: webchat for widget)
      const conversation = await findOrCreateConversation(
        agentId,
        channel || 'webchat',
        sessionId
      );

      // Join socket room
      socket.join(conversation.id);

      // Load conversation history (last 20 messages)
      const history = await getConversationHistory(conversation.id, 20);

      // Get agent with user info for branding and plan
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: { user: true }
      });

      // If conversation is new (no history), send welcome message
      if (history.length === 0) {
        if (agent && agent.welcomeMessage) {
          const welcomeMsg = await saveMessage(
            conversation.id,
            'bot',
            agent.welcomeMessage
          );

          history.push(welcomeMsg);
        }
      }

      // Send conversation data with branding
      socket.emit('conversation_joined', {
        conversationId: conversation.id,
        history,
        brandColor: agent?.brandColor || '#2563EB',
        userPlan: agent?.user?.plan || 'free',
      });

      console.log(`💬 Client ${socket.id} joined conversation ${conversation.id}`);
    } catch (error) {
      console.error('Error joining conversation:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, message } = data;

      if (!conversationId || !message) {
        socket.emit('error', { message: 'conversationId and message are required' });
        return;
      }

      // Rate limiting check
      if (!rateLimiter.consume(socket.id)) {
        socket.emit('error', {
          message: 'Za dużo wiadomości. Poczekaj chwilę przed wysłaniem kolejnej.',
        });
        return;
      }

      // Get conversation with agent details
      const conversation = await getConversation(conversationId);

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      // Save user message
      await saveMessage(conversationId, 'user', message);

      // Emit typing indicator
      io.to(conversationId).emit('bot_typing', { typing: true });

      // Get conversation history (last 20 messages, excluding the one just saved)
      const history = await getConversationHistory(conversationId, 20);

      // Process message with LangChain
      const { reply, sourceDocuments } = await processMessage(
        conversation.agent,
        conversationId,
        message,
        history
      );

      // Save bot reply
      const botMessage = await saveMessage(
        conversationId,
        'bot',
        reply,
        sourceDocuments.length > 0 ? { sourceDocuments } : null
      );

      // Stop typing indicator
      io.to(conversationId).emit('bot_typing', { typing: false });

      // Send bot reply
      io.to(conversationId).emit('bot_reply', {
        message: {
          id: botMessage.id,
          sender: 'bot',
          text: reply,
          createdAt: botMessage.createdAt,
          metadata: botMessage.metadata,
        },
      });

      console.log(`🤖 Bot replied in conversation ${conversationId}`);
    } catch (error) {
      console.error('Error processing message:', error);

      // Stop typing indicator
      if (data.conversationId) {
        io.to(data.conversationId).emit('bot_typing', { typing: false });
      }

      socket.emit('error', {
        message: error.message || 'Przepraszam, wystąpił problem. Spróbuj ponownie.',
      });
    }
  });

  // Disconnect
  socket.on('disconnect', (data) => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    invalidateChainCache(data.agentId); // Invalidate cache on disconnect
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.io ready for connections`);
});
