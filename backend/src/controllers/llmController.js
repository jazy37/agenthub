const { PrismaClient } = require('@prisma/client');
const { encrypt, decrypt } = require('../services/encryption.service');

const prisma = new PrismaClient();

// Get all LLM configs for current user
const getLLMConfigs = async (req, res) => {
  try {
    const llmConfigs = await prisma.lLMConfig.findMany({
      where: { userId: req.userId },
      select: {
        id: true,
        name: true,
        provider: true,
        model: true,
        baseUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { agents: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(llmConfigs);
  } catch (error) {
    console.error('Error fetching LLM configs:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Get single LLM config
const getLLMConfig = async (req, res) => {
  try {
    const { id } = req.params;

    const llmConfig = await prisma.lLMConfig.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        name: true,
        provider: true,
        model: true,
        baseUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { agents: true }
        }
      }
    });

    if (!llmConfig) {
      return res.status(404).json({ error: 'Konfiguracja LLM nie znaleziona' });
    }

    // Security check
    if (llmConfig.userId !== req.userId) {
      return res.status(403).json({ error: 'Brak dostępu' });
    }

    res.json(llmConfig);
  } catch (error) {
    console.error('Error fetching LLM config:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Create new LLM config
const createLLMConfig = async (req, res) => {
  try {
    const { name, provider, model, apiKey, baseUrl } = req.body;

    // Validation
    if (!name || !provider || !model || !apiKey) {
      return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
    }

    // Encrypt API key
    const apiKeyEncrypted = encrypt(apiKey);

    const llmConfig = await prisma.lLMConfig.create({
      data: {
        userId: req.userId,
        name,
        provider,
        model,
        apiKeyEncrypted,
        baseUrl: baseUrl || null
      },
      select: {
        id: true,
        name: true,
        provider: true,
        model: true,
        baseUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json(llmConfig);
  } catch (error) {
    console.error('Error creating LLM config:', error);
    res.status(500).json({ error: 'Błąd podczas tworzenia konfiguracji' });
  }
};

// Update LLM config
const updateLLMConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, provider, model, apiKey, baseUrl } = req.body;

    // Check if LLM config exists and belongs to user
    const existing = await prisma.lLMConfig.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Konfiguracja LLM nie znaleziona' });
    }

    if (existing.userId !== req.userId) {
      return res.status(403).json({ error: 'Brak dostępu' });
    }

    // Prepare update data
    const updateData = {
      name,
      provider,
      model,
      baseUrl: baseUrl || null
    };

    // Only update API key if provided
    if (apiKey) {
      updateData.apiKeyEncrypted = encrypt(apiKey);
    }

    const llmConfig = await prisma.lLMConfig.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        provider: true,
        model: true,
        baseUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(llmConfig);
  } catch (error) {
    console.error('Error updating LLM config:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji' });
  }
};

// Delete LLM config
const deleteLLMConfig = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if LLM config exists and belongs to user
    const existing = await prisma.lLMConfig.findUnique({
      where: { id },
      include: {
        _count: {
          select: { agents: true }
        }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Konfiguracja LLM nie znaleziona' });
    }

    if (existing.userId !== req.userId) {
      return res.status(403).json({ error: 'Brak dostępu' });
    }

    // Check if any agents are using this config
    if (existing._count.agents > 0) {
      return res.status(400).json({
        error: `Nie można usunąć konfiguracji używanej przez ${existing._count.agents} agentów. Najpierw zmień ich konfigurację.`
      });
    }

    await prisma.lLMConfig.delete({
      where: { id }
    });

    res.json({ message: 'Konfiguracja LLM usunięta' });
  } catch (error) {
    console.error('Error deleting LLM config:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania' });
  }
};

module.exports = {
  getLLMConfigs,
  getLLMConfig,
  createLLMConfig,
  updateLLMConfig,
  deleteLLMConfig
};
