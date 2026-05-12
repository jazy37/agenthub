const { findOrCreateConversation, getConversationHistory, saveMessage, getConversation } = require('../services/conversation.service');
const { processMessage, invalidateChainCache } = require('../services/langchain.service');
const rateLimiter = require('../utils/rateLimiter');
const { canSendMessage, incrementMessageCount } = require('../utils/messageLimit');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger').child({ module: 'socket' });

const setupSockets = (io) => {
    io.on('connection', (socket) => {
        logger.info({ socketId: socket.id }, 'Client connected');

        // Join conversation
        socket.on('join_conversation', async (data) => {
            try {
                const { agentId, sessionId, channel } = data;

                if (!agentId || !sessionId) {
                    socket.emit('error', { message: 'agentId and sessionId are required' });
                    return;
                }

                // Get agent with user info for branding and plan
                const agent = await prisma.agent.findFirst({
                    where: {
                        id: agentId,
                        deletedAt: null
                    },
                    include: { user: true }
                });

                if (!agent) {
                    socket.emit('error', { message: 'Agent not found or disabled', limitReached: true }); // using limitReached to trigger frontend hide
                    return;
                }

                // Check message limit for user
                const userId = agent.userId;
                const limitCheck = await canSendMessage(userId);

                // Find existing active conversation
                const conversation = await prisma.conversation.findFirst({
                    where: {
                        agentId,
                        channel: channel || 'webchat',
                        sessionId,
                        status: 'active'
                    }
                });

                let history = [];
                let conversationId = null;

                if (conversation) {
                    conversationId = conversation.id;
                    socket.join(conversationId);
                    history = await getConversationHistory(conversationId, 20);
                } else {
                    // Dołączamy do wirtualnego pokoju sesji
                    socket.join(sessionId);

                    // Simulate history with welcome message if it doesn't exist yet
                    if (agent.welcomeMessage) {
                        history.push({
                            text: agent.welcomeMessage,
                            sender: 'bot',
                            timestamp: new Date()
                        });
                    }
                }

                // Send conversation data with branding and limit info
                socket.emit('conversation_joined', {
                    conversationId,
                    history,
                    brandColor: agent?.brandColor || '#2563EB',
                    userPlan: agent?.user?.plan || 'free',
                    limitReached: !limitCheck.allowed,
                    messageLimit: limitCheck.limit,
                    messagesUsed: limitCheck.used,
                });

                logger.info({ socketId: socket.id, conversationId, sessionId }, 'Client joined conversation room');
            } catch (error) {
                console.error('Error joining conversation:', error);
                socket.emit('error', { message: 'Failed to join conversation' });
            }
        });

        // Send message
        socket.on('send_message', async (data) => {
            try {
                const { conversationId, message, agentId, sessionId, channel } = data;

                if (!message) {
                    socket.emit('error', { message: 'message is required' });
                    return;
                }

                // Rate limiting check (Redis sliding window - works in multi-instance)
                const allowed = await rateLimiter.consume(socket.id);
                if (!allowed) {
                    socket.emit('error', {
                        message: 'Za dużo wiadomości. Poczekaj chwilę przed wysłaniem kolejnej.',
                        rateLimited: true,
                    });
                    return;
                }

                let activeConversationId = conversationId;

                // Jeśli konwersacja jeszcze nie istnieje w DB, tworzymy ją teraz
                if (!activeConversationId) {
                    if (!agentId || !sessionId) {
                        socket.emit('error', { message: 'agentId and sessionId required to start conversation' });
                        return;
                    }

                    const newConv = await findOrCreateConversation(agentId, channel || 'webchat', sessionId);
                    activeConversationId = newConv.id;
                    socket.join(activeConversationId);

                    // Retroactively add welcome message to DB if defined
                    const agent = await prisma.agent.findFirst({ where: { id: agentId } });
                    if (agent && agent.welcomeMessage) {
                        await saveMessage(activeConversationId, 'bot', agent.welcomeMessage);
                    }

                    socket.emit('conversation_started', { conversationId: activeConversationId });
                }

                // Get conversation with agent details
                const conversation = await getConversation(activeConversationId);

                if (!conversation) {
                    socket.emit('error', { message: 'Conversation not found' });
                    return;
                }

                // Check message limit for user
                const userId = conversation.agent.userId;
                const limitCheck = await canSendMessage(userId);

                if (!limitCheck.allowed) {
                    socket.emit('error', {
                        message: `Osiągnąłeś limit wiadomości dla planu FREE (${limitCheck.limit} wiadomości/miesiąc). Przejdź na plan PRO, aby kontynuować.`,
                        limitReached: true,
                        limit: limitCheck.limit,
                        used: limitCheck.used,
                    });
                    return;
                }

                // Save user message
                await saveMessage(activeConversationId, 'user', message);

                // Emit typing indicator
                io.to(activeConversationId).emit('bot_typing', { typing: true });

                // Get conversation history (last 20 messages, excluding the one just saved)
                const history = await getConversationHistory(activeConversationId, 20);

                // Process message with LangGraph state machine
                const { reply, sourceDocuments, escalate } = await processMessage(
                    conversation.agent,
                    activeConversationId,
                    message,
                    history
                );

                // Save bot reply
                const botMessage = await saveMessage(
                    activeConversationId,
                    'bot',
                    reply,
                    sourceDocuments.length > 0 ? { sourceDocuments } : null
                );

                // Increment message count for user (only count bot responses)
                await incrementMessageCount(userId);

                // Stop typing indicator
                io.to(activeConversationId).emit('bot_typing', { typing: false });

                // Send bot reply with optional escalate flag
                io.to(activeConversationId).emit('bot_reply', {
                    message: {
                        id: botMessage.id,
                        sender: 'bot',
                        text: reply,
                        createdAt: botMessage.createdAt,
                        metadata: botMessage.metadata,
                    },
                    escalate: !!escalate,  // true = human handover requested
                });

                logger.info({ conversationId, reply: reply.substring(0, 80), escalate: !!escalate }, 'Bot replied');
            } catch (error) {
                logger.error({ err: error, conversationId }, 'Error processing message');

                // Stop typing indicator
                if (data.conversationId) {
                    io.to(data.conversationId).emit('bot_typing', { typing: false });
                }

                socket.emit('error', {
                    message: error.message || 'Przepraszam, wystąpił problem. Spróbuj ponownie.',
                });
            }
        });

        // Leave conversation (mark as completed)
        socket.on('leave_conversation', async (data) => {
            try {
                const { conversationId } = data;
                if (conversationId) {
                    await prisma.conversation.update({
                        where: { id: conversationId },
                        data: { status: 'completed' }
                    });
                    logger.info({ conversationId }, 'Conversation marked as completed');
                }
            } catch (error) {
                logger.error({ err: error }, 'Error leaving conversation');
            }
        });

        // Disconnect
        socket.on('disconnect', (data) => {
            logger.info({ socketId: socket.id }, 'Client disconnected');
            // Usually socket.id doesn't map directly to agentId unless you store it.
            // Leaving this here if there's external logic attached to it.
            if (data && data.agentId) {
                invalidateChainCache(data.agentId); // Invalidate cache on disconnect
            }
        });
    });
};

module.exports = { setupSockets };
