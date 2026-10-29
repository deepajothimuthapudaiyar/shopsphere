const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'public', 'products');
fs.mkdirSync(dir, { recursive: true });
const P = [
  ['wireless-headphones', 'Wireless Headphones', '🎧', '#6366f1', '#a855f7'],
  ['smart-watch-pro', 'Smart Watch Pro', '⌚', '#0ea5e9', '#6366f1'],
  ['bluetooth-speaker', 'Bluetooth Speaker', '🔊', '#14b8a6', '#0ea5e9'],
  ['4k-action-camera', '4K Action Camera', '📷', '#f97316', '#ef4444'],
  ['classic-denim-jacket', 'Classic Denim Jacket', '🧥', '#3b82f6', '#1e3a8a'],
  ['leather-sneakers', 'Leather Sneakers', '👟', '#f59e0b', '#b45309'],
  ['minimal-backpack', 'Minimal Backpack', '🎒', '#10b981', '#047857'],
  ['aviator-sunglasses', 'Aviator Sunglasses', '🕶️', '#8b5cf6', '#4c1d95'],
  ['ceramic-table-lamp', 'Ceramic Table Lamp', '💡', '#fbbf24', '#f97316'],
  ['cotton-bedding-set', 'Cotton Bedding Set', '🛏️', '#ec4899', '#8b5cf6'],
  ['espresso-coffee-maker', 'Espresso Coffee Maker', '☕', '#92400e', '#451a03'],
  ['scented-candle-trio', 'Scented Candle Trio', '🕯️', '#fb7185', '#f59e0b'],
  ['yoga-mat-premium', 'Yoga Mat Premium', '🧘', '#22c55e', '#0d9488'],
  ['adjustable-dumbbells', 'Adjustable Dumbbells', '🏋️', '#64748b', '#0f172a'],
  ['running-shoes-air', 'Running Shoes Air', '🏃', '#ef4444', '#be123c'],
  ['vitamin-c-serum', 'Vitamin C Serum', '🧴', '#fb923c', '#facc15'],
];
for (const [slug, name, emoji, a, b] of P) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="600" height="600" fill="url(#g)"/><circle cx="300" cy="260" r="150" fill="#fff" fill-opacity=".18"/><text x="300" y="320" font-size="190" text-anchor="middle">${emoji}</text><text x="300" y="520" font-size="38" font-weight="700" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif">${name}</text></svg>`;
  fs.writeFileSync(path.join(dir, slug + '.svg'), svg, 'utf8');
}
console.log('Created files:', fs.readdirSync(dir).length, 'in', dir);