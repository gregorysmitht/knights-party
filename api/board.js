import { json, allRsvps, BRING } from './_lib.js';

// Public: who's coming, with no phone numbers or dietary details.
const shortName = (full) => {
  const parts = String(full).trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
};

export async function GET() {
  const recs = await allRsvps();
  const going = recs.filter((r) => r.attending);
  const coaches = going.filter((r) => r.role === 'coach').map((r) => ({ name: shortName(r.player) }));
  const players = going
    .filter((r) => r.playerComing && r.role !== 'coach')
    .map((r) => ({ name: shortName(r.player), jersey: r.jersey || '' }))
    .sort((a, b) => (Number(a.jersey) || 999) - (Number(b.jersey) || 999) || a.name.localeCompare(b.name));
  const moments = recs
    .filter((r) => r.moment && !r.hidden)
    .map((r) => ({ name: shortName(r.player), jersey: r.jersey || '', text: r.moment }));
  // Food sign-up: who is bringing what (short names only)
  const signup = BRING.map((item) => ({
    item,
    people: going.filter((r) => r.bring === item).map((r) => ({ name: shortName(r.player), what: item === 'Other' ? r.bringOther : '' })),
  }));
  const others = going.reduce((n, r) => n + (r.others || []).length, 0);
  return json({
    players,
    coaches,
    moments,
    signup,
    totals: { players: players.length, coaches: coaches.length, others, people: players.length + coaches.length + others, families: going.length },
  });
}
