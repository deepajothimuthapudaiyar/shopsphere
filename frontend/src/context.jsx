import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';
const Ctx = createContext();
export const useApp = () => useContext(Ctx);
export function Provider({ children }) {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false), [cart, setCart] = useState([]), [wish, setWish] = useState([]), [toast, setToast] = useState(null);
  const notify = useCallback((msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); }, []);
  const refresh = async () => { try { const [c, w] = await Promise.all([api('/cart'), api('/wishlist')]); setCart(c); setWish(w); } catch {} };
  useEffect(() => {
    if (!localStorage.getItem('token')) { setReady(true); return; }
    api('/auth/me').then((u) => { setUser(u); return refresh(); }).catch(() => localStorage.removeItem('token')).finally(() => setReady(true));
  }, []);
  const auth = async (path, body) => {
    const d = await api(path, { method: 'POST', body });
    localStorage.setItem('token', d.token); setUser(d.user); await refresh(); notify('Welcome, ' + d.user.name);
  };
  const logout = () => { localStorage.removeItem('token'); setUser(null); setCart([]); setWish([]); notify('Logged out'); };
  const needLogin = () => { if (!user) { notify('Please login first', 'err'); return true; } return false; };
  const putCart = async (items) => setCart(await api('/cart', { method: 'PUT', body: { items } }));
  const lines = (skip) => cart.filter((c) => c.product._id !== skip).map((c) => ({ product: c.product._id, qty: c.qty }));
  const addToCart = async (p, qty = 1) => {
    if (needLogin()) return;
    const q = (cart.find((c) => c.product._id === p._id)?.qty || 0) + qty;
    if (q > p.stock) return notify('Not enough stock', 'err');
    try { await putCart([...lines(p._id), { product: p._id, qty: q }]); notify('Added to cart'); } catch (e) { notify(e.message, 'err'); }
  };
  const setQty = async (id, qty) => { try { await putCart([...lines(id), { product: id, qty }]); } catch (e) { notify(e.message, 'err'); } };
  const toggleWish = async (p) => {
    if (needLogin()) return;
    try { setWish(await api('/wishlist/' + p._id, { method: 'POST' })); } catch (e) { notify(e.message, 'err'); }
  };
  return (
    <Ctx.Provider value={{ user, setUser, ready, cart, wish, notify, auth, logout, addToCart, setQty, toggleWish, refresh }}>
      {children}
      {toast && <div className={'fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3 font-medium text-white shadow-xl fade ' + (toast.type === 'err' ? 'bg-rose-600' : 'bg-emerald-600')}>{toast.msg}</div>}
    </Ctx.Provider>
  );
}
