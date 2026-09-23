#!/usr/bin/env node
// Image Studio MCP server.
//
// Generates and edits images with OpenAI (the GPT Image models behind ChatGPT)
// or Google Gemini, and exposes them to Claude as MCP tools.
//
// Zero dependencies — needs Node 18+ (built-in fetch, FormData, Blob).
//
// Modes:
//   stdio (default)  node image-studio.mjs
//   HTTP             node image-studio.mjs --http [--port 8787]
//                    Serves streamable-HTTP MCP at /mcp. Requires IMAGE_STUDIO_TOKEN;
//                    clients authenticate with "Authorization: Bearer <token>" or ?token=<token>.
//
// Environment:
//   OPENAI_API_KEY           enables the "openai" provider
//   GEMINI_API_KEY           enables the "gemini" provider (GOOGLE_API_KEY also accepted)
//   OPENAI_IMAGE_MODEL       default gpt-image-2.5-sunburst
//   GEMINI_IMAGE_MODEL       default gemini-3-pro-image
//   IMAGE_DEFAULT_PROVIDER   openai | gemini (default: openai if its key is set, else gemini)
//   IMAGE_OUTPUT_DIR         where images are saved (default ./generated-images)
//   IMAGE_PREVIEW_MAX_BYTES  largest image returned inline to Claude (default 3000000)

import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { basename, extname, resolve } from 'node:path';
import { timingSafeEqual } from 'node:crypto';

const SERVER_INFO = { name: 'image-studio', version: '1.0.0' };
const PROTOCOL_VERSION = '2025-06-18';

const env = process.env;
const OPENAI_KEY = env.OPENAI_API_KEY || '';
const GEMINI_KEY = env.GEMINI_API_KEY || env.GOOGLE_API_KEY || '';
const OPENAI_MODEL = env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-sunburst';
const GEMINI_MODEL = env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image';
const OUTPUT_DIR = resolve(env.IMAGE_OUTPUT_DIR || 'generated-images');
const PREVIEW_MAX = Number(env.IMAGE_PREVIEW_MAX_BYTES || 3_000_000);
const HTTP_MODE = process.argv.includes('--http');

const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];

// ---------- helpers ----------

function configuredProviders() {
  const list = [];
  if (OPENAI_KEY) list.push('openai');
  if (GEMINI_KEY) list.push('gemini');
  return list;
}

function pickProvider(requested) {
  const available = configuredProviders();
  if (requested) {
    if (!available.includes(requested)) {
      const key = requested === 'openai' ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY';
      throw new Error(`Provider "${requested}" is not configured — set ${key}. Configured: ${available.join(', ') || 'none'}.`);
    }
    return requested;
  }
  const preferred = env.IMAGE_DEFAULT_PROVIDER;
  if (preferred && available.includes(preferred)) return preferred;
  if (available.length === 0) {
    throw new Error('No image provider configured. Set OPENAI_API_KEY and/or GEMINI_API_KEY.');
  }
  return available[0];
}

// GPT Image models take pixel sizes; map the requested aspect ratio to the nearest standard one.
function openaiSize(aspectRatio) {
  if (!aspectRatio) return 'auto';
  const [w, h] = aspectRatio.split(':').map(Number);
  if (w === h) return '1024x1024';
  return w > h ? '1536x1024' : '1024x1536';
}

const MIME_BY_EXT = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };
const EXT_BY_MIME = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

async function loadImage(ref) {
  if (/^https?:\/\//i.test(ref)) {
    const res = await fetch(ref);
    if (!res.ok) throw new Error(`Could not fetch ${ref}: HTTP ${res.status}`);
    const mime = (res.headers.get('content-type') || 'image/png').split(';')[0];
    const name = basename(new URL(ref).pathname) || 'image';
    return { bytes: Buffer.from(await res.arrayBuffer()), mime, name };
  }
  if (HTTP_MODE) throw new Error('In HTTP mode, input images must be https:// URLs.');
  const path = resolve(ref);
  const mime = MIME_BY_EXT[extname(path).toLowerCase()];
  if (!mime) throw new Error(`Unsupported image type: ${ref}`);
  return { bytes: await readFile(path), mime, name: basename(path) };
}

async function apiError(res, provider) {
  let detail = '';
  try {
    const body = await res.json();
    detail = body?.error?.message || JSON.stringify(body);
  } catch {
    detail = await res.text().catch(() => '');
  }
  return new Error(`${provider} API error ${res.status}: ${detail}`.slice(0, 1500));
}

// ---------- providers ----------

async function openaiImages({ prompt, images, aspect_ratio, quality, transparent_background, n, output_format }) {
  const model = OPENAI_MODEL;
  const size = openaiSize(aspect_ratio);
  const fmt = transparent_background ? 'png' : output_format || 'png';
  let res;
  if (images.length === 0) {
    const body = { model, prompt, n: n || 1, size, output_format: fmt };
    if (quality) body.quality = quality;
    if (transparent_background) body.background = 'transparent';
    res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } else {
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt);
    form.append('n', String(n || 1));
    form.append('size', size);
    form.append('output_format', fmt);
    if (quality) form.append('quality', quality);
    if (transparent_background) form.append('background', 'transparent');
    for (const img of images) form.append('image[]', new Blob([img.bytes], { type: img.mime }), img.name);
    res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: form,
    });
  }
  if (!res.ok) throw await apiError(res, 'OpenAI');
  const data = await res.json();
  const mime = `image/${fmt === 'jpg' ? 'jpeg' : fmt}`;
  return {
    model,
    images: (data.data || []).filter((d) => d.b64_json).map((d) => ({ bytes: Buffer.from(d.b64_json, 'base64'), mime })),
    notes: (data.data || []).map((d) => d.revised_prompt).filter(Boolean),
  };
}

async function geminiImages({ prompt, images, aspect_ratio, image_size, n }) {
  const model = GEMINI_MODEL;
  const parts = [{ text: prompt }];
  for (const img of images) parts.push({ inlineData: { mimeType: img.mime, data: img.bytes.toString('base64') } });
  const imageConfig = {};
  if (aspect_ratio) imageConfig.aspectRatio = aspect_ratio;
  if (image_size) imageConfig.imageSize = image_size;
  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'], ...(Object.keys(imageConfig).length ? { imageConfig } : {}) },
  };

  const out = { model, images: [], notes: [] };
  // Gemini returns one image per call; repeat for n > 1.
  for (let i = 0; i < (n || 1); i++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': GEMINI_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await apiError(res, 'Gemini');
    const data = await res.json();
    for (const cand of data.candidates || []) {
      for (const part of cand.content?.parts || []) {
        if (part.thought) continue; // skip interim "thinking" drafts
        const inline = part.inlineData || part.inline_data;
        if (inline?.data) {
          out.images.push({ bytes: Buffer.from(inline.data, 'base64'), mime: inline.mimeType || inline.mime_type || 'image/png' });
        } else if (part.text) {
          out.notes.push(part.text);
        }
      }
    }
    if (out.images.length === 0) {
      const reason = data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason || 'no image returned';
      throw new Error(`Gemini returned no image (${reason}).${out.notes.length ? ' Model said: ' + out.notes.join(' ') : ''}`);
    }
  }
  return out;
}

// ---------- tools ----------

const sharedProps = {
  provider: {
    type: 'string',
    enum: ['openai', 'gemini'],
    description: 'openai = GPT Image (ChatGPT\'s image model); gemini = Gemini image model. Omit to use the default provider.',
  },
  aspect_ratio: { type: 'string', enum: ASPECT_RATIOS, description: 'Output aspect ratio. OpenAI snaps to square, 3:2 landscape or 2:3 portrait.' },
  quality: { type: 'string', description: 'OpenAI only: low | medium | high | auto (newer models also accept xhigh | max).' },
  image_size: { type: 'string', enum: ['512', '1K', '2K', '4K'], description: 'Gemini only: output resolution (default 1K).' },
  transparent_background: { type: 'boolean', description: 'OpenAI only: PNG with transparent background (logos, stickers, product cut-outs).' },
  n: { type: 'integer', minimum: 1, maximum: 4, description: 'Number of variations (default 1).' },
  filename: { type: 'string', description: 'Base filename without extension (default: derived from the prompt).' },
};

const TOOLS = [
  {
    name: 'generate_image',
    description:
      'Generate an image from a text prompt using OpenAI GPT Image or Google Gemini. Saves the file(s) and returns the path(s) plus a preview.',
    inputSchema: {
      type: 'object',
      properties: { prompt: { type: 'string', description: 'Detailed description of the image.' }, ...sharedProps },
      required: ['prompt'],
    },
  },
  {
    name: 'edit_image',
    description:
      'Edit, restyle or combine existing images with a text instruction (e.g. "put this product on a marble counter", "match this brand palette"). Accepts local file paths or https URLs, including Adobe tool outputUrl values.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'What to change or create from the reference images.' },
        images: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 10, description: 'Local paths or https URLs of the input/reference images.' },
        ...sharedProps,
      },
      required: ['prompt', 'images'],
    },
  },
  {
    name: 'list_image_providers',
    description: 'Show which image providers are configured, their models and where images are saved.',
    inputSchema: { type: 'object', properties: {} },
  },
];

function slug(text) {
  return (text || 'image').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'image';
}

async function runImageTool(args, withInputs) {
  if (!args.prompt) throw new Error('prompt is required');
  const provider = pickProvider(args.provider);
  const images = withInputs ? await Promise.all((args.images || []).map(loadImage)) : [];
  if (withInputs && images.length === 0) throw new Error('images must contain at least one path or URL');
  const call = provider === 'openai' ? openaiImages : geminiImages;
  const result = await call({ ...args, images });
  if (result.images.length === 0) throw new Error(`${provider} returned no images.`);

  const content = [];
  const saved = [];
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const base = args.filename ? slug(args.filename) : `${slug(args.prompt)}-${stamp}`;
  if (!HTTP_MODE) await mkdir(OUTPUT_DIR, { recursive: true });

  for (const [i, img] of result.images.entries()) {
    const ext = EXT_BY_MIME[img.mime] || 'png';
    if (!HTTP_MODE) {
      const path = resolve(OUTPUT_DIR, `${base}${result.images.length > 1 ? `-${i + 1}` : ''}.${ext}`);
      await writeFile(path, img.bytes);
      saved.push(path);
    }
    if (img.bytes.length <= PREVIEW_MAX) {
      content.push({ type: 'image', data: img.bytes.toString('base64'), mimeType: img.mime });
    }
  }

  const lines = [`Provider: ${provider} (${result.model})`, `Images: ${result.images.length}`];
  if (saved.length) lines.push('Saved to:', ...saved.map((p) => `  ${p}`));
  const skipped = result.images.length - content.length;
  if (skipped) lines.push(`${skipped} image(s) too large for an inline preview — open the saved file.`);
  if (result.notes.length) lines.push(`Model notes: ${result.notes.join(' ').slice(0, 800)}`);
  content.unshift({ type: 'text', text: lines.join('\n') });
  return content;
}

async function callTool(name, args = {}) {
  switch (name) {
    case 'generate_image':
      return runImageTool(args, false);
    case 'edit_image':
      return runImageTool(args, true);
    case 'list_image_providers': {
      const configured = configuredProviders();
      let def = 'none';
      try { def = pickProvider(); } catch {}
      return [{
        type: 'text',
        text: [
          `openai: ${OPENAI_KEY ? 'configured' : 'not configured (set OPENAI_API_KEY)'} — model ${OPENAI_MODEL}`,
          `gemini: ${GEMINI_KEY ? 'configured' : 'not configured (set GEMINI_API_KEY)'} — model ${GEMINI_MODEL}`,
          `default provider: ${def}`,
          HTTP_MODE ? 'mode: HTTP (images returned inline only)' : `output folder: ${OUTPUT_DIR}`,
          configured.length ? '' : 'No provider is configured yet, so generation will fail until an API key is set.',
        ].filter(Boolean).join('\n'),
      }];
    }
    default:
      throw Object.assign(new Error(`Unknown tool: ${name}`), { code: -32602 });
  }
}

// ---------- JSON-RPC / MCP ----------

async function handleMessage(msg) {
  const { id, method, params } = msg;
  const isRequest = id !== undefined && id !== null;
  const reply = (result) => ({ jsonrpc: '2.0', id, result });
  const fail = (code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

  try {
    switch (method) {
      case 'initialize':
        return reply({
          protocolVersion: params?.protocolVersion || PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        });
      case 'ping':
        return reply({});
      case 'tools/list':
        return reply({ tools: TOOLS });
      case 'tools/call':
        try {
          return reply({ content: await callTool(params?.name, params?.arguments) });
        } catch (err) {
          if (err.code === -32602) return fail(-32602, err.message);
          return reply({ content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true });
        }
      default:
        if (!isRequest) return null; // notifications (e.g. notifications/initialized)
        return fail(-32601, `Method not found: ${method}`);
    }
  } catch (err) {
    return isRequest ? fail(-32603, err.message) : null;
  }
}

function startStdio() {
  const rl = createInterface({ input: process.stdin });
  rl.on('line', async (line) => {
    if (!line.trim()) return;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n');
      return;
    }
    const res = await handleMessage(msg);
    if (res) process.stdout.write(JSON.stringify(res) + '\n');
  });
}

function tokenMatches(given, expected) {
  const a = Buffer.from(given || '');
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function startHttp() {
  const token = env.IMAGE_STUDIO_TOKEN;
  if (!token || token.length < 24) {
    console.error('IMAGE_STUDIO_TOKEN (24+ characters) is required in HTTP mode, so strangers cannot spend your API credit.');
    process.exit(1);
  }
  const portArg = process.argv.indexOf('--port');
  const port = Number(portArg > -1 ? process.argv[portArg + 1] : env.PORT || 8787);

  createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(body === undefined ? '' : JSON.stringify(body));
    };
    if (url.pathname !== '/mcp') return send(404, { error: 'not found' });
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!tokenMatches(bearer || url.searchParams.get('token'), token)) return send(401, { error: 'unauthorised' });
    if (req.method !== 'POST') return send(405, { error: 'POST only' });

    let raw = '';
    for await (const chunk of req) raw += chunk;
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return send(400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    }
    if (Array.isArray(payload)) {
      const out = (await Promise.all(payload.map(handleMessage))).filter(Boolean);
      return out.length ? send(200, out) : send(202);
    }
    const out = await handleMessage(payload);
    return out ? send(200, out) : send(202);
  }).listen(port, () => console.error(`image-studio MCP listening on http://localhost:${port}/mcp`));
}

if (HTTP_MODE) startHttp();
else startStdio();
