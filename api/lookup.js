import { json, digits, readJSON, rsvpPath, body } from './_lib.js';

export async function POST(request) {
  const b = await body(request);
  const phone = digits(b?.phone);
  if (phone.length !== 10) return json({ error: 'Enter the 10-digit mobile number you used to RSVP.' }, 400);
  const rec = await readJSON(rsvpPath(phone));
  if (!rec) {
    await new Promise((r) => setTimeout(r, 400));
    return json({ error: "No RSVP found for that number. Check the number, or RSVP below." }, 404);
  }
  return json({ ok: true, record: rec });
}
