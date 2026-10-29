import jwt from 'jsonwebtoken';
import { User } from './models.js';
export const protect = async (req, res, next) => {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '');
    if (!t) return res.status(401).json({ message: 'Not authorized' });
    const { id } = jwt.verify(t, process.env.JWT_SECRET);
    req.user = await User.findById(id).select('-password');
    if (!req.user) throw new Error('no user');
    next();
  } catch { res.status(401).json({ message: 'Session expired, please login again' }); }
};
export const admin = (req, res, next) => (req.user?.role === 'admin' ? next() : res.status(403).json({ message: 'Admin access only' }));
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
