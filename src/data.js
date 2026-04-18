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

export async function createTrip(userId, fields) {
  const { data, error } = await supabase
    .from('trips')
    .insert({
      user_id: userId,
      status: 'active',
      name: fields.name,
      start_point: fields.start_point || 'home',
      start_date: fields.start_date || new Date().toISOString().slice(0,10),
      end_point: fields.end_point || null,
      end_date: fields.end_date || null,
      start_lat: fields.start_lat ?? null,
      start_lng: fields.start_lng ?? null,
      end_lat: fields.end_lat ?? null,
      end_lng: fields.end_lng ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTrip(id, fields) {
  const { data, error } = await supabase
    .from('trips')
    .update({
      name: fields.name,
      start_point: fields.start_point,
      start_date: fields.start_date,
      end_point: fields.end_point,
      end_date: fields.end_date,
      start_lat: fields.start_lat ?? null,
      start_lng: fields.start_lng ?? null,
      end_lat: fields.end_lat ?? null,
      end_lng: fields.end_lng ?? null,
    })
    .eq('id', id)
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

// ---------- seed inspiration on first login ----------
export async function seedInspirationIfEmpty(userId) {
  const { count } = await supabase
    .from('inspiration').select('*', { count: 'exact', head: true });
  if ((count ?? 0) > 0) return;
  const inspo = [
    { title: 'Coastal walk near St Ives', note: 'Carbis Bay → St Ives via the coast path. Apparently the best stretch in Cornwall.', color: '#B8E0D2', height: 180 },
    { title: 'Tiny café in Hay-on-Wye', note: 'Book-lined café above the second-hand bookshop. Cardamom buns.', color: '#F6CBA5', height: 220 },
    { title: 'Wild swim spot — Dartmoor', note: 'Sharrah Pool on the Dart. 30 min walk in from Newbridge.', color: '#A9D4E8', height: 200 },
    { title: 'Bakery in Bruton', note: 'At The Chapel. Weekend queue out the door.', color: '#E8C9D9', height: 160 },
  ].map(i => ({ user_id: userId, link: 'https://example.com', media: [], ...i }));
  const { error } = await supabase.from('inspiration').insert(inspo);
  if (error) throw error;
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
