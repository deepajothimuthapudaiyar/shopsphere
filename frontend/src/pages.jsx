import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from './api';
import { useApp } from './context';

export const money = (n) => '$' + Number(n).toFixed(2);
export const Spin = () => <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>;
export const Empty = ({ text, to, cta }) => <div className="py-20 text-center"><p className="text-lg text-slate-500">{text}</p>{to && <Link to={to} className="btn mt-4">{cta}</Link>}</div>;
const Stars = ({ v }) => <span className="text-amber-400">{'★'.repeat(Math.round(v))}<span className="text-slate-300">{'★'.repeat(5 - Math.round(v))}</span></span>;
function useGet(path) {
  const [d, setD] = useState(null), [err, setErr] = useState('');
  useEffect(() => { setD(null); setErr(''); api(path).then(setD).catch((e) => setErr(e.message)); }, [path]);
  return [d, err, setD];
}

function Card({ p }) {
  const { addToCart, toggleWish, wish } = useApp();
  const liked = wish.some((w) => w._id === p._id);
  return (
    <div className="fade group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative overflow-hidden">
        <Link to={'/product/' + p._id}><img src={p.image} alt={p.name} loading="lazy" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-110" /></Link>
        <button onClick={() => toggleWish(p)} className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow">{liked ? '❤️' : '🤍'}</button>
        {p.stock === 0 && <span className="absolute left-3 top-3 rounded bg-rose-600 px-2 py-1 text-xs text-white">Sold out</span>}
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-indigo-500">{p.category}</p>
        <Link to={'/product/' + p._id} className="block truncate font-semibold">{p.name}</Link>
        <Stars v={p.rating} /> <span className="text-xs text-slate-400">({p.numReviews})</span>
        <div className="mt-2 flex items-center justify-between">
          <b className="text-lg">{money(p.price)}</b>
          <button disabled={!p.stock} onClick={() => addToCart(p)} className="btn !px-3 !py-1.5 text-sm">Add</button>
        </div>
      </div>
    </div>
  );
}
const Grid = ({ d, err }) => err ? <Empty text={err} /> : !d ? <Spin /> : !d.items.length ? <Empty text="No products found" /> : <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{d.items.map((p) => <Card key={p._id} p={p} />)}</div>;

export function Home() {
  const [feat, e1] = useGet('/products?sort=rating&limit=8'), [cats] = useGet('/categories'), [nw, e2] = useGet('/products?sort=newest&limit=4');
  return (
    <div>
      <section className="bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-600 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-20 md:grid-cols-2">
          <div className="fade">
            <span className="rounded-full bg-white/20 px-4 py-1 text-sm">New season · Free shipping over $50</span>
            <h1 className="mt-5 text-5xl font-extrabold leading-tight md:text-6xl">Shop smarter with ShopSphere</h1>
            <p className="mt-4 max-w-md text-lg text-indigo-100">Trending electronics, fashion, home essentials and more, delivered to your door.</p>
            <Link to="/shop" className="btn mt-8 !bg-white !text-indigo-700 hover:!bg-indigo-50">Shop now →</Link>
          </div>
          <img src="https://picsum.photos/seed/shopsphere-hero/700/500" className="fade rounded-3xl shadow-2xl" alt="" />
        </div>
      </section>
      <div className="mx-auto max-w-7xl space-y-14 px-4 py-14">
        <section>
          <h2 className="mb-5 text-2xl font-bold">Shop by category</h2>
          {!cats ? <Spin /> : <div className="grid grid-cols-2 gap-4 md:grid-cols-5">{cats.map((c) => (
            <Link key={c._id} to={'/shop?category=' + encodeURIComponent(c.name)} className="rounded-2xl bg-white p-6 text-center font-semibold shadow-sm transition hover:-translate-y-1 hover:bg-indigo-600 hover:text-white hover:shadow-lg">{c.name}</Link>))}</div>}
        </section>
        <section><h2 className="mb-5 text-2xl font-bold">Top rated</h2><Grid d={feat} err={e1} /></section>
        <section><h2 className="mb-5 text-2xl font-bold">New arrivals</h2><Grid d={nw} err={e2} /></section>
      </div>
    </div>
  );
}

export function Shop() {
  const [sp, setSp] = useSearchParams();
  const [d, err] = useGet('/products?limit=12&' + sp.toString()), [cats] = useGet('/categories');
  const set = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); if (k !== 'page') n.delete('page'); setSp(n); };
  const page = +(sp.get('page') || 1);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-4 text-3xl font-bold">{sp.get('q') ? `Results for "${sp.get('q')}"` : 'All products'}</h1>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button onClick={() => set('category', '')} className={'rounded-full px-4 py-1.5 text-sm ' + (!sp.get('category') ? 'bg-indigo-600 text-white' : 'bg-white')}>All</button>
        {cats?.map((c) => <button key={c._id} onClick={() => set('category', c.name)} className={'rounded-full px-4 py-1.5 text-sm ' + (sp.get('category') === c.name ? 'bg-indigo-600 text-white' : 'bg-white')}>{c.name}</button>)}
        <select className="inp !w-auto md:ml-auto" value={sp.get('sort') || ''} onChange={(e) => set('sort', e.target.value)}>
          <option value="">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="rating">Top rated</option>
        </select>
        <input className="inp !w-32" type="number" min="0" placeholder="Max $" defaultValue={sp.get('max') || ''} onBlur={(e) => set('max', e.target.value)} />
      </div>
      <Grid d={d} err={err} />
      {d?.pages > 1 && <div className="mt-8 flex justify-center gap-2">{Array.from({ length: d.pages }, (_, i) => <button key={i} onClick={() => set('page', i + 1)} className={'h-10 w-10 rounded-lg ' + (page === i + 1 ? 'bg-indigo-600 text-white' : 'bg-white')}>{i + 1}</button>)}</div>}
    </div>
  );
}

export function Product() {
  const { id } = useParams();
  const [p, err, setP] = useGet('/products/' + id);
  const { addToCart, toggleWish, wish, user, notify } = useApp();
  const [qty, setQty] = useState(1), [rev, setRev] = useState({ rating: 5, comment: '' });
  if (err) return <Empty text={err} to="/shop" cta="Back to shop" />;
  if (!p) return <Spin />;
  const submit = async (e) => {
    e.preventDefault();
    try { setP(await api(`/products/${id}/reviews`, { method: 'POST', body: rev })); notify('Review added'); setRev({ rating: 5, comment: '' }); } catch (x) { notify(x.message, 'err'); }
  };
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <img src={p.image} alt={p.name} className="fade w-full rounded-3xl object-cover shadow-lg" />
        <div className="fade">
          <p className="text-sm uppercase tracking-wide text-indigo-500">{p.category}</p>
          <h1 className="mt-1 text-4xl font-extrabold">{p.name}</h1>
          <div className="mt-2"><Stars v={p.rating} /> <span className="text-sm text-slate-500">{p.rating} · {p.numReviews} reviews</span></div>
          <p className="mt-4 text-3xl font-bold">{money(p.price)}</p>
          <p className="mt-4 text-slate-600">{p.description}</p>
          <p className={'mt-4 font-medium ' + (p.stock ? 'text-emerald-600' : 'text-rose-600')}>{p.stock ? `In stock (${p.stock})` : 'Out of stock'}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <input type="number" min="1" max={p.stock} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value))} className="inp !w-24" />
            <button disabled={!p.stock} onClick={() => addToCart(p, qty)} className="btn">Add to cart</button>
            <button onClick={() => toggleWish(p)} className="btn2">{wish.some((w) => w._id === p._id) ? '❤️ Wishlisted' : '🤍 Wishlist'}</button>
          </div>
        </div>
      </div>
      <section className="mt-14">
        <h2 className="mb-4 text-2xl font-bold">Reviews</h2>
        {!p.reviews.length && <p className="text-slate-500">No reviews yet. Be the first!</p>}
        <div className="space-y-3">{p.reviews.map((v, i) => <div key={i} className="rounded-xl bg-white p-4 shadow-sm"><b>{v.name}</b> <Stars v={v.rating} /><p className="text-slate-600">{v.comment}</p></div>)}</div>
        {user ? (
          <form onSubmit={submit} className="mt-6 max-w-lg space-y-3">
            <select className="inp" value={rev.rating} onChange={(e) => setRev({ ...rev, rating: +e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select>
            <textarea className="inp" rows="3" placeholder="Write your review" value={rev.comment} onChange={(e) => setRev({ ...rev, comment: e.target.value })} />
            <button className="btn">Submit review</button>
          </form>
        ) : <p className="mt-4"><Link to="/login" className="text-indigo-600 underline">Login</Link> to write a review.</p>}
      </section>
    </div>
  );
}

export function Cart() {
  const { cart, setQty } = useApp();
  const total = cart.reduce((s, c) => s + c.product.price * c.qty, 0);
  if (!cart.length) return <Empty text="Your cart is empty" to="/shop" cta="Start shopping" />;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Shopping cart</h1>
      <div className="space-y-3">{cart.map((c) => (
        <div key={c.product._id} className="fade flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
          <img src={c.product.image} alt="" className="h-20 w-20 rounded-xl object-cover" />
          <div className="flex-1"><Link to={'/product/' + c.product._id} className="font-semibold">{c.product.name}</Link><p className="text-slate-500">{money(c.product.price)}</p></div>
          <div className="flex items-center gap-2">
            <button className="btn2 !px-3 !py-1" onClick={() => setQty(c.product._id, c.qty - 1)}>−</button><span className="w-6 text-center">{c.qty}</span>
            <button className="btn2 !px-3 !py-1" disabled={c.qty >= c.product.stock} onClick={() => setQty(c.product._id, c.qty + 1)}>+</button>
          </div>
          <b className="w-24 text-right">{money(c.product.price * c.qty)}</b>
          <button onClick={() => setQty(c.product._id, 0)} className="text-rose-500">✕</button>
        </div>))}</div>
      <div className="mt-6 flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm"><span className="text-xl">Total: <b>{money(total)}</b></span><Link to="/checkout" className="btn">Checkout</Link></div>
    </div>
  );
}

export function Checkout() {
  const { cart, user, notify, refresh } = useApp();
  const nav = useNavigate();
  const [address, setAddress] = useState(user.address || ''), [payment, setPayment] = useState('COD'), [busy, setBusy] = useState(false);
  const total = cart.reduce((s, c) => s + c.product.price * c.qty, 0);
  if (!cart.length) return <Empty text="Your cart is empty" to="/shop" cta="Shop now" />;
  const place = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api('/orders', { method: 'POST', body: { address, payment } }); await refresh(); notify('Order placed successfully!'); nav('/orders'); } catch (x) { notify(x.message, 'err'); }
    setBusy(false);
  };
  return (
    <form onSubmit={place} className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-2">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <textarea className="inp" rows="4" required minLength="5" placeholder="Full shipping address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <select className="inp" value={payment} onChange={(e) => setPayment(e.target.value)}>
          <option value="COD">Cash on Delivery</option><option value="Card (demo)">Card (demo, no real charge)</option>
        </select>
      </div>
      <div className="h-fit rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-xl font-bold">Order summary</h2>
        {cart.map((c) => <div key={c.product._id} className="flex justify-between py-1"><span>{c.product.name} × {c.qty}</span><span>{money(c.product.price * c.qty)}</span></div>)}
        <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold"><span>Total</span><span>{money(total)}</span></div>
        <button disabled={busy} className="btn mt-5 w-full">{busy ? 'Placing order...' : 'Place order'}</button>
      </div>
    </form>
  );
}

const STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];
export function Orders() {
  const [orders, err] = useGet('/orders/mine');
  if (err) return <Empty text={err} />;
  if (!orders) return <Spin />;
  if (!orders.length) return <Empty text="You have no orders yet" to="/shop" cta="Start shopping" />;
  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-10">
      <h1 className="text-3xl font-bold">My orders</h1>
      {orders.map((o) => (
        <div key={o._id} className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap justify-between text-sm text-slate-500"><span>#{o._id.slice(-8)} · {new Date(o.createdAt).toLocaleDateString()}</span><span>{o.payment}</span></div>
          {o.status === 'Cancelled' ? <p className="mt-3 font-semibold text-rose-600">Cancelled</p> : (
            <div className="my-4 flex">{STEPS.map((s, i) => <div key={s} className="flex-1 text-center text-xs"><div className={'mx-auto mb-1 h-2 rounded-full ' + (i <= STEPS.indexOf(o.status) ? 'bg-emerald-500' : 'bg-slate-200')} />{s}</div>)}</div>)}
          {o.items.map((i, k) => <div key={k} className="flex items-center gap-3 py-1"><img src={i.image} alt="" className="h-12 w-12 rounded-lg object-cover" /><span className="flex-1">{i.name} × {i.qty}</span><span>{money(i.price * i.qty)}</span></div>)}
          <p className="mt-2 text-right text-lg font-bold">Total {money(o.total)}</p>
        </div>))}
    </div>
  );
}

export function Wishlist() {
  const { wish } = useApp();
  if (!wish.length) return <Empty text="Your wishlist is empty" to="/shop" cta="Browse products" />;
  return <div className="mx-auto max-w-7xl px-4 py-10"><h1 className="mb-6 text-3xl font-bold">Wishlist</h1><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{wish.map((p) => <Card key={p._id} p={p} />)}</div></div>;
}

export function Profile() {
  const { user, setUser, notify } = useApp();
  const [f, setF] = useState({ name: user.name, phone: user.phone || '', address: user.address || '', password: '' });
  const save = async (e) => {
    e.preventDefault();
    try { setUser(await api('/auth/profile', { method: 'PUT', body: f })); setF({ ...f, password: '' }); notify('Profile updated'); } catch (x) { notify(x.message, 'err'); }
  };
  const on = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });
  return (
    <form onSubmit={save} className="mx-auto max-w-lg space-y-4 px-4 py-10">
      <h1 className="text-3xl font-bold">My profile</h1>
      <input className="inp bg-slate-100" value={user.email} disabled />
      <input className="inp" placeholder="Name" required {...on('name')} />
      <input className="inp" placeholder="Phone" {...on('phone')} />
      <textarea className="inp" rows="3" placeholder="Default address" {...on('address')} />
      <input className="inp" type="password" placeholder="New password (leave blank to keep)" {...on('password')} />
      <button className="btn">Save changes</button>
    </form>
  );
}

export function Auth({ mode }) {
  const { auth } = useApp();
  const nav = useNavigate();
  const reg = mode === 'register';
  const [f, setF] = useState({ name: '', email: '', password: '' }), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await auth(reg ? '/auth/register' : '/auth/login', f); nav('/'); } catch (x) { setErr(x.message); }
    setBusy(false);
  };
  const on = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });
  return (
    <form onSubmit={submit} className="fade mx-auto my-16 max-w-md space-y-4 rounded-3xl bg-white p-8 shadow-lg">
      <h1 className="text-3xl font-bold">{reg ? 'Create account' : 'Welcome back'}</h1>
      {err && <p className="rounded-lg bg-rose-50 p-3 text-rose-600">{err}</p>}
      {reg && <input className="inp" placeholder="Full name" required {...on('name')} />}
      <input className="inp" type="email" placeholder="Email" required {...on('email')} />
      <input className="inp" type="password" placeholder="Password (min 6 chars)" required minLength="6" {...on('password')} />
      <button disabled={busy} className="btn w-full">{busy ? 'Please wait...' : reg ? 'Sign up' : 'Login'}</button>
      <p className="text-center text-sm text-slate-500">{reg ? 'Already registered?' : 'New here?'} <Link className="text-indigo-600 underline" to={reg ? '/login' : '/register'}>{reg ? 'Login' : 'Create an account'}</Link></p>
    </form>
  );
}
