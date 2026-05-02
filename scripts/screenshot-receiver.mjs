// Локальный приёмник скриншотов от dev-сервера: POST /save/<filename>
// Тело запроса = data:URL картинки. Декодируем и пишем в docs/screenshots/.
// Запуск: node scripts/screenshot-receiver.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('docs/screenshots');
fs.mkdirSync(OUT, { recursive: true });

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.writeHead(200).end();

  const m = req.url.match(/^\/save\/([\w.-]+)$/);
  if (!m || req.method !== 'POST') return res.writeHead(404).end('not found');

  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    try {
      const body = Buffer.concat(chunks).toString('utf8');
      const dataMatch = body.match(/^data:[^;]+;base64,(.+)$/);
      const b64 = dataMatch ? dataMatch[1] : body;
      const out = path.join(OUT, m[1]);
      fs.writeFileSync(out, Buffer.from(b64, 'base64'));
      console.log(`✓ ${out} (${(fs.statSync(out).size / 1024).toFixed(1)} KB)`);
      res.writeHead(200).end('ok');
    } catch (e) {
      res.writeHead(500).end(String(e));
    }
  });
});

server.listen(7777, () => {
  console.log('screenshot-receiver listening on http://localhost:7777');
});
