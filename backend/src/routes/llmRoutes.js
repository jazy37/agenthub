const express = require('express');
const {
  getLLMConfigs,
  getLLMConfig,
  createLLMConfig,
  updateLLMConfig,
  deleteLLMConfig
} = require('../controllers/llmController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', getLLMConfigs);
router.get('/:id', getLLMConfig);
router.post('/', createLLMConfig);
router.put('/:id', updateLLMConfig);
router.delete('/:id', deleteLLMConfig);

module.exports = router;
