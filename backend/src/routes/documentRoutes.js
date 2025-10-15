const express = require('express');
const {
  getDocuments,
  getDocument,
  uploadDocument,
  deleteDocument
} = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all documents for an agent
router.get('/agent/:agentId', getDocuments);

// Get single document
router.get('/:id', getDocument);

// Upload document
router.post('/upload', uploadDocument);

// Delete document
router.delete('/:id', deleteDocument);

module.exports = router;
