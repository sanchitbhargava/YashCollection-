const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { AppError } = require('../middleware/errorHandler');
const { isValidObjectId } = require('../utils/helpers');

// @desc    Create Stripe payment intent
// @route   POST /api/payment/create-intent
// @access  Private
const createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!isValidObjectId(orderId)) {
      return next(new AppError('Invalid order ID', 400));
    }

    const safeOrderId = new mongoose.Types.ObjectId(orderId);
    const order = await Order.findById(safeOrderId);
    if (!order) return next(new AppError('Order not found', 404));

    if (order.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    if (order.isPaid) {
      return next(new AppError('Order is already paid', 400));
    }

    // Amount in paise (INR smallest unit)
    const amount = Math.round(order.totalPrice * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'inr',
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: req.user._id.toString(),
      },
      description: `YashCollection Order ${order.orderNumber}`,
      receipt_email: req.user.email,
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    if (error.type && error.type.startsWith('Stripe')) {
      return next(new AppError(`Payment error: ${error.message}`, 400));
    }
    next(error);
  }
};

// @desc    Confirm payment and update order
// @route   POST /api/payment/confirm
// @access  Private
const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    if (!isValidObjectId(orderId)) {
      return next(new AppError('Invalid order ID', 400));
    }

    const safeOrderId = new mongoose.Types.ObjectId(orderId);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return next(new AppError(`Payment not successful. Status: ${paymentIntent.status}`, 400));
    }

    const order = await Order.findById(safeOrderId);
    if (!order) return next(new AppError('Order not found', 404));

    if (order.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.status = 'confirmed';
    order.paymentResult = {
      id: paymentIntent.id,
      status: paymentIntent.status,
      updateTime: new Date().toISOString(),
      emailAddress: req.user.email,
      paymentMethod: 'stripe',
    };

    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    if (error.type && error.type.startsWith('Stripe')) {
      return next(new AppError(`Payment error: ${error.message}`, 400));
    }
    next(error);
  }
};

// @desc    Handle Stripe webhook events
// @route   POST /api/payment/webhook
// @access  Public (Stripe signed)
const stripeWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ success: false, message: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      const orderId = pi.metadata.orderId;
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          isPaid: true,
          paidAt: new Date(),
          status: 'confirmed',
          paymentResult: {
            id: pi.id,
            status: pi.status,
            updateTime: new Date().toISOString(),
            paymentMethod: 'stripe',
          },
        });
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      console.error(`Payment failed for intent: ${pi.id}`);
      break;
    }
    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
};

module.exports = { createPaymentIntent, confirmPayment, stripeWebhook };
