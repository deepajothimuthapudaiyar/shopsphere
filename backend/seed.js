import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Category, Product } from './models.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'frontend', 'public', 'products');
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(jpg|jpeg|png|webp|avif|jfif)$/i.test(f)) : [];
console.log('Photos folder:', dir);
console.log('Photos found:', files.length, files);

const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const K = {
  'Wireless Headphones': ['headphone'], 'Smart Watch Pro': ['watch'], 'Bluetooth Speaker': ['speaker'], '4K Action Camera': ['camera'],
  'Classic Denim Jacket': ['jacket', 'denim'], 'Leather Sneakers': ['sneaker'], 'Minimal Backpack': ['backpack'], 'Aviator Sunglasses': ['sunglass', 'aviator'],
  'Ceramic Table Lamp': ['lamp'], 'Cotton Bedding Set': ['bedding', 'bed'], 'Espresso Coffee Maker': ['coffee', 'espresso'], 'Scented Candle Trio': ['candle'],
  'Yoga Mat Premium': ['yoga'], 'Adjustable Dumbbells': ['dumbbell'], 'Running Shoes Air': ['running', 'shoes'], 'Vitamin C Serum': ['serum', 'vitamin']
};
const placeholder = (name) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#e2e8f0"/><text x="300" y="310" font-size="30" text-anchor="middle" fill="#64748b" font-family="Arial">${name}</text></svg>`);

const imageFor = (name) => {
  const keys = [clean(name), ...(K[name] || [])];
  const f = files.find((x) => { const c = clean(x.replace(/\.[^.]+$/, '')); return keys.some((k) => c.includes(k)); });
  if (f) { console.log('OK       ', name, '->', f); return '/products/' + encodeURIComponent(f); }
  console.log('NO PHOTO ', name);
  return placeholder(name);
};

const cats = ['Electronics', 'Fashion', 'Home', 'Sports', 'Beauty'];
const P = [
  ['Wireless Headphones', 'Electronics', 89, 40], ['Smart Watch Pro', 'Electronics', 149, 25], ['Bluetooth Speaker', 'Electronics', 59, 60], ['4K Action Camera', 'Electronics', 199, 15],
  ['Classic Denim Jacket', 'Fashion', 79, 30], ['Leather Sneakers', 'Fashion', 99, 45], ['Minimal Backpack', 'Fashion', 49, 50], ['Aviator Sunglasses', 'Fashion', 39, 70],
  ['Ceramic Table Lamp', 'Home', 45, 35], ['Cotton Bedding Set', 'Home', 69, 20], ['Espresso Coffee Maker', 'Home', 129, 12], ['Scented Candle Trio', 'Home', 25, 80],
  ['Yoga Mat Premium', 'Sports', 35, 55], ['Adjustable Dumbbells', 'Sports', 119, 18], ['Running Shoes Air', 'Sports', 109, 40], ['Vitamin C Serum', 'Beauty', 29, 65]
];

await mongoose.connect(process.env.MONGO_URI);
await Category.deleteMany();
await Product.deleteMany();
await Category.insertMany(cats.map((name) => ({ name })));
await Product.insertMany(P.map(([name, category, price, stock], i) => ({
  name, category, price, stock,
  rating: +(4 + (i % 10) / 10).toFixed(1),
  numReviews: 5 + i,
  description: `${name} - premium quality, thoughtfully designed and built to last. Free returns within 7 days.`,
  image: imageFor(name)
})));
const email = process.env.ADMIN_EMAIL || 'admin@shopsphere.com';
if (!(await User.findOne({ email }))) {
  await User.create({ name: 'Admin', email, password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10), role: 'admin' });
}
console.log('Seeded categories, products and admin:', email);
process.exit(0);