const User = require('../models/User');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const { AppError } = require('../middleware/errorHandler');
const { escapeRegex } = require('../utils/helpers');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-__v')
      .populate('wishlist', 'name slug images price comparePrice rating');
    if (!user) return next(new AppError('User not found', 404));
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'avatar'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // req.user._id is a Mongoose ObjectId set by JWT auth middleware; cast explicitly
    const safeUserId = new mongoose.Types.ObjectId(req.user._id.toString());
    const user = await User.findByIdAndUpdate(safeUserId, updates, {
      new: true,
      runValidators: true,
    }).select('-__v');

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Add address
// @route   POST /api/users/addresses
// @access  Private
const addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError('User not found', 404));

    if (user.addresses.length >= 5) {
      return next(new AppError('Maximum 5 addresses allowed', 400));
    }

    // If this address is set as default, unset others
    if (req.body.isDefault) {
      user.addresses.forEach((addr) => { addr.isDefault = false; });
    }

    // Auto-set as default if first address
    if (user.addresses.length === 0) req.body.isDefault = true;

    user.addresses.push(req.body);
    await user.save();

    res.status(201).json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Update address
// @route   PUT /api/users/addresses/:addressId
// @access  Private
const updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError('User not found', 404));

    const address = user.addresses.id(req.params.addressId);
    if (!address) return next(new AppError('Address not found', 404));

    if (req.body.isDefault) {
      user.addresses.forEach((addr) => { addr.isDefault = false; });
    }

    Object.assign(address, req.body);
    await user.save();

    res.status(200).json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError('User not found', 404));

    const address = user.addresses.id(req.params.addressId);
    if (!address) return next(new AppError('Address not found', 404));

    address.deleteOne();
    await user.save();

    res.status(200).json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wishlist', 'name slug images price comparePrice rating stock isActive');
    // Filter out deactivated products
    const activeWishlist = user.wishlist.filter((p) => p.isActive);
    res.status(200).json({ success: true, count: activeWishlist.length, data: activeWishlist });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to wishlist
// @route   POST /api/users/wishlist
// @access  Private
const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);

    if (user.wishlist.includes(productId)) {
      return res.status(200).json({ success: true, message: 'Already in wishlist' });
    }

    if (user.wishlist.length >= 50) {
      return next(new AppError('Wishlist is full (max 50 items)', 400));
    }

    user.wishlist.push(productId);
    await user.save();

    res.status(200).json({ success: true, message: 'Added to wishlist', data: user.wishlist });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== req.params.productId
    );
    await user.save();

    res.status(200).json({ success: true, message: 'Removed from wishlist', data: user.wishlist });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Admin
const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const ALLOWED_ROLES = ['user', 'admin'];
    const filter = {};
    // Use .find() so the value placed in filter comes from our constant array, not user input
    const safeRole = ALLOWED_ROLES.find((r) => r === req.query.role);
    if (safeRole !== undefined) filter.role = safeRole;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      const escaped = escapeRegex(req.query.search);
      filter.$or = [
        { name: new RegExp(escaped, 'i') },
        { email: new RegExp(escaped, 'i') },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select('-__v').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user (admin)
// @route   GET /api/users/:id
// @access  Admin
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    if (!user) return next(new AppError('User not found', 404));
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete / deactivate user (admin)
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return next(new AppError('Cannot delete your own account via this route', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) return next(new AppError('User not found', 404));

    res.status(200).json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getAllUsers,
  getUserById,
  deleteUser,
};
