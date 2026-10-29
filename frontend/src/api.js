const BASE = import.meta.env.VITE_API_URL || '/api';
export async function api(path, { method = 'GET', body } = {}) {
  const t = localStorage.getItem('token');
  const res = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(t && { Authorization: 'Bearer ' + t }) }, body: body && JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
