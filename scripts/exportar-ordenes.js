// Exporta los órdenes del día previstos (ordenDelDiaPredefinido de index.html) a ordenes-del-dia.json,
// para que otras apps del centro (Tablón de Profesorado) los muestren. Lo ejecuta GitHub Actions.
const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
const i = s.indexOf('const ordenDelDiaPredefinido = {');
if (i < 0) { console.log('No se encuentra ordenDelDiaPredefinido'); process.exit(0); }
let j = s.indexOf('{', i), k = j, d = 0;
for (; k < s.length; k++) { if (s[k] === '{') d++; else if (s[k] === '}') { d--; if (!d) break; } }
const o = Function('return (' + s.slice(j, k + 1) + ')')();
const out = {};
for (const org in o) { out[org] = {};
  for (const mes in o[org]) out[org][mes] = o[org][mes].map(p => typeof p === 'string' ? p : p.t); }
fs.writeFileSync('ordenes-del-dia.json', JSON.stringify({ nota: 'Generado desde index.html (ordenDelDiaPredefinido). No editar a mano.', organos: out }, null, 1));
console.log('ordenes-del-dia.json:', Object.keys(out).join(', '));
