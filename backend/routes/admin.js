const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');
const { protect, admin } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// All admin routes require auth + admin role
router.use(protect, admin);

// @desc    Dashboard summary stats
// @route   GET /api/admin/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      revenueResult,
      pendingOrders,
      lowStockProducts,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.countDocuments({ status: 'pending' }),
      Product.find({ stock: { $lte: 5 }, isActive: true })
        .select('name stock images')
        .sort({ stock: 1 })
        .limit(10)
        .lean(),
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Order.aggregate([
        { $unwind: '$orderItems' },
        {
          $group: {
            _id: '$orderItems.product',
            name: { $first: '$orderItems.name' },
            totalSold: { $sum: '$orderItems.qty' },
            revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue,
          pendingOrders,
        },
        lowStockProducts,
        recentOrders,
        topProducts,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Revenue analytics by period
// @route   GET /api/admin/analytics/revenue
router.get('/analytics/revenue', async (req, res, next) => {
  try {
    const { period = 'monthly', year } = req.query;
    const selectedYear = parseInt(year, 10) || new Date().getFullYear();

    let groupFormat;
    if (period === 'daily') {
      groupFormat = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };
    } else if (period === 'weekly') {
      groupFormat = { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } };
    } else {
      groupFormat = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
    }

    const revenue = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: {
            $gte: new Date(`${selectedYear}-01-01`),
            $lte: new Date(`${selectedYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    res.status(200).json({ success: true, data: revenue });
  } catch (error) {
    next(error);
  }
});

// @desc    Order status breakdown
// @route   GET /api/admin/analytics/orders
router.get('/analytics/orders', async (req, res, next) => {
  try {
    const statusBreakdown = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
      { $sort: { count: -1 } },
    ]);

    const categoryRevenue = await Order.aggregate([
      { $match: { isPaid: true } },
      { $unwind: '$orderItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.category',
          totalSold: { $sum: '$orderItems.qty' },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } },
        },
      },
    ]);

    res.status(200).json({ success: true, data: { statusBreakdown, categoryRevenue } });
  } catch (error) {
    next(error);
  }
});

// @desc    Product inventory overview
// @route   GET /api/admin/analytics/inventory
router.get('/analytics/inventory', async (req, res, next) => {
  try {
    const [categoryBreakdown, stockStatus] = await Promise.all([
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalStock: { $sum: '$stock' },
            avgPrice: { $avg: '$price' },
          },
        },
      ]),
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
            lowStock: { $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', 5] }] }, 1, 0] } },
            inStock: { $sum: { $cond: [{ $gt: ['$stock', 5] }, 1, 0] } },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        categoryBreakdown,
        stockStatus: stockStatus[0] || { outOfStock: 0, lowStock: 0, inStock: 0 },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    User growth analytics
// @route   GET /api/admin/analytics/users
router.get('/analytics/users', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const roleBreakdown = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    res.status(200).json({ success: true, data: { userGrowth, roleBreakdown } });
  } catch (error) {
    next(error);
  }
});

// @desc    Manage a review (delete)
// @route   DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return next(new AppError('Review not found', 404));
    res.status(200).json({ success: true, message: 'Review removed' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
