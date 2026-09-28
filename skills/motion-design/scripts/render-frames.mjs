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
  const i = process.argv.indexOf('--' + name);
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
  console.error('HTML not found: ' + htmlPath);
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
    '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    '--disable-software-rasterizer', '--hide-scrollbars', '--font-render-hinting=none',
    '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
    '--disable-extensions', '--disable-features=Translate,MediaRouter',
    '--remote-debugging-port=' + debugPort,
    '--user-data-dir=' + userData,
    'about:blank'
  ];
  const child = spawn(chromeBin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  let err = '';
  child.stderr.on('data', (d) => { err += d.toString(); });
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch('http://127.0.0.1:' + debugPort + '/json/version');
      if (r.ok) return child;
    } catch {}
    if (child.exitCode != null) {
      throw new Error('Chrome exited early (' + child.exitCode + '). ' + err.slice(0, 400));
    }
    await wait(100);
  }
  throw new Error('Chrome CDP not ready. ' + err.slice(0, 400));
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
  const r = await fetch('http://127.0.0.1:' + debugPort + '/json/new?about:blank', { method: 'PUT' });
  const text = await r.text();
  let target;
  try { target = JSON.parse(text); }
  catch { throw new Error('json/new failed: ' + text.slice(0, 200)); }
  if (!target.webSocketDebuggerUrl) throw new Error('no ws url: ' + text.slice(0, 200));
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
  const { server, port: httpPort } = await startStaticServer(rootDir);
  const pageUrl = 'http://127.0.0.1:' + httpPort + '/' + path.basename(htmlPath);
  const debugPort = await pickDebugPort();
  const userData = await fs.mkdtemp('/tmp/md-chrome-');
  let chrome;
  let cdp;
  try {
    chrome = await launchChrome(debugPort, userData);
    cdp = await openPage(debugPort);
    await cdp.send('Page.navigate', { url: pageUrl });
    await wait(400);
    const readyDeadline = Date.now() + 8000;
    while (Date.now() < readyDeadline) {
      const ready = await evalExpr(cdp, 'window.__ready === true || (typeof window.seek === "function" && window.DURATION > 0)');
      if (ready) break;
      await wait(100);
    }
    const meta = await evalExpr(cdp, '({ w: window.WIDTH || document.documentElement.clientWidth || 1920, h: window.HEIGHT || document.documentElement.clientHeight || 1080, d: window.DURATION || 20, hasSeek: typeof window.seek === "function" })');
    if (!meta.hasSeek) throw new Error('window.seek(t) is missing');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: Math.round(meta.w),
      height: Math.round(meta.h),
      deviceScaleFactor: 1,
      mobile: false
    });
    let stamps;
    if (timesArg) {
      stamps = timesArg.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
    } else {
      const n = Math.round(meta.d * fps);
      stamps = Array.from({ length: n }, (_, i) => i / fps);
    }
    const pad = (i) => String(i).padStart(5, '0');
    for (let i = 0; i < stamps.length; i++) {
      const t = stamps[i];
      await evalExpr(cdp, '(async () => { if (document.fonts && document.fonts.status !== "loaded") await document.fonts.ready; window.seek(' + t + '); return true; })()');
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const name = timesArg ? ('t-' + t.toFixed(3).replace('.', 'p') + '.png') : ('frame-' + pad(i) + '.png');
      await fs.writeFile(path.join(outDir, name), Buffer.from(shot.data, 'base64'));
      if ((i + 1) % 30 === 0 || i === stamps.length - 1) {
        console.error('captured ' + (i + 1) + '/' + stamps.length);
      }
    }
    console.log(JSON.stringify({
      frames: stamps.length,
      out: outDir,
      width: meta.w,
      height: meta.h,
      duration: meta.d,
      fps: timesArg ? null : fps
    }));
  } finally {
    if (cdp) cdp.close();
    if (chrome) chrome.kill('SIGKILL');
    server.close();
    await fs.rm(userData, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
