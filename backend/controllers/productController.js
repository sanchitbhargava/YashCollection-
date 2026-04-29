const Product = require('../models/Product');
const Review = require('../models/Review');
const { AppError } = require('../middleware/errorHandler');
const { escapeRegex, isValidObjectId } = require('../utils/helpers');

// Build filter query from request params
const buildProductFilter = (query) => {
  const filter = { isActive: true };

  if (query.category) filter.category = query.category;
  if (query.collection) filter.collection = new RegExp(escapeRegex(query.collection), 'i');
  if (query.fabric) filter.fabric = new RegExp(escapeRegex(query.fabric), 'i');
  if (query.isFeatured === 'true') filter.isFeatured = true;

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  if (query.sizes) {
    const sizesArr = query.sizes.split(',');
    filter['sizes.size'] = { $in: sizesArr };
  }

  if (query.colors) {
    const colorsArr = query.colors.split(',').map((c) => new RegExp(escapeRegex(c.trim()), 'i'));
    filter['colors.name'] = { $in: colorsArr };
  }

  if (query.minRating) {
    filter.rating = { $gte: Number(query.minRating) };
  }

  if (query.inStock === 'true') {
    filter.stock = { $gt: 0 };
  }

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  return filter;
};

// @desc    Get all products with filters/sorting/pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const filter = buildProductFilter(req.query);

    // Sorting
    let sort = { createdAt: -1 };
    if (req.query.sort) {
      const sortMap = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        'price-asc': { price: 1 },
        'price-desc': { price: -1 },
        rating: { rating: -1 },
        popular: { numReviews: -1 },
      };
      sort = sortMap[req.query.sort] || sort;
    }
    if (req.query.search) {
      sort = { score: { $meta: 'textScore' }, ...sort };
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select('-__v')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 8;
    const products = await Product.find({ isFeatured: true, isActive: true })
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by id or slug
// @route   GET /api/products/:idOrSlug
// @access  Public
const getProduct = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = /^[a-f\d]{24}$/i.test(idOrSlug);
    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };

    const product = await Product.findOne({ ...query, isActive: true })
      .select('-__v')
      .populate({
        path: 'reviews',
        populate: { path: 'user', select: 'name avatar' },
        options: { sort: { createdAt: -1 }, limit: 20 },
      })
      .lean({ virtuals: true });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Admin
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin
const updateProduct = async (req, res, next) => {
  try {
    // Regenerate slug if name changed — safe, bounded character-class regex
    if (req.body.name) {
      req.body.slug = req.body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) return next(new AppError('Product not found', 404));
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (soft delete)
// @route   DELETE /api/products/:id
// @access  Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) return next(new AppError('Product not found', 404));
    res.status(200).json({ success: true, message: 'Product removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
const getProductReviews = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new AppError('Invalid product ID', 400));
    }
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ product: req.params.id })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ product: req.params.id }),
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
const addProductReview = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new AppError('Invalid product ID', 400));
    }
    const product = await Product.findOne({ _id: req.params.id, isActive: true });
    if (!product) return next(new AppError('Product not found', 404));

    const existingReview = await Review.findOne({
      user: req.user._id,
      product: req.params.id,
    });
    if (existingReview) {
      return next(new AppError('You have already reviewed this product', 400));
    }

    const review = await Review.create({
      user: req.user._id,
      product: req.params.id,
      rating: req.body.rating,
      title: req.body.title,
      comment: req.body.comment,
    });

    await review.populate('user', 'name avatar');
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductReviews,
  addProductReview,
};
