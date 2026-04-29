const express = require('express');
const { body } = require('express-validator');
const {
  createPaymentIntent,
  confirmPayment,
  stripeWebhook,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Webhook must receive raw body — handled in server.js with express.raw()
router.post('/webhook', stripeWebhook);

router.post(
  '/create-intent',
  protect,
  [body('orderId').notEmpty().withMessage('Order ID is required')],
  createPaymentIntent
);

router.post(
  '/confirm',
  protect,
  [
    body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
    body('orderId').notEmpty().withMessage('Order ID is required'),
  ],
  confirmPayment
);

module.exports = router;
