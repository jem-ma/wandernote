import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { supabase } from './supabase';
import Login from './Login';
import PlaceInput from './PlaceInput';
import {
  getActiveTrip,
  createTrip,
  updateTrip,
  getEntriesForTrip,
  getInspiration,
  createEntry,
  createInspiration,
  updateInspiration,
  seedInspirationIfEmpty,
  dayLabel,
} from './data';

const BRAND = '#5DD9C1';

// ---------- atoms ----------
const Photo = ({ color = '#D6D2CA', h = 120, label }) => (
  <div
    className="w-full rounded-2xl flex items-end p-3 text-xs text-white/90 font-medium"
    style={{ background: color, height: h, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
  >
    {label && <span className="drop-shadow">{label}</span>}
  </div>
);

const Pill = ({ children, active, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2 rounded-full text-sm font-medium transition ${
      active ? 'text-white' : 'bg-white/70 text-ink border border-black/5'
    } ${className}`}
    style={active ? { background: BRAND } : {}}
  >
    {children}
  </button>
);

// ---------- icons ----------
const IconX = (p) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>;
const IconBack = (p) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 6l-6 6 6 6" /></svg>;
const IconPlus = (p) => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14" /></svg>;
const IconCam = (p) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
const IconUpload = (p) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>;
const IconPin = (p) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
const IconEdit = (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const IconBulb = (p) => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" /></svg>;
const IconMap = (p) => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>;
const IconSearch = (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;

// ---------- mappers ----------
const toEntry = (r) => ({
  id: r.id,
  day: dayLabel(r.created_at),
  title: r.title || 'Untitled',
  text: r.body || '',
  color: r.color || '#D5CDE8',
  media: r.media || [],
});
const toInspo = (r) => ({
  id: r.id,
  title: r.title || 'Untitled',
  note: r.note || '',
  link: r.link || '',
  color: r.color || '#C8E5D8',
  h: r.height || 180,
  media: r.media || [],
});

// ---------- Header ----------
function Header({ title, back, right }) {
  return (
    <div className="flex items-center justify-between px-5 pt-6 pb-4">
      {back ? (
        <button onClick={back} className="w-9 h-9 rounded-full bg-white shadow-soft flex items-center justify-center">
          <IconBack />
        </button>
      ) : <div className="w-9" />}
      <div className="text-sm font-medium">{title}</div>
      <div className="min-w-9 flex justify-end">{right || <div className="w-9" />}</div>
    </div>
  );
}

// ---------- BottomBar for form actions ----------
function ActionBar({ children }) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-[#F4EFE7] px-5 pt-3 pb-5 border-t border-black/5 z-30">
      <div className="flex gap-3">{children}</div>
    </div>
  );
}

// ---------- Home ----------
function Home({ go, onSignOut, hasTrip }) {
  const Tile = ({ label, accent, onClick }) => (
    <button
      onClick={onClick}
      className="w-full h-20 rounded-full flex items-center justify-between px-7 text-lg font-medium shadow-soft active:scale-[0.99] transition"
      style={{ background: accent ? BRAND : 'white', color: accent ? 'white' : '#2B2B2B' }}
    >
      <span>{label}</span>
      {accent && <span className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center"><IconPlus /></span>}
    </button>
  );
  return (
    <div className="px-5 pt-10 pb-28">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Wandernote</h1>
          <p className="text-sm text-black/50 mt-1">Your travel memory companion</p>
        </div>
        <button onClick={onSignOut} className="text-xs text-black/40 mt-2 underline">Sign out</button>
      </div>
      <div className="space-y-4">
        {hasTrip
          ? <Tile label="active trip!" onClick={() => go('trip')} />
          : <Tile label="begin a new trip" accent onClick={() => go('newtrip')} />}
        <Tile label="past trips" onClick={() => {}} />
        <Tile label="my inspiration" onClick={() => go('inspo')} />
        <Tile label="add something" accent onClick={() => go('add')} />
      </div>
    </div>
  );
}

// ---------- TripForm (new / edit) ----------
function TripForm({ back, onSave, initial, saving }) {
  const today = new Date().toISOString().slice(0,10);
  const [name, setName] = useState(initial?.name || '');
  const [start, setStart] = useState({
    name: initial?.start_point || 'home',
    lat: initial?.start_lat ?? null,
    lng: initial?.start_lng ?? null,
  });
  const [startDate, setStartDate] = useState(initial?.start_date || today);
  const [end, setEnd] = useState({
    name: initial?.end_point || '',
    lat: initial?.end_lat ?? null,
    lng: initial?.end_lng ?? null,
  });
  const [endUnknown, setEndUnknown] = useState(initial ? (initial.end_point == null) : false);
  const [endDate, setEndDate] = useState(initial?.end_date || '');

  const isEdit = !!initial;

  const submit = (e) => {
    e?.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      start_point: (start.name || '').trim() || 'home',
      start_lat: start.lat,
      start_lng: start.lng,
      start_date: startDate,
      end_point: endUnknown ? null : ((end.name || '').trim() || null),
      end_lat: endUnknown ? null : end.lat,
      end_lng: endUnknown ? null : end.lng,
      end_date: endDate || null,
    });
  };

  const field = "w-full rounded-2xl bg-white px-4 py-3 shadow-soft outline-none focus:ring-2 focus:ring-black/10 text-[15px]";
  const lbl = "text-xs uppercase tracking-wider text-black/50 mb-1 block";

  return (
    <div className="pb-28">
      <Header title={isEdit ? 'edit trip' : 'new trip'} back={back} />
      <form onSubmit={submit} className="px-5 space-y-4">
        <div><label className={lbl}>Trip name</label>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cornwall & Devon" required />
        </div>
        <div><label className={lbl}>Start point</label>
          <PlaceInput className={field} value={start} onChange={setStart} placeholder="home" />
        </div>
        <div><label className={lbl}>Start date</label>
          <input type="date" className={field} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div><label className={lbl}>End point</label>
          <PlaceInput
            className={field}
            value={endUnknown ? { name: '', lat: null, lng: null } : end}
            onChange={setEnd}
            disabled={endUnknown}
            placeholder={endUnknown ? 'Not sure yet' : 'Where to?'}
          />
          <label className="flex items-center gap-2 mt-2 text-sm text-black/60">
            <input type="checkbox" checked={endUnknown} onChange={(e) => setEndUnknown(e.target.checked)} />
            Not sure yet
          </label>
        </div>
        <div><label className={lbl}>End date</label>
          <input type="date" className={field} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </form>
      <ActionBar>
        <button type="button" onClick={back} className="flex-1 py-3 rounded-full border border-black/10 bg-white font-medium">Cancel</button>
        <button type="button" onClick={submit} disabled={saving} className="flex-1 py-3 rounded-full text-white font-medium disabled:opacity-60" style={{ background: BRAND }}>
          {saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Begin trip')}
        </button>
      </ActionBar>
    </div>
  );
}

// ---------- Trip / Entries ----------
function TripScreen({ back, entries, openEntry, onEdit, onAddJournal }) {
  const [tab, setTab] = useState('overview');
  const days = Array.from(new Set(entries.map(e => e.day)));
  const empty = entries.length === 0;
  return (
    <div className="pb-28">
      <Header
        title="active trip"
        back={back}
        right={
          <button onClick={onEdit} className="w-9 h-9 rounded-full bg-white shadow-soft flex items-center justify-center" aria-label="Edit trip">
            <IconEdit />
          </button>
        }
      />
      {empty ? (
        <div className="px-5 pt-12 flex flex-col items-center gap-5 text-center">
          <div className="text-sm text-black/50 max-w-[260px]">No entries yet. Start your story.</div>
          <button
            onClick={onAddJournal}
            className="w-full py-4 rounded-full text-white font-medium text-lg flex items-center justify-center gap-2 shadow-soft"
            style={{ background: BRAND }}
          >
            <IconPlus /> Add a journal entry
          </button>
        </div>
      ) : (
        <>
          <div className="px-5 flex gap-2 mb-5">
            <Pill active={tab === 'overview'} onClick={() => setTab('overview')}>Overview summary</Pill>
            <Pill active={tab === 'story'} onClick={() => setTab('story')}>Read the story</Pill>
          </div>
          {tab === 'overview' ? (
            <div className="space-y-6">
              {days.map(day => (
                <div key={day}>
                  <div className="px-5 text-xs uppercase tracking-wider text-black/50 mb-2">{day}</div>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
                    {entries.filter(e => e.day === day).map(e => (
                      <button
                        key={e.id}
                        onClick={() => openEntry(e.id)}
                        className="shrink-0 w-56 bg-white rounded-2xl shadow-soft overflow-hidden text-left active:scale-[0.99] transition"
                      >
                        <Photo color={e.color} h={110} />
                        <div className="p-3">
                          <div className="font-medium text-sm">{e.title}</div>
                          <div className="text-xs text-black/50 mt-1 line-clamp-2">{e.text}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 space-y-8">
              {entries.map((e, i) => (
                <div key={e.id} className="space-y-3">
                  <div className="text-xs uppercase tracking-wider text-black/40">{e.day}</div>
                  <h2 className="text-lg font-semibold">{e.title}</h2>
                  <p className="text-[15px] leading-relaxed text-black/70">{e.text}</p>
                  {i % 2 === 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 row-span-2"><Photo color={e.color} h={200} /></div>
                      <Photo color="#E8DFD0" h={96} />
                      <Photo color="#C8D8C0" h={96} />
                    </div>
                  ) : (
                    <Photo color={e.color} h={180} />
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EntryDetail({ back, entry }) {
  return (
    <div className="pb-28">
      <Header
        title="active trip"
        back={back}
        right={<span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#FFE0DA', color: '#C9503F' }}>ability to edit</span>}
      />
      <div className="px-5 space-y-4">
        <div className="text-xs uppercase tracking-wider text-black/40">{entry.day}</div>
        <h2 className="text-xl font-semibold">{entry.title}</h2>
        <div className="bg-white rounded-2xl p-4 shadow-soft text-[15px] leading-relaxed text-black/75">
          {entry.text}
        </div>
        <Photo color={entry.color} h={220} />
        <Photo color="#DCD3C4" h={160} />
      </div>
    </div>
  );
}

// ---------- Inspiration ----------
const FILTER_TAGS = ['Food', 'Cafés', 'Walks', 'Swims', 'Places to stay', 'Views', 'Bookshops'];

function Inspiration({ back, items, openItem }) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return items.filter(it => {
      const blob = (it.title + ' ' + it.note).toLowerCase();
      if (text && !blob.includes(text)) return false;
      if (selected.length && !selected.some(tag => blob.includes(tag.toLowerCase()))) return false;
      return true;
    });
  }, [items, q, selected]);

  return (
    <div className="pb-28">
      <Header title="inspiration" back={back} />
      <div className="px-5 mb-4 space-y-3">
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-soft">
          <IconSearch />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search inspiration…"
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
        <button onClick={() => setFiltersOpen(true)} className="px-4 py-2 rounded-full text-sm bg-black/5 text-black/60 border border-black/5">
          Set Filters {selected.length > 0 && <span className="ml-1 text-black/80 font-medium">· {selected.length}</span>}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 text-sm text-black/50">Nothing matches your search.</div>
      ) : (
        <div className="px-5 columns-2 gap-3 space-y-3">
          {filtered.map(item => {
            const hasPhoto = (item.media || []).some(m => m.kind === 'photo' || m.kind === 'upload');
            return (
              <button
                key={item.id}
                onClick={() => openItem(item.id)}
                className="block w-full break-inside-avoid bg-white rounded-2xl shadow-soft overflow-hidden text-left mb-3"
              >
                {hasPhoto && <Photo color={item.color} h={item.h} />}
                <div className="p-3">
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="text-xs text-black/50 mt-1 line-clamp-3">{item.note}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {filtersOpen && (
        <FilterPanel
          selected={selected}
          onChange={setSelected}
          close={() => setFiltersOpen(false)}
        />
      )}
    </div>
  );
}

function FilterPanel({ selected, onChange, close }) {
  const toggle = (tag) => {
    onChange(selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag]);
  };
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={close} />
      <div className="relative w-[78%] max-w-[300px] bg-[#F4EFE7] h-full p-5 shadow-xl flex flex-col gap-4 animate-[slide_.2s_ease-out]">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">Filters</div>
          <button onClick={close} className="w-9 h-9 rounded-full bg-white shadow-soft flex items-center justify-center"><IconX /></button>
        </div>
        <div className="text-xs uppercase tracking-wider text-black/50">Categories</div>
        <div className="flex flex-wrap gap-2">
          {FILTER_TAGS.map(tag => {
            const active = selected.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggle(tag)}
                className="px-3 py-1.5 rounded-full text-sm border"
                style={{
                  background: active ? BRAND : 'white',
                  color: active ? 'white' : '#2B2B2B',
                  borderColor: active ? BRAND : 'rgba(0,0,0,0.08)',
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <div className="mt-auto flex gap-2">
          <button onClick={() => onChange([])} className="flex-1 py-3 rounded-full bg-white border border-black/10 font-medium">Clear</button>
          <button onClick={close} className="flex-1 py-3 rounded-full text-white font-medium" style={{ background: BRAND }}>Done</button>
        </div>
      </div>
    </div>
  );
}

function InspoDetail({ back, item, onEdit }) {
  const hasPhoto = (item.media || []).some(m => m.kind === 'photo' || m.kind === 'upload');
  const hasLink = !!(item.link && item.link.trim() && item.link !== 'https://example.com');
  return (
    <div className="pb-28">
      <Header
        title="inspiration"
        back={back}
        right={
          <button onClick={onEdit} className="w-9 h-9 rounded-full bg-white shadow-soft flex items-center justify-center" aria-label="Edit">
            <IconEdit />
          </button>
        }
      />
      <div className="px-5 space-y-4">
        <h2 className="text-xl font-semibold">{item.title}</h2>
        <div className="bg-white rounded-2xl p-4 shadow-soft text-[15px] leading-relaxed text-black/75">
          {item.note}
        </div>
        {hasLink && (
          <button
            className="w-full py-3 rounded-full text-white font-medium"
            style={{ background: BRAND }}
            onClick={() => window.open(item.link, '_blank')}
          >
            open website link
          </button>
        )}
        {hasPhoto && <Photo color={item.color} h={240} />}
      </div>
    </div>
  );
}

function InspoForm({ back, onSave, initial, saving }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [note, setNote] = useState(initial?.note || '');
  const [link, setLink] = useState(initial?.link && initial.link !== 'https://example.com' ? initial.link : '');
  const [media, setMedia] = useState(initial?.media || []);

  const submit = (e) => {
    e?.preventDefault();
    if (!title.trim() && !note.trim()) return;
    onSave({ title: title.trim() || 'Untitled', note: note.trim(), link: link.trim() || null, media });
  };

  const field = "w-full rounded-2xl bg-white px-4 py-3 shadow-soft outline-none focus:ring-2 focus:ring-black/10 text-[15px]";
  const lbl = "text-xs uppercase tracking-wider text-black/50 mb-1 block";

  return (
    <div className="pb-28">
      <Header title="edit inspiration" back={back} />
      <form onSubmit={submit} className="px-5 space-y-4">
        <div><label className={lbl}>Title</label>
          <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div><label className={lbl}>Notes</label>
          <textarea className={`${field} h-36 resize-none`} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div><label className={lbl}>Link (optional)</label>
          <input className={field} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
        </div>
      </form>
      <ActionBar>
        <button type="button" onClick={back} className="flex-1 py-3 rounded-full border border-black/10 bg-white font-medium">Cancel</button>
        <button type="button" onClick={submit} disabled={saving} className="flex-1 py-3 rounded-full text-white font-medium disabled:opacity-60" style={{ background: BRAND }}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </ActionBar>
    </div>
  );
}

// ---------- Add flow ----------
const CATEGORIES = [
  { key: 'journal', label: 'Journal Entry', buttons: ['photo', 'upload'] },
  { key: 'tip', label: "Tip from someone I've met", buttons: ['photo', 'gps'] },
  { key: 'inspo', label: "Inspiration I've found", buttons: ['upload'] },
  { key: 'note', label: 'Random note', buttons: ['photo', 'upload'] },
];

function AddPicker({ close, pick }) {
  return (
    <div className="pb-28">
      <Header title="add something" right={<button onClick={close} className="w-9 h-9 rounded-full bg-white shadow-soft flex items-center justify-center"><IconX /></button>} />
      <div className="space-y-3 px-5 pt-2">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => pick(c)}
            className="w-full bg-white rounded-2xl py-4 px-5 text-left shadow-soft active:scale-[0.99] transition flex items-center justify-between"
          >
            <span className="font-medium">{c.label}</span>
            <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: BRAND, color: 'white' }}>
              <IconPlus />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AddForm({ close, back, category, onSave, saving }) {
  const [text, setText] = useState('');
  const [media, setMedia] = useState([]);

  const addMedia = (kind) => {
    const names = {
      photo: `photo_${Date.now().toString().slice(-4)}.jpg`,
      upload: `file_${Date.now().toString().slice(-4)}.png`,
      gps: `pin_${Date.now().toString().slice(-4)}.loc`,
    };
    setMedia(m => [...m, { id: Date.now() + Math.random(), kind, name: names[kind] }]);
  };

  const btn = (kind) => {
    const map = {
      photo: { icon: <IconCam />, label: 'Take a photo' },
      upload: { icon: <IconUpload />, label: category.key === 'inspo' ? 'Upload a screenshot or photo' : 'Upload things' },
      gps: { icon: <IconPin />, label: 'Set GPS Location' },
    };
    const m = map[kind];
    return (
      <button key={kind} onClick={() => addMedia(kind)}
        className="flex-1 bg-white rounded-2xl py-4 flex flex-col items-center justify-center gap-1 shadow-soft text-xs text-black/70">
        <span style={{ color: BRAND }}>{m.icon}</span>
        {m.label}
      </button>
    );
  };

  return (
    <div className="pb-28">
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="text-sm font-medium text-black/70 min-w-10">Add</div>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/5">{category.label}</span>
        <button onClick={close} className="w-9 h-9 rounded-full bg-white shadow-soft flex items-center justify-center min-w-9"><IconX /></button>
      </div>
      <div className="px-5 space-y-4">
        <div className="flex gap-3">
          {category.buttons.map(b => btn(b))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={category.key === 'note' ? 'note here' : 'text field'}
          className="w-full h-48 rounded-2xl bg-white p-4 shadow-soft text-[15px] resize-none outline-none focus:ring-2 focus:ring-black/10"
        />
        {media.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {media.map(m => (
              <div key={m.id} className="shrink-0 bg-white rounded-xl px-3 py-2 flex items-center gap-2 shadow-soft text-xs">
                <div className="w-8 h-8 rounded-md" style={{ background: m.kind === 'gps' ? '#E7D4F0' : '#C8E5D8' }} />
                <span>{m.name}</span>
                <button onClick={() => setMedia(media.filter(x => x.id !== m.id))} className="text-black/40"><IconX /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ActionBar>
        {back && <button onClick={back} className="flex-1 py-3 rounded-full border border-black/10 bg-white font-medium">Back</button>}
        <button disabled={saving} onClick={() => onSave({ text, media, category: category.key })}
          className="flex-1 py-3 rounded-full text-white font-medium disabled:opacity-60" style={{ background: BRAND }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </ActionBar>
    </div>
  );
}

// ---------- shell ----------
export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [entries, setEntries] = useState([]);
  const [inspo, setInspo] = useState([]);

  const [screen, setScreen] = useState('home'); // home | trip | inspo | newtrip | edittrip | add | editinspo
  const [addStep, setAddStep] = useState(null); // null | 'pick' | category obj
  const [addDirect, setAddDirect] = useState(false); // true = skip picker (no back button)
  const [saving, setSaving] = useState(false);
  const [openEntryId, setOpenEntryId] = useState(null);
  const [openInspoId, setOpenInspoId] = useState(null);

  // auth bootstrap
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // load data when signed in
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        await seedInspirationIfEmpty(session.user.id);
        const t = await getActiveTrip();
        setTrip(t);
        const [es, is] = await Promise.all([
          t ? getEntriesForTrip(t.id) : Promise.resolve([]),
          getInspiration(),
        ]);
        setEntries(es.map(toEntry));
        setInspo(is.map(toInspo));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  const openAdd = (category) => {
    setScreen('add');
    if (category) {
      setAddStep(category);
      setAddDirect(true);
    } else {
      setAddStep('pick');
      setAddDirect(false);
    }
  };

  const go = (s) => {
    if (s === 'add') return openAdd();
    if (s === 'trip' && !trip) { setScreen('newtrip'); return; }
    if (s === 'inspo') setOpenInspoId(null);
    if (s === 'trip') setOpenEntryId(null);
    setScreen(s);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setEntries([]); setInspo([]); setTrip(null); setScreen('home');
  };

  const handleSaveTrip = async (fields) => {
    if (!session) return;
    setSaving(true);
    try {
      let row;
      if (screen === 'edittrip' && trip) row = await updateTrip(trip.id, fields);
      else row = await createTrip(session.user.id, fields);
      setTrip(row);
      if (screen !== 'edittrip') {
        const es = await getEntriesForTrip(row.id);
        setEntries(es.map(toEntry));
      }
      setScreen('trip');
    } catch (e) {
      console.error(e); alert('Save failed: ' + e.message);
    } finally { setSaving(false); }
  };

  const handleSave = async ({ text, media, category }) => {
    if (!session) return;
    setSaving(true);
    try {
      if (category === 'inspo') {
        const row = await createInspiration(session.user.id, {
          title: text.slice(0, 40) || 'New inspiration',
          note: text, link: null, media,
        });
        setInspo(prev => [toInspo(row), ...prev]);
      } else {
        const row = await createEntry(session.user.id, trip?.id ?? null, {
          kind: category === 'tip' ? 'tip' : category === 'note' ? 'note' : 'journal',
          title: text.slice(0, 40) || 'New entry',
          body: text, media,
        });
        setEntries(prev => [toEntry(row), ...prev]);
      }
      setScreen(trip ? 'trip' : 'home');
      setAddStep(null); setAddDirect(false);
    } catch (e) {
      console.error(e); alert('Save failed: ' + e.message);
    } finally { setSaving(false); }
  };

  const handleSaveInspo = async (fields) => {
    if (!openInspoId) return;
    setSaving(true);
    try {
      const row = await updateInspiration(openInspoId, fields);
      setInspo(prev => prev.map(i => i.id === row.id ? toInspo(row) : i));
      setScreen('inspo');
    } catch (e) {
      console.error(e); alert('Save failed: ' + e.message);
    } finally { setSaving(false); }
  };

  const currentEntry = entries.find(e => e.id === openEntryId);
  const currentInspo = inspo.find(i => i.id === openInspoId);

  if (!authReady) return null;
  if (!session) return <Login />;

  const journalCategory = CATEGORIES.find(c => c.key === 'journal');
  const hideNav = screen === 'newtrip' || screen === 'edittrip' || screen === 'add' || screen === 'editinspo';

  return (
    <div className="min-h-full flex justify-center" style={{ background: '#EEE9E1' }}>
      <div className="relative w-full max-w-[390px] min-h-screen bg-[#F4EFE7]">
        {loading ? (
          <div className="pt-24 text-center text-sm text-black/40">Loading…</div>
        ) : (
          <>
            {screen === 'home' && <Home go={go} onSignOut={handleSignOut} hasTrip={!!trip} />}
            {screen === 'newtrip' && <TripForm back={() => setScreen('home')} onSave={handleSaveTrip} saving={saving} />}
            {screen === 'edittrip' && <TripForm back={() => setScreen('trip')} onSave={handleSaveTrip} saving={saving} initial={trip} />}
            {screen === 'trip' && !currentEntry && (
              <TripScreen
                back={() => setScreen('home')}
                entries={entries}
                openEntry={setOpenEntryId}
                onEdit={() => setScreen('edittrip')}
                onAddJournal={() => openAdd(journalCategory)}
              />
            )}
            {screen === 'trip' && currentEntry && <EntryDetail back={() => setOpenEntryId(null)} entry={currentEntry} />}
            {screen === 'inspo' && !currentInspo && (
              <Inspiration back={() => setScreen('home')} items={inspo} openItem={setOpenInspoId} />
            )}
            {screen === 'inspo' && currentInspo && (
              <InspoDetail back={() => setOpenInspoId(null)} item={currentInspo} onEdit={() => setScreen('editinspo')} />
            )}
            {screen === 'editinspo' && currentInspo && (
              <InspoForm back={() => setScreen('inspo')} onSave={handleSaveInspo} saving={saving} initial={currentInspo} />
            )}
            {screen === 'add' && addStep === 'pick' && (
              <AddPicker close={() => setScreen('home')} pick={(c) => setAddStep(c)} />
            )}
            {screen === 'add' && addStep && addStep !== 'pick' && (
              <AddForm
                category={addStep}
                close={() => setScreen(trip ? 'trip' : 'home')}
                back={addDirect ? null : () => setAddStep('pick')}
                onSave={handleSave}
                saving={saving}
              />
            )}
          </>
        )}

        {!hideNav && (
          <BottomNav
            screen={screen}
            onInspo={() => go('inspo')}
            onTrips={() => go('trip')}
            onAdd={() => openAdd()}
          />
        )}
      </div>
    </div>
  );
}

function BottomNav({ screen, onInspo, onTrips, onAdd }) {
  const NavBtn = ({ label, icon, active, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1 py-2 px-3 min-w-14" style={{ color: active ? BRAND : '#7a7670' }}>
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] flex justify-center pointer-events-none pb-3 z-30">
      <div className="pointer-events-auto w-[94%] max-w-[370px] bg-white rounded-full shadow-soft flex items-center justify-between px-4 py-2 relative">
        <NavBtn label="Inspo" icon={<IconBulb />} active={screen === 'inspo'} onClick={onInspo} />
        <div className="w-14" />
        <button
          onClick={onAdd}
          className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center active:scale-95 transition"
          style={{ background: BRAND, boxShadow: '0 8px 20px rgba(93,217,193,0.5)' }}
          aria-label="Add"
        >
          <IconPlus width="26" height="26" />
        </button>
        <NavBtn label="My Trips" icon={<IconMap />} active={screen === 'trip'} onClick={onTrips} />
      </div>
    </div>
  );
}
