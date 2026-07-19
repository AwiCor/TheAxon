#!/usr/bin/env node
/**
 * The Axon — local Composer server.
 *
 *   npm run compose
 *
 * Starts a small server on 127.0.0.1 (your machine only) that serves the
 * writing app in tools/composer.html and reads/writes paper files in
 * src/content/papers/. It is a LOCAL authoring tool — it never runs in
 * production and is never deployed. Stop it with Ctrl-C.
 *
 * Zero dependencies: Node's built-in http/fs only.
 */
import { createServer } from 'node:http';
import { readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { exec } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PAPERS = join(ROOT, 'src/content/papers');
const FONTS = join(ROOT, 'public/fonts');
const COMPOSER = join(ROOT, 'tools/composer.html');

const HOST = '127.0.0.1';
const PORT = 8787;
const SECTIONS = ['neurology', 'endocrinology'];

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const safeSlug = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

const wrap = (text, width) => {
  const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if (line && (line + ' ' + w).length > width) {
      lines.push(line);
      line = w;
    } else {
      line = line ? line + ' ' + w : w;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
};

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Build a paper .md file from structured fields. */
function buildMarkdown(d) {
  const section = SECTIONS.includes(d.section) ? d.section : 'neurology';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : todayISO();
  const fm = ['---'];
  fm.push('title: ' + JSON.stringify(String(d.title || 'Untitled').trim()));
  fm.push('section: ' + section);
  fm.push('abstract: >-');
  const abstract = String(d.abstract || '').trim() || 'A short description of the paper.';
  for (const line of wrap(abstract, 76)) fm.push('  ' + line);
  fm.push('author: ' + JSON.stringify(String(d.author || 'The Axon').trim()));
  fm.push('date: ' + date);
  fm.push('featured: ' + (d.featured ? 'true' : 'false'));
  fm.push('draft: ' + (d.draft ? 'true' : 'false'));
  if (d.pdf) fm.push('pdf: ' + JSON.stringify(String(d.pdf).trim()));
  fm.push('---', '');
  fm.push(String(d.body || '').trim(), '');
  return fm.join('\n');
}

const parseScalar = (v) => {
  v = v.trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v.startsWith('"') && v.endsWith('"')) {
    try { return JSON.parse(v); } catch { return v.slice(1, -1); }
  }
  return v;
};

/** Parse a paper file's frontmatter (our subset) + body. */
function parseFile(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { body: text.trim() };
  const lines = m[1].split('\n');
  const body = m[2].replace(/^\n+/, '');
  const data = {};
  for (let i = 0; i < lines.length; i++) {
    const km = lines[i].match(/^([a-zA-Z_]+):\s?(.*)$/);
    if (!km) continue;
    const key = km[1];
    let val = km[2];
    if (['>-', '>', '|', '|-'].includes(val.trim())) {
      const collected = [];
      while (i + 1 < lines.length && (lines[i + 1].startsWith('  ') || lines[i + 1].trim() === '')) {
        collected.push(lines[++i].replace(/^ {2}/, ''));
      }
      val = collected.join(' ').replace(/\s+/g, ' ').trim();
    } else {
      val = parseScalar(val);
    }
    data[key] = val;
  }
  data.body = body.trim();
  return data;
}

async function listPapers() {
  let files = [];
  try { files = await readdir(PAPERS); } catch { return []; }
  const out = [];
  for (const f of files) {
    if (!f.endsWith('.md')) continue;
    try {
      const raw = await readFile(join(PAPERS, f), 'utf8');
      const d = parseFile(raw);
      out.push({
        slug: f.replace(/\.md$/, ''),
        title: d.title || f,
        section: d.section || '',
        date: d.date || '',
        draft: !!d.draft,
        featured: !!d.featured,
        pdf: d.pdf || '',
      });
    } catch { /* skip unreadable */ }
  }
  out.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return out;
}

const send = (res, code, type, body) => {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
};
const json = (res, code, obj) => send(res, code, 'application/json', JSON.stringify(obj));

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${HOST}:${PORT}`);
    const path = url.pathname;

    if (path === '/' || path === '/index.html') {
      return send(res, 200, 'text/html; charset=utf-8', await readFile(COMPOSER, 'utf8'));
    }

    if (path.startsWith('/fonts/')) {
      const name = path.slice('/fonts/'.length);
      if (!/^[a-z0-9._-]+\.woff2$/i.test(name)) return send(res, 404, 'text/plain', 'no');
      try {
        return send(res, 200, 'font/woff2', await readFile(join(FONTS, name)));
      } catch { return send(res, 404, 'text/plain', 'no font'); }
    }

    if (path === '/api/config') {
      return json(res, 200, { sections: SECTIONS, today: todayISO() });
    }

    if (path === '/api/papers') {
      return json(res, 200, { papers: await listPapers() });
    }

    if (path === '/api/paper') {
      const slug = safeSlug(url.searchParams.get('slug'));
      if (!slug) return json(res, 400, { error: 'bad slug' });
      try {
        const raw = await readFile(join(PAPERS, slug + '.md'), 'utf8');
        return json(res, 200, { slug, ...parseFile(raw) });
      } catch { return json(res, 404, { error: 'not found' }); }
    }

    if (path === '/api/save' && req.method === 'POST') {
      const d = JSON.parse(await readBody(req) || '{}');
      const slug = safeSlug(d.slug) || slugify(d.title);
      if (!slug) return json(res, 400, { error: 'A title is required.' });
      const md = buildMarkdown(d);
      await writeFile(join(PAPERS, slug + '.md'), md, 'utf8');
      return json(res, 200, { ok: true, slug, path: `src/content/papers/${slug}.md` });
    }

    if (path === '/api/delete' && req.method === 'POST') {
      const d = JSON.parse(await readBody(req) || '{}');
      const slug = safeSlug(d.slug);
      if (!slug) return json(res, 400, { error: 'bad slug' });
      try { await unlink(join(PAPERS, slug + '.md')); } catch { /* already gone */ }
      return json(res, 200, { ok: true });
    }

    send(res, 404, 'text/plain', 'Not found');
  } catch (err) {
    json(res, 500, { error: String(err && err.message || err) });
  }
});

server.listen(PORT, HOST, () => {
  const at = `http://${HOST}:${PORT}/`;
  console.log(`\n  The Axon — Composer\n  Writing to: src/content/papers/\n  Open:       ${at}\n  Stop:       Ctrl-C\n`);
  exec(`open "${at}"`, () => {}); // macOS; harmless if it fails
});
