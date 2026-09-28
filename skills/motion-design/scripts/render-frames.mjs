#!/usr/bin/env node
/**
 * Capture seek(t) frames from a local HTML composition via system Chrome CDP.
 * No npm dependencies.
 *
 *   node render-frames.mjs --html ./index.html --out ./frames --fps 30
 *   node render-frames.mjs --html ./index.html --out ./stills --times 0.2,3,8,14
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return process.argv[i + 1];
}

const htmlPath = path.resolve(arg('html', ''));
const outDir = path.resolve(arg('out', './frames'));
const fps = Number(arg('fps', '30'));
const timesArg = arg('times', '');
const chromeBin = arg('chrome', process.env.CHROME_BIN || '/opt/google/chrome/chrome');
const port = Number(arg('port', '0'));

if (!htmlPath) {
  console.error('Usage: render-frames.mjs --html <file> --out <dir> [--fps 30 | --times 0,1.5,3]');
  process.exit(1);
}

async function fileExists(p) {
  try { await fs.stat(p); return true; } catch { return false; }
}

if (!(await fileExists(htmlPath))) {
  console.error(`HTML not found: ${htmlPath}`);
  process.exit(1);
}

await fs.mkdir(outDir, { recursive: true });

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const u = new URL(req.url, 'http://127.0.0.1');
        let rel = decodeURIComponent(u.pathname);
        if (rel === '/') rel = '/' + path.basename(htmlPath);
        const fp = path.join(rootDir, rel);
        if (!fp.startsWith(rootDir)) { res.writeHead(403); res.end(); return; }
        const data = await fs.readFile(fp);
        const ext = path.extname(fp).toLowerCase();
        const types = {
          '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
          '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
          '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
          '.woff': 'font/woff', '.ttf': 'font/ttf', '.json': 'application/json'
        };
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404); res.end('not found');
      }
    });
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function pickDebugPort() {
  if (port) return port;
  return await new Promise((resolve) => {
    const s = createServer();
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
}

async function launchChrome(debugPort, userData) {
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-software-rasterizer',
    '--hide-scrollbars',
    '--font-render-hinting=none',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-extensions',
    '--disable-features=Translate,MediaRouter',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userData}`,
    'about:blank'
  ];
  const child = spawn(chromeBin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  let err = '';
  child.stderr.on('data', (d) => { err += d.toString(); });
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (r.ok) return child;
    } catch {}
    if (child.exitCode != null) {
      throw new Error(`Chrome exited early (${child.exitCode}). ${err.slice(0, 400)}`);
    }
    await wait(100);
  }
  throw new Error(`Chrome CDP not ready. ${err.slice(0, 400)}`);
}

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
  }
  ready() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  close() { try { this.ws.close(); } catch {} }
}

async function openPage(debugPort) {
  const r = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' });
  const text = await r.text();
  let target;
  try { target = JSON.parse(text); }
  catch { throw new Error(`json/new failed: ${text.slice(0, 200)}`); }
  if (!target.webSocketDebuggerUrl) throw new Error(`no ws url: ${text.slice(0, 200)}`);
  const cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.ready();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  return cdp;
}

async function evalExpr(cdp, expr) {
  const res = await cdp.send('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true
  });
  if (res.exceptionDetails) {
    throw new Error(res.exceptionDetails.text || 'eval failed');
  }
  return res.result && res.result.value;
}

async function main() {
  const rootDir = path.dirname(htmlPath);
  const { server } = await startStaticServer(rootDir);
  const pageUrl = `http://127.0.0.1:${(await startStaticServer(rootDir)).port}/${path.basename(htmlPath)}`;
}
