import { json, clean, guard, readSettings, writeJSON, body } from './_lib.js';

// Public read: the food note and whether RSVPs are open.
export async function GET() {
  const s = await readSettings();
  return json({ foodNote: s.foodNote, open: s.open });
}

// Host only: change the food note or open/close RSVPs without a redeploy.
export async function POST(request) {
  const denied = await guard(request);
  if (denied) return denied;
  const b = await body(request);
  if (!b) return json({ error: 'Something went wrong saving that. Try again.' }, 400);
  const s = { ...(await readSettings()) };
  if (typeof b.foodNote === 'string') s.foodNote = clean(b.foodNote, 400);
  if (typeof b.open === 'boolean') s.open = b.open;
  s.updatedAt = new Date().toISOString();
  await writeJSON('meta/settings.json', s);
  return json({ ok: true, settings: s });
}
