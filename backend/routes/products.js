const express = require('express');
const { body, param } = require('express-validator');
const {
  getProducts,
  getFeaturedProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductReviews,
  addProductReview,
} = require('../controllers/productController');
const { protect, admin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:idOrSlug', optionalAuth, getProduct);

router.post(
  '/',
  protect,
  admin,
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('category').isIn(['ladies-kurti', 'investment-kurti']).withMessage('Invalid category'),
    body('images').isArray({ min: 1 }).withMessage('At least one image is required'),
    body('stock').isInt({ min: 0 }).withMessage('Valid stock quantity is required'),
  ],
  createProduct
);

router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

router.get('/:id/reviews', getProductReviews);
router.post(
  '/:id/reviews',
  protect,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').trim().notEmpty().withMessage('Review comment is required'),
  ],
  addProductReview
);

module.exports = router;
