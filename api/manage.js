import { json, digits, guard, readJSON, writeJSON, removeBlob, rsvpPath, body } from './_lib.js';

// Host only: { phone, action: 'hide' | 'show' | 'remove' }
export async function POST(request) {
  const denied = await guard(request);
  if (denied) return denied;
  const b = await body(request);
  const phone = digits(b?.phone);
  const path = rsvpPath(phone);
  const rec = phone.length === 10 ? await readJSON(path) : null;
  if (!rec) return json({ error: 'That RSVP is gone already. Refresh the list.' }, 404);

  if (b.action === 'remove') {
    await removeBlob(path);
    return json({ ok: true, removed: phone });
  }
  if (b.action === 'hide' || b.action === 'show') {
    rec.hidden = b.action === 'hide';
    await writeJSON(path, rec);
    return json({ ok: true, record: rec });
  }
  return json({ error: 'Unknown action.' }, 400);
}
