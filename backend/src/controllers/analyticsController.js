const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get agents specifically for analytics (includes deleted ones)
const getAnalyticsAgents = async (req, res) => {
    try {
        const agents = await prisma.agent.findMany({
            where: { userId: req.userId },
            orderBy: [
                { deletedAt: 'asc' }, // Show active first
                { createdAt: 'desc' }
            ]
        });
        res.json(agents);
    } catch (error) {
        console.error('Error fetching analytics agents:', error);
        res.status(500).json({ error: 'Błąd podczas pobierania agentów' });
    }
};

// Get recent conversations for a specific agent
const getConversations = async (req, res) => {
    try {
        const { agentId } = req.query;

        if (!agentId) {
            return res.status(400).json({ error: 'Agent ID jest wymagane' });
        }

        // Verify agent belongs to user
        const agent = await prisma.agent.findFirst({
            where: {
                id: agentId,
                userId: req.userId
            }
        });

        if (!agent) {
            return res.status(403).json({ error: 'Brak dostępu lub agent nie istnieje' });
        }

        // Fetch conversations with the last message
        const conversations = await prisma.conversation.findMany({
            where: {
                agentId: agent.id,
                channel: 'webchat', // Focus on widget conversations
            },
            orderBy: {
                lastMessageAt: 'desc'
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1 // Only get the last message for the list view
                }
            },
            take: 50 // Limit to last 50 for performance
        });

        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Błąd podczas pobierania konwersacji' });
    }
};

// Get full history for a specific conversation
const getConversationMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;

        // Verify conversation belongs to one of user's agents
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                agent: true
            }
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Konwersacja nie znaleziona' });
        }

        if (conversation.agent.userId !== req.userId) {
            return res.status(403).json({ error: 'Brak dostępu' });
        }

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' } // Chronological order
        });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Błąd podczas pobierania wiadomości' });
    }
};

module.exports = {
    getAnalyticsAgents,
    getConversations,
    getConversationMessages
};
