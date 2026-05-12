const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
} = require('../controllers/settingsController');

router.get('/profile', authMiddleware, getProfile);
router.patch('/profile', authMiddleware, updateProfile);
router.post('/change-password', authMiddleware, changePassword);
router.delete('/account', authMiddleware, deleteAccount);

module.exports = router;
