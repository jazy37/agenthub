const express = require('express');
const { register, login, getMe, verifyEmail, forgotPassword, resetPassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { loginRateLimiter } = require('../utils/rateLimiter');

const router = express.Router();

router.post('/register', register);
router.post('/login', loginRateLimiter, login);
router.get('/me', authMiddleware, getMe);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
