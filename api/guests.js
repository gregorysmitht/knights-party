import { json, guard, allRsvps } from './_lib.js';

// Host only: every RSVP with full details.
export async function GET(request) {
  const denied = await guard(request);
  if (denied) return denied;
  return json({ ok: true, guests: await allRsvps() });
}
