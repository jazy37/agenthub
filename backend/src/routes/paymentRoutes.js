const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create-checkout-session', authMiddleware, paymentController.createCheckout);
router.post('/create-portal-session', authMiddleware, paymentController.createPortal);

module.exports = router;
