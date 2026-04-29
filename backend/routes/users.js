const express = require('express');
const { body } = require('express-validator');
const {
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
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Profile routes
router.get('/profile', protect, getUserProfile);
router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().isLength({ max: 100 }).withMessage('Name too long'),
    body('phone').optional().trim(),
  ],
  updateUserProfile
);

// Address routes
router.post(
  '/addresses',
  protect,
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('addressLine1').trim().notEmpty().withMessage('Address line 1 is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('pincode').trim().notEmpty().withMessage('Pincode is required'),
  ],
  addAddress
);
router.put('/addresses/:addressId', protect, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);

// Wishlist routes
router.get('/wishlist', protect, getWishlist);
router.post(
  '/wishlist',
  protect,
  [body('productId').notEmpty().withMessage('Product ID is required')],
  addToWishlist
);
router.delete('/wishlist/:productId', protect, removeFromWishlist);

// Admin routes
router.get('/', protect, admin, getAllUsers);
router.get('/:id', protect, admin, getUserById);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
