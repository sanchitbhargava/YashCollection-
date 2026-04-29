const Order = require('../models/Order');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');
const { sendOrderConfirmationEmail } = require('../utils/email');
const { isValidObjectId } = require('../utils/helpers');

// Calculate prices helper
const calcPrices = (orderItems) => {
  const itemsPrice = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shippingPrice = itemsPrice > 999 ? 0 : 99; // Free shipping above ₹999
  const taxRate = 0.05; // 5% GST
  const taxPrice = Math.round(itemsPrice * taxRate * 100) / 100;
  const totalPrice = Math.round((itemsPrice + shippingPrice + taxPrice) * 100) / 100;
  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return next(new AppError('No order items provided', 400));
    }

    // Verify products exist and check stock
    const productIds = orderItems.map((item) => item.product);
    const dbProducts = await Product.find({ _id: { $in: productIds }, isActive: true });

    const validatedItems = orderItems.map((item) => {
      const dbProduct = dbProducts.find((p) => p._id.toString() === item.product.toString());
      if (!dbProduct) throw new AppError(`Product ${item.product} not found`, 404);
      if (dbProduct.stock < item.qty) {
        throw new AppError(`Insufficient stock for ${dbProduct.name}`, 400);
      }
      return {
        name: dbProduct.name,
        qty: item.qty,
        image: dbProduct.images[0]?.url || '',
        price: dbProduct.price,
        size: item.size,
        color: item.color,
        product: dbProduct._id,
      };
    });

    const { itemsPrice, shippingPrice, taxPrice, totalPrice } = calcPrices(validatedItems);

    const order = await Order.create({
      user: req.user._id,
      orderItems: validatedItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    });

    // Decrement stock for each product
    await Promise.all(
      validatedItems.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } })
      )
    );

    // Send confirmation email (non-blocking)
    sendOrderConfirmationEmail(order, req.user.email, req.user.name).catch((err) =>
      console.error('Order email error:', err.message)
    );

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new AppError('Invalid order ID', 400));
    }
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) return next(new AppError('Order not found', 404));

    // Allow access only to order owner or admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to view this order', 403));
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new AppError('Invalid order ID', 400));
    }
    const order = await Order.findById(req.params.id);
    if (!order) return next(new AppError('Order not found', 404));
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized', 403));
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.status = 'confirmed';
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      updateTime: req.body.update_time,
      emailAddress: req.body.payer?.email_address || req.user.email,
      paymentMethod: order.paymentMethod,
    };

    const updated = await order.save();
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Admin
const updateOrderToDelivered = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new AppError('Invalid order ID', 400));
    }
    const order = await Order.findById(req.params.id);
    if (!order) return next(new AppError('Order not found', 404));

    order.isDelivered = true;
    order.deliveredAt = new Date();
    order.status = 'delivered';
    if (req.body.trackingNumber) order.trackingNumber = req.body.trackingNumber;
    if (req.body.courier) order.courier = req.body.courier;

    const updated = await order.save();
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments({ user: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Admin
const getAllOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    const allowedStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (req.query.status && allowedStatuses.includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (req.query.isPaid) filter.isPaid = req.query.isPaid === 'true';
    if (req.query.isDelivered) filter.isDelivered = req.query.isDelivered === 'true';

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new AppError('Invalid order ID', 400));
    }
    const { status, trackingNumber, courier, notes, cancelReason } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return next(new AppError(`Invalid status: ${status}`, 400));
    }

    const order = await Order.findById(req.params.id);
    if (!order) return next(new AppError('Order not found', 404));

    // Restore stock on cancellation
    if (status === 'cancelled' && order.status !== 'cancelled') {
      await Promise.all(
        order.orderItems.map((item) =>
          Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } })
        )
      );
    }

    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courier) order.courier = courier;
    if (notes) order.notes = notes;
    if (cancelReason) order.cancelReason = cancelReason;
    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    const updated = await order.save();
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
};
