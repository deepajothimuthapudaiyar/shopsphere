import { useState, useEffect } from 'react';
import { api } from './api';
import { useApp } from './context';
import { money, Spin } from './pages';

function useLoad(path) {
  const { notify } = useApp();
  const [d, setD] = useState(null);
  const load = () => api(path).then(setD).catch((e) => notify(e.message, 'err'));
  useEffect(() => { load(); }, []);
  return [d, load];
}
const Box = ({ children, className = '' }) => <div className={'rounded-2xl bg-white p-5 shadow-sm ' + className}>{children}</div>;

function Dash() {
  const [s] = useLoad('/admin/stats');
  if (!s) return <Spin />;
  const max = Math.max(1, ...s.monthly.map((m) => m.sales));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[['Revenue', money(s.revenue)], ['Orders', s.orders], ['Products', s.products], ['Customers', s.users]].map(([k, v]) => <Box key={k}><p className="text-sm text-slate-500">{k}</p><p className="text-3xl font-extrabold">{v}</p></Box>)}
      </div>
      <Box>
        <h3 className="mb-4 font-bold">Monthly sales</h3>
        {!s.monthly.length ? <p className="text-slate-500">No sales yet</p> : <div className="flex h-48 items-end gap-3">{s.monthly.map((m) => (
          <div key={m._id} className="flex flex-1 flex-col items-center justify-end text-xs"><span>{money(m.sales)}</span><div className="w-full rounded-t-lg bg-indigo-500" style={{ height: (m.sales / max) * 100 + '%' }} /><span className="mt-1">{m._id}</span></div>))}</div>}
      </Box>
      <Box>
        <h3 className="mb-2 font-bold">Low stock (5 or fewer)</h3>
        {!s.lowStock.length ? <p className="text-slate-500">All products well stocked</p> : s.lowStock.map((p) => <p key={p._id}>{p.name}: <b className="text-rose-600">{p.stock}</b></p>)}
      </Box>
    </div>
  );
}

const blank = { name: '', description: '', price: '', stock: '', image: '', category: '' };
function Prods() {
  const { notify } = useApp();
  const [d, load] = useLoad('/products?limit=100'), [cats] = useLoad('/categories'), [f, setF] = useState(blank);
  const run = async (fn, msg) => { try { await fn(); notify(msg); load(); } catch (x) { notify(x.message, 'err'); } };
  const save = (e) => { e.preventDefault(); run(async () => { await api(f._id ? '/products/' + f._id : '/products', { method: f._id ? 'PUT' : 'POST', body: { ...f, price: +f.price, stock: +f.stock } }); setF(blank); }, 'Product saved'); };
  const on = (k) => ({ value: f[k] ?? '', onChange: (e) => setF({ ...f, [k]: e.target.value }) });
  return (
    <div className="space-y-6">
      <Box>
        <form onSubmit={save} className="grid gap-3 md:grid-cols-3">
          <input className="inp" placeholder="Name" required {...on('name')} />
          <input className="inp" type="number" step="0.01" min="0" placeholder="Price" required {...on('price')} />
          <input className="inp" type="number" min="0" placeholder="Stock" required {...on('stock')} />
          <select className="inp" required {...on('category')}><option value="">Category</option>{cats?.map((c) => <option key={c._id}>{c.name}</option>)}</select>
          <input className="inp md:col-span-2" placeholder="Image URL" {...on('image')} />
          <textarea className="inp md:col-span-3" rows="2" placeholder="Description" {...on('description')} />
          <div className="flex gap-2"><button className="btn">{f._id ? 'Update' : 'Add'} product</button>{f._id && <button type="button" className="btn2" onClick={() => setF(blank)}>Cancel</button>}</div>
        </form>
      </Box>
      <Box className="overflow-x-auto">
        {!d ? <Spin /> : <table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-2">Product</th><th>Category</th><th>Price</th><th>Stock (edit)</th><th></th></tr></thead><tbody>
          {d.items.map((p) => (
            <tr key={p._id} className="border-b">
              <td className="flex items-center gap-2 p-2"><img src={p.image} alt="" className="h-10 w-10 rounded object-cover" />{p.name}</td>
              <td>{p.category}</td><td>{money(p.price)}</td>
              <td><input type="number" min="0" defaultValue={p.stock} className="inp !w-20 !py-1" onBlur={(e) => +e.target.value !== p.stock && run(() => api('/products/' + p._id, { method: 'PUT', body: { stock: +e.target.value } }), 'Stock updated')} /></td>
              <td className="space-x-3"><button className="text-indigo-600" onClick={() => { setF(p); window.scrollTo(0, 0); }}>Edit</button><button className="text-rose-600" onClick={() => confirm('Delete this product?') && run(() => api('/products/' + p._id, { method: 'DELETE' }), 'Deleted')}>Delete</button></td>
            </tr>))}</tbody></table>}
      </Box>
    </div>
  );
}

function Cats() {
  const { notify } = useApp();
  const [cats, load] = useLoad('/categories'), [name, setName] = useState('');
  const add = async (e) => { e.preventDefault(); try { await api('/categories', { method: 'POST', body: { name } }); setName(''); notify('Category added'); load(); } catch (x) { notify(x.message, 'err'); } };
  const del = async (id) => { try { await api('/categories/' + id, { method: 'DELETE' }); notify('Category deleted'); load(); } catch (x) { notify(x.message, 'err'); } };
  return (
    <Box>
      <form onSubmit={add} className="mb-4 flex gap-2"><input className="inp max-w-xs" placeholder="New category" required value={name} onChange={(e) => setName(e.target.value)} /><button className="btn">Add</button></form>
      {!cats ? <Spin /> : cats.map((c) => <div key={c._id} className="flex justify-between border-b py-2"><span>{c.name}</span><button className="text-rose-600" onClick={() => del(c._id)}>Delete</button></div>)}
    </Box>
  );
}

function Ords() {
  const { notify } = useApp();
  const [o, load] = useLoad('/orders');
  const setStatus = async (id, status) => { try { await api(`/orders/${id}/status`, { method: 'PUT', body: { status } }); notify('Status updated'); load(); } catch (x) { notify(x.message, 'err'); } };
  if (!o) return <Spin />;
  if (!o.length) return <Box>No orders yet</Box>;
  return <div className="space-y-3">{o.map((x) => (
    <Box key={x._id}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><b>#{x._id.slice(-8)}</b> · {x.user?.name} ({x.user?.email})<p className="text-sm text-slate-500">{new Date(x.createdAt).toLocaleString()} · {x.payment} · {x.address}</p></div>
        <div className="flex items-center gap-3"><b>{money(x.total)}</b>
          <select className="inp !w-auto" value={x.status} onChange={(e) => setStatus(x._id, e.target.value)}>{['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}</select></div>
      </div>
      <p className="mt-2 text-sm text-slate-600">{x.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}</p>
    </Box>))}</div>;
}

export default function Admin() {
  const [tab, setTab] = useState('Dashboard');
  const T = { Dashboard: Dash, Products: Prods, Categories: Cats, Orders: Ords }[tab];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Admin dashboard</h1>
      <div className="mb-6 flex flex-wrap gap-2">{['Dashboard', 'Products', 'Categories', 'Orders'].map((t) => <button key={t} onClick={() => setTab(t)} className={'rounded-xl px-4 py-2 font-medium ' + (tab === t ? 'bg-indigo-600 text-white' : 'bg-white')}>{t}</button>)}</div>
      <T />
    </div>
  );
}
