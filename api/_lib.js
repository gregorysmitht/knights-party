import { put, get, list, del } from '@vercel/blob';
import { timingSafeEqual } from 'node:crypto';

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export const clean = (s, n) =>
  String(s ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

export const digits = (s) => String(s ?? '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');

export const BRING = ['Fresh fruit platter', 'Veggie tray with dip', 'Cookies', 'Cupcakes', 'Drinks', 'Other'];
export const DIET = ['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Nut allergy', 'Other'];

const OPTS = { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' };

export async function readJSON(path) {
  try {
    const r = await get(path, { access: 'private', useCache: false });
    if (r && r.stream) return JSON.parse(await new Response(r.stream).text());
  } catch {}
  return null;
}

export const writeJSON = (path, data) => put(path, JSON.stringify(data), OPTS);
export const removeBlob = (path) => del(path);
export const rsvpPath = (phone) => `rsvps/${phone}.json`;

export async function allRsvps() {
  const paths = [];
  let cursor;
  do {
    const page = await list({ prefix: 'rsvps/', cursor, limit: 1000 });
    page.blobs.forEach((b) => paths.push(b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const recs = await Promise.all(paths.map(readJSON));
  return recs.filter(Boolean).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

const DEFAULT_SETTINGS = {
  foodNote: 'Appetizers, finger foods, fruit and desserts. Every family brings something to share.',
  open: true,
};

export async function readSettings() {
  return { ...DEFAULT_SETTINGS, ...((await readJSON('meta/settings.json')) || {}) };
}

export function passcodeOk(given) {
  const expected = process.env.HOST_PASSCODE || '';
  const a = Buffer.from(String(given || '')), b = Buffer.from(expected);
  return expected.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

export async function guard(request) {
  if (!process.env.HOST_PASSCODE) return json({ error: 'The host passcode is not set up yet.' }, 500);
  if (!passcodeOk(request.headers.get('x-host-code'))) {
    await new Promise((r) => setTimeout(r, 600));
    return json({ error: 'That passcode is not right.' }, 401);
  }
  return null;
}

export async function body(request) {
  try { return await request.json(); } catch { return null; }
}
