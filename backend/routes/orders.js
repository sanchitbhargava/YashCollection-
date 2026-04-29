const express = require('express');
const { body } = require('express-validator');
const {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/my-orders', protect, getMyOrders);
router.get('/', protect, admin, getAllOrders);

router.post(
  '/',
  protect,
  [
    body('orderItems').isArray({ min: 1 }).withMessage('At least one order item is required'),
    body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
    body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
    body('shippingAddress.phone').trim().notEmpty().withMessage('Phone is required'),
    body('shippingAddress.addressLine1').trim().notEmpty().withMessage('Address line 1 is required'),
    body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
    body('shippingAddress.state').trim().notEmpty().withMessage('State is required'),
    body('shippingAddress.pincode').trim().notEmpty().withMessage('Pincode is required'),
    body('paymentMethod')
      .isIn(['stripe', 'cod', 'upi', 'netbanking'])
      .withMessage('Invalid payment method'),
  ],
  createOrder
);

router.get('/:id', protect, getOrderById);
router.put('/:id/pay', protect, updateOrderToPaid);
router.put('/:id/deliver', protect, admin, updateOrderToDelivered);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;
