const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Find or create conversation
 * @param {string} agentId - Agent ID
 * @param {string} channel - Channel type (webchat, phone, facebook)
 * @param {string} sessionId - Session ID for webchat
 * @param {string} externalUserId - External user ID for phone/facebook
 * @returns {Promise<Conversation>}
 */
async function findOrCreateConversation(agentId, channel, sessionId = null, externalUserId = null) {
  // Try to find existing active conversation
  const where = {
    agentId,
    channel,
    status: 'active',
  };

  if (channel === 'webchat' && sessionId) {
    where.sessionId = sessionId;
  } else if (externalUserId) {
    where.externalUserId = externalUserId;
  }

  let conversation = await prisma.conversation.findFirst({ where });

  // If not found, create new one
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        agentId,
        channel,
        sessionId,
        externalUserId,
        status: 'active',
      },
    });
    console.log(`✨ Created new conversation ${conversation.id} for agent ${agentId}`);
  }

  return conversation;
}

/**
 * Get conversation by ID
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Conversation>}
 */
async function getConversation(conversationId) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      agent: {
        include: {
          llmConfig: true,
          documents: true,
        },
      },
    },
  });
}

/**
 * Get conversation history (last N messages)
 * @param {string} conversationId - Conversation ID
 * @param {number} limit - Number of messages to fetch (default: 20)
 * @returns {Promise<Array<Message>>}
 */
async function getConversationHistory(conversationId, limit = 20) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  }).then(messages => messages.reverse()); // Reverse to get chronological order
}

/**
 * Save message to database
 * @param {string} conversationId - Conversation ID
 * @param {string} sender - "user" or "bot"
 * @param {string} text - Message text
 * @param {Object} metadata - Optional metadata (source documents, etc.)
 * @returns {Promise<Message>}
 */
async function saveMessage(conversationId, sender, text, metadata = null) {
  const message = await prisma.message.create({
    data: {
      conversationId,
      sender,
      text,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  // Update conversation's lastMessageAt
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return message;
}

/**
 * Update conversation status
 * @param {string} conversationId - Conversation ID
 * @param {string} status - New status (active, escalated, closed)
 * @returns {Promise<Conversation>}
 */
async function updateConversationStatus(conversationId, status) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { status },
  });
}

/**
 * Close conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Conversation>}
 */
async function closeConversation(conversationId) {
  return updateConversationStatus(conversationId, 'closed');
}

/**
 * Get all conversations for agent
 * @param {string} agentId - Agent ID
 * @param {number} limit - Number of conversations to fetch
 * @returns {Promise<Array<Conversation>>}
 */
async function getAgentConversations(agentId, limit = 50) {
  return prisma.conversation.findMany({
    where: { agentId },
    orderBy: { lastMessageAt: 'desc' },
    take: limit,
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1, // Get last message
      },
    },
  });
}

module.exports = {
  findOrCreateConversation,
  getConversation,
  getConversationHistory,
  saveMessage,
  updateConversationStatus,
  closeConversation,
  getAgentConversations,
};
