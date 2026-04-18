import { supabase } from './supabase';

// ---------- trips ----------
export async function getActiveTrip() {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function ensureActiveTrip(userId) {
  const existing = await getActiveTrip();
  if (existing) return existing;
  const { data, error } = await supabase
    .from('trips')
    .insert({ user_id: userId, name: 'Cornwall & Devon', status: 'active' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------- entries ----------
export async function getEntriesForTrip(tripId) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createEntry(userId, tripId, { kind, title, body, media, color }) {
  const { data, error } = await supabase
    .from('entries')
    .insert({
      user_id: userId,
      trip_id: tripId,
      kind: kind || 'journal',
      title,
      body,
      color: color || '#D5CDE8',
      media: media || [],
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------- inspiration ----------
export async function getInspiration() {
  const { data, error } = await supabase
    .from('inspiration')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createInspiration(userId, { title, note, link, media, color, height }) {
  const { data, error } = await supabase
    .from('inspiration')
    .insert({
      user_id: userId,
      title,
      note,
      link: link || null,
      color: color || '#C8E5D8',
      height: height || 180,
      media: media || [],
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------- seed on first login ----------
export async function seedIfEmpty(userId) {
  const trip = await ensureActiveTrip(userId);
  const { count: entryCount } = await supabase
    .from('entries').select('*', { count: 'exact', head: true });
  const { count: inspoCount } = await supabase
    .from('inspiration').select('*', { count: 'exact', head: true });

  if ((entryCount ?? 0) === 0) {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const seed = [
      { offset: 0,       title: 'Morning coffee in Tintagel', body: 'Rolled into Tintagel at sunrise. Parked the van near the cliffs and had a flat white from a tiny hatch café. Waves crashing below, gulls everywhere.', color: '#F5C6B3' },
      { offset: 3*60*60*1000, title: 'Cliff walk to the castle', body: 'Walked the coast path to the castle ruins. Wind almost knocked me over but the views were unreal.', color: '#C8E5D8' },
      { offset: 6*60*60*1000, title: 'Fish & chips on the harbour', body: 'Chippy in Boscastle. Ate sat on the harbour wall with a cold cider.', color: '#E7D4F0' },
      { offset: day,          title: 'Wild swim at Crackington', body: 'Cold, gasping, glorious. Stayed in the water about 4 minutes.', color: '#B7D9E8' },
      { offset: day + 3*60*60*1000, title: 'Farm shop find', body: 'Tiny honesty-box farm shop. Bought eggs, cheese, and a sourdough for the van.', color: '#F3DFA2' },
      { offset: 4*day,        title: 'Dartmoor overnight', body: 'Pulled off on a quiet lane on the moor. Stars were wild.', color: '#D5CDE8' },
    ].map(s => ({
      user_id: userId,
      trip_id: trip.id,
      kind: 'journal',
      title: s.title,
      body: s.body,
      color: s.color,
      media: [],
      created_at: new Date(now - s.offset).toISOString(),
    }));
    const { error } = await supabase.from('entries').insert(seed);
    if (error) throw error;
  }

  if ((inspoCount ?? 0) === 0) {
    const inspo = [
      { title: 'Coastal walk near St Ives', note: 'Carbis Bay → St Ives via the coast path. Apparently the best stretch in Cornwall.', color: '#B8E0D2', height: 180 },
      { title: 'Tiny café in Hay-on-Wye', note: 'Book-lined café above the second-hand bookshop. Cardamom buns.', color: '#F6CBA5', height: 220 },
      { title: 'Wild swim spot — Dartmoor', note: 'Sharrah Pool on the Dart. 30 min walk in from Newbridge.', color: '#A9D4E8', height: 200 },
      { title: 'Bakery in Bruton', note: 'At The Chapel. Weekend queue out the door.', color: '#E8C9D9', height: 160 },
    ].map(i => ({ user_id: userId, link: 'https://example.com', media: [], ...i }));
    const { error } = await supabase.from('inspiration').insert(inspo);
    if (error) throw error;
  }

  return trip;
}

// ---------- day label grouping ----------
export function dayLabel(isoString) {
  const d = new Date(isoString);
  const today = new Date();
  today.setHours(0,0,0,0);
  const that = new Date(d); that.setHours(0,0,0,0);
  const diffDays = Math.round((today - that) / (1000*60*60*24));
  const fmt = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  if (diffDays === 0) return `Today · ${fmt}`;
  if (diffDays === 1) return `Yesterday · ${fmt}`;
  if (diffDays < 7) {
    const wd = d.toLocaleDateString('en-GB', { weekday: 'long' });
    return `${wd} · ${fmt}`;
  }
  return fmt;
}
