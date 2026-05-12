const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Plan limits
const PLAN_LIMITS = {
  free: 1,
  pro: 5
};

// Get all agents for logged-in user
const getAgents = async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      where: {
        userId: req.userId
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            documents: true,
            conversations: {
              where: {
                channel: 'webchat' // Only widget conversations (production)
              }
            },
          },
        },
      },
    });

    res.json(agents);
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania agentów' });
  }
};

// Get single agent
const getAgent = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findFirst({
      where: {
        id
      },
      include: {
        _count: {
          select: {
            documents: true,
            conversations: {
              where: {
                channel: 'webchat' // Only widget conversations (production)
              }
            },
          },
        },
      },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent nie znaleziony' });
    }

    // Security: check if agent belongs to user
    if (agent.userId !== req.userId) {
      return res.status(403).json({ error: 'Brak dostępu do tego agenta' });
    }

    res.json(agent);
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania agenta' });
  }
};

// Create new agent
const createAgent = async (req, res) => {
  try {
    const { name, description, llmConfigId, llmModel, brandColor, welcomeMessage, quickReplies } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Nazwa agenta jest wymagana' });
    }

    // Get user to check plan
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { agents: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    // Check plan limits
    const currentAgentCount = user.agents.length;
    const limit = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;

    if (currentAgentCount >= limit) {
      return res.status(403).json({
        error: `Plan ${user.plan.toUpperCase()} pozwala na maksymalnie ${limit} ${limit === 1 ? 'agenta' : 'agentów'}. Upgrade do PRO, aby dodać więcej!`
      });
    }

    // If llmConfigId is provided, verify it belongs to user and get its config
    let selectedLlmConfig = null;
    if (llmConfigId) {
      selectedLlmConfig = await prisma.lLMConfig.findUnique({
        where: { id: llmConfigId }
      });

      if (!selectedLlmConfig || selectedLlmConfig.userId !== req.userId) {
        return res.status(403).json({ error: 'Nieprawidłowa konfiguracja LLM' });
      }
    }

    // Create agent
    const agent = await prisma.agent.create({
      data: {
        userId: req.userId,
        name: name.trim(),
        description: description?.trim() || null,
        llmConfigId: llmConfigId || null,
        llmModel: selectedLlmConfig ? selectedLlmConfig.model : (process.env.DEFAULT_LLM_MODEL || 'gpt-4o-mini'),
        llmProvider: selectedLlmConfig ? selectedLlmConfig.provider : (process.env.DEFAULT_LLM_PROVIDER || 'openai'),
        brandColor: brandColor || '#2563EB',
        welcomeMessage: welcomeMessage || 'Cześć! W czym mogę pomóc?',
        quickReplies: quickReplies || [],
      }
    });

    res.status(201).json(agent);
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ error: 'Błąd podczas tworzenia agenta' });
  }
};

// Update agent
const updateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, llmConfigId, llmModel, brandColor, welcomeMessage, status, quickReplies } = req.body;

    // Check if agent exists and belongs to user
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id
      }
    });

    if (!existingAgent) {
      return res.status(404).json({ error: 'Agent nie znaleziony' });
    }

    if (existingAgent.userId !== req.userId) {
      return res.status(403).json({ error: 'Brak dostępu do tego agenta' });
    }

    // Validation
    if (name && name.trim().length === 0) {
      return res.status(400).json({ error: 'Nazwa agenta nie może być pusta' });
    }

    // If llmConfigId is provided, verify it belongs to user and get its config
    let selectedLlmConfig = null;
    if (llmConfigId !== undefined && llmConfigId !== null && llmConfigId !== '') {
      selectedLlmConfig = await prisma.lLMConfig.findUnique({
        where: { id: llmConfigId }
      });

      if (!selectedLlmConfig || selectedLlmConfig.userId !== req.userId) {
        return res.status(403).json({ error: 'Nieprawidłowa konfiguracja LLM' });
      }
    }

    // Prepare update data
    const updateData = {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(brandColor && { brandColor }),
      ...(welcomeMessage && { welcomeMessage }),
      ...(status && { status }),
      ...(quickReplies !== undefined && { quickReplies: Array.isArray(quickReplies) ? quickReplies.slice(0, 5) : [] }),
    };

    // Handle LLM config changes
    if (llmConfigId !== undefined) {
      if (llmConfigId === '' || llmConfigId === null) {
        // User wants to use default LLM
        updateData.llmConfigId = null;
        updateData.llmModel = process.env.DEFAULT_LLM_MODEL || 'gpt-4o-mini';
        updateData.llmProvider = process.env.DEFAULT_LLM_PROVIDER || 'openai';
      } else if (selectedLlmConfig) {
        // User selected custom LLM
        updateData.llmConfigId = llmConfigId;
        updateData.llmModel = selectedLlmConfig.model;
        updateData.llmProvider = selectedLlmConfig.provider;
      }
    }

    // Count documents to ensure ragEnabled flag is correct
    const docCount = await prisma.document.count({
      where: {
        agentId: id,
        processed: true,
        error: null
      }
    });

    // Add ragEnabled to updateData
    updateData.ragEnabled = (docCount > 0);

    // Update agent
    const agent = await prisma.agent.update({
      where: { id },
      data: updateData
    });

    res.json(agent);
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji agenta' });
  }
};

// Delete agent
const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if agent exists and belongs to user
    const existingAgent = await prisma.agent.findUnique({
      where: { id }
    });

    if (!existingAgent) {
      return res.status(404).json({ error: 'Agent nie znaleziony' });
    }

    if (existingAgent.userId !== req.userId) {
      return res.status(403).json({ error: 'Brak dostępu do tego agenta' });
    }

    // Soft delete agent (preserve for 30 days)
    await prisma.agent.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'inactive'
      }
    });

    res.json({ message: 'Agent został usunięty' });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania agenta' });
  }
};

// Restore agent
const restoreAgent = async (req, res) => {
  try {
    const { id } = req.params;

    const existingAgent = await prisma.agent.findUnique({
      where: { id }
    });

    if (!existingAgent) {
      return res.status(404).json({ error: 'Agent nie znaleziony' });
    }

    if (existingAgent.userId !== req.userId) {
      return res.status(403).json({ error: 'Brak dostępu do tego agenta' });
    }

    await prisma.agent.update({
      where: { id },
      data: {
        deletedAt: null,
        status: 'active'
      }
    });

    res.json({ message: 'Agent został przywrócony' });
  } catch (error) {
    console.error('Restore agent error:', error);
    res.status(500).json({ error: 'Błąd podczas przywracania agenta' });
  }
};

module.exports = {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  restoreAgent
};
