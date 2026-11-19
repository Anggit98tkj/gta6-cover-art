// Tiny static server for Vice Poster Maker: serves the app/ folder on
// http://localhost:8080 so you can try it in desktop Chrome.
// Node 22, standard library only. Start it with: node serve.ts
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT ?? 8080);

function contentType(file) {
  switch (extname(file)) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'text/javascript; charset=utf-8';
    case '.mjs': return 'text/javascript; charset=utf-8';
    case '.ttf': return 'font/ttf';
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.txt': return 'text/plain; charset=utf-8';
    default: return 'application/octet-stream';
  }
}

const server = createServer(async (req, res) => {
  const requested = (req.url ?? '/').split('?')[0].replace(/^\//, '');
  const target = join(root, 'app', requested === '' ? 'index.html' : requested);
  try {
    const body = await readFile(target);
    res.writeHead(200, { 'content-type': contentType(target) });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  }
});

server.listen(PORT, () => console.log(`Vice Poster Maker at http://localhost:${PORT}`));
