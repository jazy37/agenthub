const express = require('express');
const {
    getAnalyticsAgents,
    getConversations,
    getConversationMessages
} = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All analytics routes require authentication
router.use(authMiddleware);

// GET /api/analytics/agents
router.get('/agents', getAnalyticsAgents);

// GET /api/analytics/conversations?agentId=...
router.get('/conversations', getConversations);

// GET /api/analytics/conversations/:conversationId/messages
router.get('/conversations/:conversationId/messages', getConversationMessages);

module.exports = router;
