import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json',
};

// Serves `rootDir` over 127.0.0.1 on an OS-assigned port.
// Returns { server, port, origin }.
export async function startServer(rootDir) {
  const root = path.resolve(rootDir);
  const server = http.createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const filePath = path.normalize(path.join(root, urlPath === '/' ? '/index.html' : urlPath));
      if (!filePath.startsWith(root)) { res.writeHead(403).end('forbidden'); return; }
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'content-type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  return { server, port, origin: `http://127.0.0.1:${port}` };
}
