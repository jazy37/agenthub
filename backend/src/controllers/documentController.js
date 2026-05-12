const { PrismaClient } = require('@prisma/client');
const { uploadFile, deleteFile, getSignedFileUrl } = require('../services/r2.service');
const { processDocument, deleteDocumentVectors } = require('../services/documentProcessing.service');
const { documentQueue } = require('../queues/documentQueue');
const multer = require('multer');
const path = require('path');

const prisma = new PrismaClient();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.pdf', '.txt', '.docx', '.doc'];
    const allowedMimes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExts.includes(ext) && allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nieprawidłowy typ pliku. Dozwolone: PDF, TXT, DOCX'));
    }
  }
}).single('file');

// Get all documents for an agent
const getDocuments = async (req, res) => {
  try {
    const { agentId } = req.params;

    // Verify agent exists and belongs to user
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent nie znaleziony' });
    }

    if (agent.userId !== req.userId) {
      return res.status(403).json({ error: 'Brak dostępu' });
    }

    const documents = await prisma.document.findMany({
      where: { agentId },
      orderBy: { uploadedAt: 'desc' }
    });

    // Generate signed URLs for each document (valid for 1 hour)
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        // Extract key from URL if it's a full URL (for backward compatibility)
        let key = doc.fileUrl;
        if (key.startsWith('http')) {
          // Extract key from URL like: https://pub-xxx.r2.dev/agent_123/file.pdf
          const urlParts = key.split('.r2.dev/');
          key = urlParts.length > 1 ? urlParts[1] : key;
        }

        return {
          ...doc,
          downloadUrl: await getSignedFileUrl(key, 3600) // 1 hour
        };
      })
    );

    res.json(documentsWithUrls);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania dokumentów' });
  }
};

// Get single document
const getDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        agent: true
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Dokument nie znaleziony' });
    }

    // Security check - verify user owns the agent
    if (document.agent.userId !== req.userId) {
      return res.status(403).json({ error: 'Brak dostępu' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania dokumentu' });
  }
};

// Upload document
const uploadDocument = async (req, res) => {
  try {
    // Use multer middleware
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Plik jest za duży. Maksymalny rozmiar: 10MB' });
        }
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Brak pliku' });
      }

      const { agentId } = req.body;

      if (!agentId) {
        return res.status(400).json({ error: 'agentId jest wymagany' });
      }

      // Verify agent exists and belongs to user
      const agent = await prisma.agent.findUnique({
        where: { id: agentId }
      });

      if (!agent) {
        return res.status(404).json({ error: 'Agent nie znaleziony' });
      }

      if (agent.userId !== req.userId) {
        return res.status(403).json({ error: 'Brak dostępu' });
      }

      // Check user plan to enforce Free plan limits
      const user = await prisma.user.findUnique({
        where: { id: req.userId }
      });

      if (user.plan === 'free') {
        return res.status(403).json({
          error: 'Plan FREE nie pozwala na dodawanie bazy wiedzy (RAG). Ulepsz do planu PRO, aby wgrać ten dokument.'
        });
      }

      try {
        // Upload to R2
        const fileUrl = await uploadFile(
          req.file.buffer,
          req.file.originalname,
          agentId,
          req.file.mimetype
        );

        // Get file type
        const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

        // Save to database
        const document = await prisma.document.create({
          data: {
            agentId,
            filename: req.file.originalname,
            fileUrl,
            fileType: ext,
            fileSize: req.file.size
          }
        });

        // Disptach job using BullMQ queue instead of raw promise
        await documentQueue.add('process', { documentId: document.id });
        console.log(`📥 Added document ${document.id} to BullMQ queue`);

        res.status(201).json(document);
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        return res.status(500).json({ error: 'Błąd podczas przesyłania pliku' });
      }
    });
  } catch (error) {
    console.error('Error in upload handler:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        agent: true
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Dokument nie znaleziony' });
    }

    // Security check
    if (document.agent.userId !== req.userId) {
      return res.status(403).json({ error: 'Brak dostępu' });
    }

    // Delete from R2
    try {
      // Extract key if it's a full URL
      let key = document.fileUrl;
      if (key.startsWith('http')) {
        const urlParts = key.split('.r2.dev/');
        key = urlParts.length > 1 ? urlParts[1] : key;
      }
      await deleteFile(key);
    } catch (r2Error) {
      console.error('Error deleting from R2:', r2Error);
      // Continue anyway - file might not exist in R2
    }

    // Delete vectors from Pinecone
    try {
      await deleteDocumentVectors(document.id, document.agent.id);
    } catch (pineconeError) {
      console.error('Error deleting from Pinecone:', pineconeError);
      // Continue anyway
    }

    // Delete from database
    await prisma.document.delete({
      where: { id }
    });

    // Check if agent has any documents left
    const remainingDocs = await prisma.document.count({
      where: { agentId: document.agent.id }
    });

    // If no documents left, disable RAG
    if (remainingDocs === 0) {
      await prisma.agent.update({
        where: { id: document.agent.id },
        data: { ragEnabled: false }
      });
      console.log(`📉 RAG disabled for agent ${document.agent.id} (no documents left)`);
    }

    res.json({ message: 'Dokument usunięty' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania dokumentu' });
  }
};

module.exports = {
  getDocuments,
  getDocument,
  uploadDocument,
  deleteDocument
};
