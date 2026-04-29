require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const User = require('../models/User');

const products = [
  {
    name: 'Floral Anarkali Kurti',
    slug: 'floral-anarkali-kurti',
    description:
      'Elegant floral print Anarkali kurti crafted from premium cotton fabric. Perfect for festive occasions and casual outings. Features intricate embroidery at the neckline and hem.',
    shortDescription: 'Premium cotton floral Anarkali kurti for festive occasions.',
    price: 899,
    comparePrice: 1299,
    images: [
      { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600', alt: 'Floral Anarkali Kurti Front', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1583391733957-3750e0ff4e8c?w=600', alt: 'Floral Anarkali Kurti Back' },
    ],
    category: 'ladies-kurti',
    collection: 'Festive 2024',
    fabric: 'Cotton',
    sizes: [
      { size: 'S', stock: 10 },
      { size: 'M', stock: 15 },
      { size: 'L', stock: 12 },
      { size: 'XL', stock: 8 },
      { size: 'XXL', stock: 5 },
    ],
    colors: [
      { name: 'Pink', hex: '#FFC0CB' },
      { name: 'Yellow', hex: '#FFFF00' },
    ],
    stock: 50,
    sku: 'YC-ANK-001',
    isFeatured: true,
    tags: ['anarkali', 'floral', 'cotton', 'festive', 'kurti'],
    careInstructions: 'Hand wash in cold water. Do not bleach.',
  },
  {
    name: 'Embroidered Straight Kurti',
    slug: 'embroidered-straight-kurti',
    description:
      'Beautifully embroidered straight-cut kurti in silk blend fabric. The intricate thread work at the yoke and sleeves makes it an ideal choice for festive wear and family gatherings.',
    shortDescription: 'Silk blend straight kurti with beautiful embroidery.',
    price: 1299,
    comparePrice: 1899,
    images: [
      { url: 'https://images.unsplash.com/photo-1614975059251-992f11792b9f?w=600', alt: 'Embroidered Straight Kurti', isPrimary: true },
    ],
    category: 'investment-kurti',
    collection: 'Heritage Collection',
    fabric: 'Silk Blend',
    sizes: [
      { size: 'XS', stock: 5 },
      { size: 'S', stock: 10 },
      { size: 'M', stock: 12 },
      { size: 'L', stock: 10 },
      { size: 'XL', stock: 6 },
    ],
    colors: [
      { name: 'Royal Blue', hex: '#4169E1' },
      { name: 'Maroon', hex: '#800000' },
    ],
    stock: 43,
    sku: 'YC-STR-002',
    isFeatured: true,
    tags: ['embroidered', 'straight', 'silk', 'festive', 'kurti'],
    careInstructions: 'Dry clean recommended.',
  },
  {
    name: 'Casual Cotton A-Line Kurti',
    slug: 'casual-cotton-aline-kurti',
    description:
      'Comfortable and stylish A-line kurti in 100% pure cotton. Perfect for daily wear, office, and casual outings. Features a round neck with button placket and three-quarter sleeves.',
    shortDescription: 'Comfortable 100% cotton A-line kurti for daily wear.',
    price: 599,
    comparePrice: 799,
    images: [
      { url: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600', alt: 'Casual Cotton A-Line Kurti', isPrimary: true },
    ],
    category: 'ladies-kurti',
    collection: 'Everyday Essentials',
    fabric: '100% Cotton',
    sizes: [
      { size: 'S', stock: 20 },
      { size: 'M', stock: 25 },
      { size: 'L', stock: 20 },
      { size: 'XL', stock: 15 },
      { size: 'XXL', stock: 10 },
      { size: 'XXXL', stock: 5 },
    ],
    colors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Sky Blue', hex: '#87CEEB' },
      { name: 'Mint Green', hex: '#98FF98' },
    ],
    stock: 95,
    sku: 'YC-ALINE-003',
    isFeatured: false,
    tags: ['cotton', 'aline', 'casual', 'daily-wear', 'kurti'],
    careInstructions: 'Machine washable. Tumble dry low.',
  },
  {
    name: 'Bandhani Print Kurti',
    slug: 'bandhani-print-kurti',
    description:
      'Traditional Bandhani (tie-dye) print kurti in soft georgette fabric. This ethnic beauty showcases the rich craft heritage of Rajasthan. Perfect for festivals and ethnic wear occasions.',
    shortDescription: 'Traditional Bandhani print georgette kurti.',
    price: 749,
    comparePrice: 999,
    images: [
      { url: 'https://images.unsplash.com/photo-1583391733998-e4b6d7a9a6e3?w=600', alt: 'Bandhani Print Kurti', isPrimary: true },
    ],
    category: 'ladies-kurti',
    collection: 'Ethnic Heritage',
    fabric: 'Georgette',
    sizes: [
      { size: 'S', stock: 8 },
      { size: 'M', stock: 12 },
      { size: 'L', stock: 10 },
      { size: 'XL', stock: 7 },
    ],
    colors: [
      { name: 'Red & White', hex: '#FF0000' },
      { name: 'Blue & White', hex: '#0000FF' },
    ],
    stock: 37,
    sku: 'YC-BAND-004',
    isFeatured: true,
    tags: ['bandhani', 'georgette', 'ethnic', 'festive', 'kurti', 'rajasthani'],
    careInstructions: 'Hand wash separately in cold water.',
  },
  {
    name: 'Chikankari Lucknowi Kurti',
    slug: 'chikankari-lucknowi-kurti',
    description:
      'Authentic Lucknowi Chikankari embroidery on premium cotton lawn fabric. This timeless piece features delicate white thread embroidery with intricate patterns. A must-have investment piece.',
    shortDescription: 'Authentic Lucknowi Chikankari embroidery on cotton lawn.',
    price: 1899,
    comparePrice: 2599,
    images: [
      { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600', alt: 'Chikankari Lucknowi Kurti', isPrimary: true },
    ],
    category: 'investment-kurti',
    collection: 'Lucknowi Craft',
    fabric: 'Cotton Lawn',
    sizes: [
      { size: 'XS', stock: 3 },
      { size: 'S', stock: 5 },
      { size: 'M', stock: 8 },
      { size: 'L', stock: 6 },
      { size: 'XL', stock: 4 },
    ],
    colors: [
      { name: 'Off-White', hex: '#FAF0E6' },
      { name: 'Pastel Pink', hex: '#FFD1DC' },
    ],
    stock: 26,
    sku: 'YC-CHIK-005',
    isFeatured: true,
    tags: ['chikankari', 'lucknowi', 'embroidery', 'cotton', 'investment', 'kurti'],
    careInstructions: 'Hand wash gently. Do not wring. Dry in shade.',
  },
  {
    name: 'Block Print Jaipur Kurti',
    slug: 'block-print-jaipur-kurti',
    description:
      'Hand block printed kurti using traditional Jaipur printing techniques on pure cotton fabric. Natural vegetable dyes used for eco-friendly and skin-friendly wear. Each piece is unique.',
    shortDescription: 'Hand block printed Jaipur style kurti in pure cotton.',
    price: 699,
    comparePrice: 999,
    images: [
      { url: 'https://images.unsplash.com/photo-1585914641050-fa883a1cced6?w=600', alt: 'Block Print Jaipur Kurti', isPrimary: true },
    ],
    category: 'ladies-kurti',
    collection: 'Artisan Craft',
    fabric: 'Pure Cotton',
    sizes: [
      { size: 'S', stock: 10 },
      { size: 'M', stock: 15 },
      { size: 'L', stock: 12 },
      { size: 'XL', stock: 8 },
      { size: 'XXL', stock: 4 },
    ],
    colors: [
      { name: 'Indigo Blue', hex: '#4B0082' },
      { name: 'Mustard', hex: '#FFDB58' },
      { name: 'Rust', hex: '#B7410E' },
    ],
    stock: 49,
    sku: 'YC-BLOCK-006',
    isFeatured: false,
    tags: ['block-print', 'jaipur', 'cotton', 'handmade', 'eco-friendly', 'kurti'],
    careInstructions: 'Hand wash cold. First wash separately.',
  },
  {
    name: 'Phulkari Embroidered Kurti',
    slug: 'phulkari-embroidered-kurti',
    description:
      'Vibrant Phulkari embroidered kurti from Punjab. Richly embroidered with colorful floss threads in traditional floral patterns. Perfect for Punjabi festivals, wedding functions, and cultural events.',
    shortDescription: 'Vibrant Phulkari embroidered kurti — Punjabi tradition.',
    price: 1499,
    comparePrice: 2099,
    images: [
      { url: 'https://images.unsplash.com/photo-1583391734030-e4b6d7a9a6e3?w=600', alt: 'Phulkari Embroidered Kurti', isPrimary: true },
    ],
    category: 'investment-kurti',
    collection: 'Punjabi Heritage',
    fabric: 'Cotton Dupion',
    sizes: [
      { size: 'S', stock: 6 },
      { size: 'M', stock: 8 },
      { size: 'L', stock: 8 },
      { size: 'XL', stock: 5 },
    ],
    colors: [
      { name: 'Bright Orange', hex: '#FF7722' },
      { name: 'Deep Pink', hex: '#FF1493' },
    ],
    stock: 27,
    sku: 'YC-PHUL-007',
    isFeatured: true,
    tags: ['phulkari', 'embroidery', 'punjabi', 'festive', 'investment', 'kurti'],
    careInstructions: 'Dry clean only for best results.',
  },
  {
    name: 'Rayon Crepe Kurti with Pants',
    slug: 'rayon-crepe-kurti-with-pants',
    description:
      'Stylish rayon crepe kurti paired with matching palazzo pants. Features digital print with contemporary design. A complete ensemble perfect for casual outings, festive occasions, and family events.',
    shortDescription: 'Rayon crepe kurti with matching palazzo pants set.',
    price: 999,
    comparePrice: 1399,
    images: [
      { url: 'https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=600', alt: 'Rayon Crepe Kurti with Pants', isPrimary: true },
    ],
    category: 'ladies-kurti',
    collection: 'Coord Sets',
    fabric: 'Rayon Crepe',
    sizes: [
      { size: 'S', stock: 10 },
      { size: 'M', stock: 15 },
      { size: 'L', stock: 12 },
      { size: 'XL', stock: 8 },
      { size: 'XXL', stock: 5 },
    ],
    colors: [
      { name: 'Teal', hex: '#008080' },
      { name: 'Plum', hex: '#DDA0DD' },
    ],
    stock: 50,
    sku: 'YC-SET-008',
    isFeatured: false,
    tags: ['rayon', 'crepe', 'palazzo', 'set', 'casual', 'kurti'],
    careInstructions: 'Machine wash cold, gentle cycle.',
  },
  {
    name: 'Zari Work Silk Kurti',
    slug: 'zari-work-silk-kurti',
    description:
      'Opulent pure silk kurti with intricate Zari (gold thread) work. Handcrafted by skilled artisans, this kurti is a true investment piece that becomes more valuable over time. Perfect for weddings and grand occasions.',
    shortDescription: 'Pure silk kurti with handcrafted Zari gold thread work.',
    price: 3499,
    comparePrice: 4999,
    images: [
      { url: 'https://images.unsplash.com/photo-1583401692493-b7b6e4e2e9c0?w=600', alt: 'Zari Work Silk Kurti', isPrimary: true },
    ],
    category: 'investment-kurti',
    collection: 'Bridal Collection',
    fabric: 'Pure Silk',
    sizes: [
      { size: 'S', stock: 3 },
      { size: 'M', stock: 5 },
      { size: 'L', stock: 4 },
      { size: 'XL', stock: 3 },
    ],
    colors: [
      { name: 'Gold & Red', hex: '#FFD700' },
      { name: 'Gold & Green', hex: '#006400' },
    ],
    stock: 15,
    sku: 'YC-ZARI-009',
    isFeatured: true,
    tags: ['zari', 'silk', 'bridal', 'wedding', 'investment', 'luxury', 'kurti'],
    careInstructions: 'Dry clean only. Store in muslin cloth.',
  },
  {
    name: 'Tie-Dye Shibori Kurti',
    slug: 'tie-dye-shibori-kurti',
    description:
      'Trendy Shibori tie-dye kurti in lightweight rayon fabric. Modern interpretation of ancient Japanese dyeing technique with Indian sensibility. Perfect for beach trips, casual outings, and summer evenings.',
    shortDescription: 'Trendy Shibori tie-dye rayon kurti for summer.',
    price: 549,
    comparePrice: 799,
    images: [
      { url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600', alt: 'Tie-Dye Shibori Kurti', isPrimary: true },
    ],
    category: 'ladies-kurti',
    collection: 'Summer Breeze',
    fabric: 'Rayon',
    sizes: [
      { size: 'XS', stock: 8 },
      { size: 'S', stock: 15 },
      { size: 'M', stock: 18 },
      { size: 'L', stock: 12 },
      { size: 'XL', stock: 8 },
    ],
    colors: [
      { name: 'Blue & White', hex: '#1F75FE' },
      { name: 'Purple & White', hex: '#9B59B6' },
    ],
    stock: 61,
    sku: 'YC-TIE-010',
    isFeatured: false,
    tags: ['shibori', 'tie-dye', 'rayon', 'summer', 'casual', 'kurti'],
    careInstructions: 'Hand wash cold separately.',
  },
  {
    name: 'Mirror Work Kutchi Kurti',
    slug: 'mirror-work-kutchi-kurti',
    description:
      'Stunning Kutchi mirror work kurti from Gujarat. Handcrafted with tiny mirrors, colorful embroidery, and traditional motifs by skilled artisans. An heirloom piece that celebrates India\'s rich craft heritage.',
    shortDescription: 'Handcrafted Kutchi mirror work kurti — heirloom quality.',
    price: 2299,
    comparePrice: 3199,
    images: [
      { url: 'https://images.unsplash.com/photo-1583401693400-b7b6e4e2e9c1?w=600', alt: 'Mirror Work Kutchi Kurti', isPrimary: true },
    ],
    category: 'investment-kurti',
    collection: 'Kutch Craft',
    fabric: 'Cotton Cambric',
    sizes: [
      { size: 'S', stock: 4 },
      { size: 'M', stock: 6 },
      { size: 'L', stock: 5 },
      { size: 'XL', stock: 3 },
    ],
    colors: [
      { name: 'Turquoise', hex: '#40E0D0' },
      { name: 'Crimson', hex: '#DC143C' },
    ],
    stock: 18,
    sku: 'YC-MIRR-011',
    isFeatured: true,
    tags: ['mirror-work', 'kutchi', 'gujarati', 'handmade', 'investment', 'kurti'],
    careInstructions: 'Dry clean only. Handle mirrors gently.',
  },
  {
    name: 'Linen Summer Kurti',
    slug: 'linen-summer-kurti',
    description:
      'Breathable 100% linen kurti perfect for Indian summers. Minimal design with clean lines and a mandarin collar. Available in earthy, natural tones. Anti-bacterial and eco-friendly fabric.',
    shortDescription: '100% linen breathable kurti for Indian summers.',
    price: 849,
    comparePrice: 1199,
    images: [
      { url: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600', alt: 'Linen Summer Kurti', isPrimary: true },
    ],
    category: 'ladies-kurti',
    collection: 'Summer Breeze',
    fabric: '100% Linen',
    sizes: [
      { size: 'XS', stock: 5 },
      { size: 'S', stock: 12 },
      { size: 'M', stock: 15 },
      { size: 'L', stock: 12 },
      { size: 'XL', stock: 8 },
      { size: 'XXL', stock: 5 },
      { size: 'XXXL', stock: 3 },
    ],
    colors: [
      { name: 'Natural Beige', hex: '#F5F5DC' },
      { name: 'Olive', hex: '#808000' },
      { name: 'Charcoal', hex: '#36454F' },
    ],
    stock: 60,
    sku: 'YC-LIN-012',
    isFeatured: false,
    tags: ['linen', 'summer', 'breathable', 'eco-friendly', 'minimal', 'kurti'],
    careInstructions: 'Machine wash cold. Iron while slightly damp.',
  },
];

const adminUser = {
  name: 'Yash Admin',
  email: 'admin@yashcollection.com',
  password: 'Admin@123',
  role: 'admin',
};

const importData = async () => {
  try {
    await connectDB();

    await Product.deleteMany();
    await User.deleteMany({ role: 'admin' });

    const admin = await User.create(adminUser);
    console.log(`✅ Admin user created: ${admin.email}`);

    await Product.insertMany(products);
    console.log(`✅ ${products.length} products seeded successfully`);

    console.log('\n🌱 Data seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await Product.deleteMany();
    await User.deleteMany();
    console.log('🗑️  All data destroyed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Destroy error:', error.message);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
