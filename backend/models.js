import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const ref = (r) => ({ type: Schema.Types.ObjectId, ref: r });
export const User = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phone: String, address: String,
  cart: [{ product: ref('Product'), qty: { type: Number, default: 1 } }],
  wishlist: [ref('Product')]
}, { timestamps: true }));
export const Category = model('Category', new Schema({ name: { type: String, required: true, unique: true, trim: true } }));
export const Product = model('Product', new Schema({
  name: { type: String, required: true, trim: true },
  description: String,
  price: { type: Number, required: true, min: 0 },
  image: String,
  category: { type: String, required: true },
  stock: { type: Number, default: 0, min: 0 },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  reviews: [{ user: ref('User'), name: String, rating: Number, comment: String }]
}, { timestamps: true }));
export const Order = model('Order', new Schema({
  user: ref('User'),
  items: [{ product: ref('Product'), name: String, price: Number, qty: Number, image: String }],
  address: String,
  payment: { type: String, default: 'COD' },
  total: Number,
  status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' }
}, { timestamps: true }));
