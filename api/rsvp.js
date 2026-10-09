import { json, clean, digits, DIET, BRING, readJSON, writeJSON, rsvpPath, readSettings, body } from './_lib.js';

export async function POST(request) {
  const b = await body(request);
  if (!b) return json({ error: 'Something went wrong sending that. Try again.' }, 400);
  if (b.website) return json({ ok: true }); // bot trap

  const phone = digits(b.phone);
  const player = clean(b.player, 60);
  if (player.length < 2) return json({ error: b.role === 'coach' ? 'Add your name.' : "Add your player's name." }, 400);
  if (phone.length !== 10) return json({ error: 'Add a 10-digit mobile number so you can change your RSVP later.' }, 400);

  const path = rsvpPath(phone);
  const existing = await readJSON(path);
  const settings = await readSettings();
  if (!settings.open && !existing) return json({ error: 'RSVPs are closed. Text the host if your plans changed.' }, 403);

  const attending = b.attending === true;
  const role = b.role === 'coach' ? 'coach' : 'player';
  const diet = Array.isArray(b.diet) ? [...new Set(b.diet.filter((d) => DIET.includes(d)))] : [];
  const others = Array.isArray(b.others) ? b.others.map((n) => clean(n, 60)).filter(Boolean).slice(0, 15) : [];
  const bring = attending && BRING.includes(b.bring) ? b.bring : '';
  const bringOther = bring === 'Other' ? clean(b.bringOther, 80) : '';
  if (bring === 'Other' && !bringOther) return json({ error: 'Tell us what you\'re bringing.' }, 400);
  const now = new Date().toISOString();

  const rec = {
    phone,
    player,
    role,
    jersey: role === 'coach' ? '' : clean(b.jersey, 3).replace(/\D/g, '').slice(0, 2),
    attending,
    playerComing: attending ? (role === 'coach' || b.playerComing !== false) : false,
    others: attending ? others : [],
    bring,
    bringOther,
    diet: attending ? diet : [],
    dietOther: attending && diet.includes('Other') ? clean(b.dietOther, 140) : '',
    moment: clean(b.moment, 220),
    hidden: existing?.hidden === true,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  if (attending && !rec.playerComing && rec.others.length === 0) {
    return json({ error: 'Add at least one person who is coming, or choose "Can\'t make it".' }, 400);
  }

  await writeJSON(path, rec);
  return json({ ok: true, record: rec, updated: Boolean(existing) });
}
