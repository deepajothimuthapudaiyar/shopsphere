import { useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useApp } from './context';
import { Home, Shop, Product, Cart, Checkout, Orders, Profile, Wishlist, Auth, Spin } from './pages';
import Admin from './Admin';

function Nav() {
  const { user, cart, wish, logout } = useApp();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const n = cart.reduce((s, c) => s + c.qty, 0);
  return (
    <header className="sticky top-0 z-40 bg-white/90 shadow-sm backdrop-blur">
      <div className="relative mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link to="/" className="text-2xl font-extrabold text-indigo-600">Shop<span className="text-fuchsia-500">Sphere</span></Link>
        <form className="mx-auto hidden flex-1 md:block md:max-w-md" onSubmit={(e) => { e.preventDefault(); nav('/shop?q=' + encodeURIComponent(e.target.q.value)); }}>
          <input name="q" className="inp" placeholder="Search products..." />
        </form>
        <button className="ml-auto text-2xl md:hidden" onClick={() => setOpen(!open)}>☰</button>
        <nav onClick={() => setOpen(false)} className={(open ? 'flex' : 'hidden') + ' absolute left-0 right-0 top-full flex-col gap-3 bg-white p-4 font-medium shadow md:static md:flex md:flex-row md:items-center md:p-0 md:shadow-none'}>
          <Link to="/shop">Shop</Link>
          <Link to="/wishlist">♡ Wishlist ({wish.length})</Link>
          <Link to="/cart">🛒 Cart ({n})</Link>
          {user ? <>
            <Link to="/orders">Orders</Link>
            {user.role === 'admin' && <Link to="/admin" className="text-fuchsia-600">Admin</Link>}
            <Link to="/profile">Hi, {user.name.split(' ')[0]}</Link>
            <button onClick={logout} className="text-left text-rose-600">Logout</button>
          </> : <><Link to="/login">Login</Link><Link to="/register" className="btn !py-1.5">Sign up</Link></>}
        </nav>
      </div>
    </header>
  );
}
const Private = ({ admin, children }) => {
  const { user, ready } = useApp();
  if (!ready) return <Spin />;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};
export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/cart" element={<Private><Cart /></Private>} />
          <Route path="/checkout" element={<Private><Checkout /></Private>} />
          <Route path="/orders" element={<Private><Orders /></Private>} />
          <Route path="/wishlist" element={<Private><Wishlist /></Private>} />
          <Route path="/profile" element={<Private><Profile /></Private>} />
          <Route path="/admin" element={<Private admin><Admin /></Private>} />
          <Route path="*" element={<div className="py-24 text-center text-xl">Page not found</div>} />
        </Routes>
      </main>
      <footer className="mt-16 bg-slate-900 py-10 text-center text-slate-400">
        <p className="text-xl font-bold text-white">ShopSphere</p>
        <p className="mt-2 text-sm">Modern e-commerce built with the MERN stack · © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
