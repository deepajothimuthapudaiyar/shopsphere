import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Category, Product, Order } from './models.js';
import { protect, admin, wrap } from './middleware.js';
const r = Router();
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone, address: u.address });
const bad = (res, m, c = 400) => res.status(c).json({ message: m });
const pick = (o, ks) => Object.fromEntries(ks.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));
const PF = ['name', 'description', 'price', 'image', 'category', 'stock'];

// ---- Auth
r.post('/auth/register', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return bad(res, 'Name, email and password are required');
  if (!/^\S+@\S+\.\S+$/.test(email)) return bad(res, 'Invalid email address');
  if (password.length < 6) return bad(res, 'Password must be at least 6 characters');
  if (await User.findOne({ email: email.toLowerCase() })) return bad(res, 'Email already registered');
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(u), user: pub(u) });
}));
r.post('/auth/login', wrap(async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) return bad(res, 'Invalid email or password', 401);
  res.json({ token: sign(u), user: pub(u) });
}));
r.get('/auth/me', protect, (req, res) => res.json(pub(req.user)));
r.put('/auth/profile', protect, wrap(async (req, res) => {
  const { name, phone, address, password } = req.body;
  const u = await User.findById(req.user._id);
  if (name) u.name = name;
  if (phone !== undefined) u.phone = phone;
  if (address !== undefined) u.address = address;
  if (password) { if (password.length < 6) return bad(res, 'Password must be at least 6 characters'); u.password = await bcrypt.hash(password, 10); }
  await u.save();
  res.json(pub(u));
}));

// ---- Categories
r.get('/categories', wrap(async (_, res) => res.json(await Category.find().sort('name'))));
r.post('/categories', protect, admin, wrap(async (req, res) => {
  if (!req.body.name) return bad(res, 'Category name required');
  try { res.status(201).json(await Category.create({ name: req.body.name })); } catch { bad(res, 'Category already exists'); }
}));
r.delete('/categories/:id', protect, admin, wrap(async (req, res) => { await Category.findByIdAndDelete(req.params.id); res.json({ ok: true }); }));

// ---- Products
r.get('/products', wrap(async (req, res) => {
  const { q, category, sort, min, max, page = 1, limit = 12 } = req.query;
  const f = {};
  if (q) f.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (category) f.category = category;
  if (min || max) f.price = { ...(min && { $gte: +min }), ...(max && { $lte: +max }) };
  const s = { price_asc: { price: 1 }, price_desc: { price: -1 }, rating: { rating: -1 }, newest: { createdAt: -1 } }[sort] || { createdAt: -1 };
  const total = await Product.countDocuments(f);
  const items = await Product.find(f).sort(s).skip((page - 1) * limit).limit(+limit).select('-reviews');
  res.json({ items, total, pages: Math.ceil(total / limit) });
}));
r.get('/products/:id', wrap(async (req, res) => {
  const p = await Product.findById(req.params.id);
  p ? res.json(p) : bad(res, 'Product not found', 404);
}));
r.post('/products', protect, admin, wrap(async (req, res) => res.status(201).json(await Product.create(pick(req.body, PF)))));
r.put('/products/:id', protect, admin, wrap(async (req, res) => {
  const p = await Product.findByIdAndUpdate(req.params.id, pick(req.body, PF), { new: true, runValidators: true });
  p ? res.json(p) : bad(res, 'Product not found', 404);
}));
r.delete('/products/:id', protect, admin, wrap(async (req, res) => { await Product.findByIdAndDelete(req.params.id); res.json({ ok: true }); }));
r.post('/products/:id/reviews', protect, wrap(async (req, res) => {
  const { rating, comment } = req.body;
  if (!(rating >= 1 && rating <= 5) || !comment) return bad(res, 'Rating (1-5) and comment are required');
  const p = await Product.findById(req.params.id);
  if (!p) return bad(res, 'Product not found', 404);
  if (p.reviews.some((v) => String(v.user) === String(req.user._id))) return bad(res, 'You already reviewed this product');
  p.reviews.push({ user: req.user._id, name: req.user.name, rating: +rating, comment });
  p.numReviews = p.reviews.length;
  p.rating = +(p.reviews.reduce((s, v) => s + v.rating, 0) / p.numReviews).toFixed(1);
  await p.save();
  res.status(201).json(p);
}));

// ---- Cart & wishlist
const cartOf = async (id) => (await User.findById(id).populate('cart.product')).cart.filter((c) => c.product);
r.get('/cart', protect, wrap(async (req, res) => res.json(await cartOf(req.user._id))));
r.put('/cart', protect, wrap(async (req, res) => {
  const cart = (req.body.items || []).filter((i) => i.product && i.qty > 0).map((i) => ({ product: i.product, qty: Math.floor(i.qty) }));
  await User.findByIdAndUpdate(req.user._id, { cart });
  res.json(await cartOf(req.user._id));
}));
r.get('/wishlist', protect, wrap(async (req, res) => res.json((await User.findById(req.user._id).populate('wishlist')).wishlist.filter(Boolean))));
r.post('/wishlist/:id', protect, wrap(async (req, res) => {
  const u = await User.findById(req.user._id);
  const has = u.wishlist.some((w) => String(w) === req.params.id);
  u.wishlist = has ? u.wishlist.filter((w) => String(w) !== req.params.id) : [...u.wishlist, req.params.id];
  await u.save();
  res.json((await User.findById(u._id).populate('wishlist')).wishlist.filter(Boolean));
}));

// ---- Orders
r.post('/orders', protect, wrap(async (req, res) => {
  const { address, payment = 'COD' } = req.body;
  if (!address || address.length < 5) return bad(res, 'A valid shipping address is required');
  const u = await User.findById(req.user._id).populate('cart.product');
  const lines = u.cart.filter((c) => c.product);
  if (!lines.length) return bad(res, 'Your cart is empty');
  for (const l of lines) if (l.product.stock < l.qty) return bad(res, `Only ${l.product.stock} left of ${l.product.name}`);
  const items = lines.map((l) => ({ product: l.product._id, name: l.product.name, price: l.product.price, qty: l.qty, image: l.product.image }));
  const total = +items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);
  for (const l of lines) await Product.updateOne({ _id: l.product._id }, { $inc: { stock: -l.qty } });
  const order = await Order.create({ user: u._id, items, address, payment, total });
  u.cart = []; await u.save();
  res.status(201).json(order);
}));
r.get('/orders/mine', protect, wrap(async (req, res) => res.json(await Order.find({ user: req.user._id }).sort('-createdAt'))));
r.get('/orders', protect, admin, wrap(async (_, res) => res.json(await Order.find().sort('-createdAt').populate('user', 'name email'))));
r.put('/orders/:id/status', protect, admin, wrap(async (req, res) => {
  const o = await Order.findById(req.params.id);
  if (!o) return bad(res, 'Order not found', 404);
  if (!Order.schema.path('status').enumValues.includes(req.body.status)) return bad(res, 'Invalid status');
  if (req.body.status === 'Cancelled' && o.status !== 'Cancelled')
    for (const i of o.items) await Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } });
  o.status = req.body.status; await o.save();
  res.json(o);
}));

// ---- Admin stats
r.get('/admin/stats', protect, admin, wrap(async (_, res) => {
  const ok = { $match: { status: { $ne: 'Cancelled' } } };
  const [users, products, orders, rev, monthly, lowStock] = await Promise.all([
    User.countDocuments(), Product.countDocuments(), Order.countDocuments(),
    Order.aggregate([ok, { $group: { _id: null, t: { $sum: '$total' } } }]),
    Order.aggregate([ok, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, sales: { $sum: '$total' }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }, { $limit: 12 }]),
    Product.find({ stock: { $lte: 5 } }).select('name stock').limit(10)
  ]);
  res.json({ users, products, orders, revenue: rev[0]?.t || 0, monthly, lowStock });
}));
export default r;
