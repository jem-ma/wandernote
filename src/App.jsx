import { useEffect, useState } from 'react';
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
  seedInspirationIfEmpty,
  dayLabel,
} from './data';

const BRAND = '#5DD9C1';

// ---------- small UI atoms ----------
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

const IconX = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
const IconBack = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);
const IconPlus = (p) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IconCam = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
const IconUpload = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </svg>
);
const IconPin = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconCompass = (p) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.2 7.8 13.4 13.4 7.8 16.2 10.6 10.6 16.2 7.8" />
  </svg>
);
const IconEdit = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconMap = (p) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

// ---------- row → UI mappers ----------
const toEntry = (r) => ({
  id: r.id,
  day: dayLabel(r.created_at),
  title: r.title || 'Untitled',
  text: r.body || '',
  color: r.color || '#D5CDE8',
});
const toInspo = (r) => ({
  id: r.id,
  title: r.title || 'Untitled',
  note: r.note || '',
  link: r.link || '#',
  color: r.color || '#C8E5D8',
  h: r.height || 180,
});

// ---------- screens ----------
function Home({ go, onSignOut, hasTrip }) {
  const Tile = ({ label, accent, onClick }) => (
    <button
      onClick={onClick}
      className="w-full h-20 rounded-full flex items-center justify-between px-7 text-lg font-medium shadow-soft active:scale-[0.99] transition"
      style={{
        background: accent ? BRAND : 'white',
        color: accent ? 'white' : '#2B2B2B',
      }}
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
    e.preventDefault();
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
  const label = "text-xs uppercase tracking-wider text-black/50 mb-1 block";

  return (
    <div className="pb-32">
      <Header title={isEdit ? 'edit trip' : 'new trip'} back={back} />
      <form onSubmit={submit} className="px-5 space-y-4">
        <div>
          <label className={label}>Trip name</label>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cornwall & Devon" required />
        </div>
        <div>
          <label className={label}>Start point</label>
          <PlaceInput className={field} value={start} onChange={setStart} placeholder="home" />
        </div>
        <div>
          <label className={label}>Start date</label>
          <input type="date" className={field} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className={label}>End point</label>
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
        <div>
          <label className={label}>End date</label>
          <input type="date" className={field} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={back} className="flex-1 py-3 rounded-full border border-black/10 bg-white font-medium">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-3 rounded-full text-white font-medium disabled:opacity-60" style={{ background: BRAND }}>
            {saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Begin trip')}
          </button>
        </div>
      </form>
    </div>
  );
}

function TripScreen({ back, entries, openEntry, onEdit }) {
  const [tab, setTab] = useState('overview');
  const days = Array.from(new Set(entries.map(e => e.day)));
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
      <div className="px-5 flex gap-2 mb-5">
        <Pill active={tab === 'overview'} onClick={() => setTab('overview')}>Overview summary</Pill>
        <Pill active={tab === 'story'} onClick={() => setTab('story')}>Read the story</Pill>
      </div>
      {entries.length === 0 && (
        <div className="px-5 text-sm text-black/50">No entries yet. Tap + to add one.</div>
      )}
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

function Inspiration({ back, items, openItem }) {
  return (
    <div className="pb-28">
      <Header title="inspiration" back={back} />
      <div className="px-5 mb-4">
        <button className="px-4 py-2 rounded-full text-sm bg-black/5 text-black/50 border border-black/5">Set Filters</button>
      </div>
      {items.length === 0 ? (
        <div className="px-5 text-sm text-black/50">No inspiration saved yet.</div>
      ) : (
        <div className="px-5 columns-2 gap-3 space-y-3">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => openItem(item.id)}
              className="block w-full break-inside-avoid bg-white rounded-2xl shadow-soft overflow-hidden text-left mb-3"
            >
              <Photo color={item.color} h={item.h} />
              <div className="p-3">
                <div className="font-medium text-sm">{item.title}</div>
                <div className="text-xs text-black/50 mt-1 line-clamp-3">{item.note}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InspoDetail({ back, item }) {
  return (
    <div className="pb-28">
      <Header title="inspiration" back={back} />
      <div className="px-5 space-y-4">
        <h2 className="text-xl font-semibold">{item.title}</h2>
        <div className="bg-white rounded-2xl p-4 shadow-soft text-[15px] leading-relaxed text-black/75">
          {item.note}
        </div>
        <button
          className="w-full py-3 rounded-full text-white font-medium"
          style={{ background: BRAND }}
          onClick={() => window.open(item.link, '_blank')}
        >
          open website link
        </button>
        <Photo color={item.color} h={240} />
      </div>
    </div>
  );
}

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
      <button
        key={kind}
        onClick={() => addMedia(kind)}
        className="flex-1 bg-white rounded-2xl py-4 flex flex-col items-center justify-center gap-1 shadow-soft text-xs text-black/70"
      >
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
        <div className="flex gap-3 pt-2">
          <button onClick={back} className="flex-1 py-3 rounded-full border border-black/10 bg-white font-medium">Back</button>
          <button
            disabled={saving}
            onClick={() => onSave({ text, media, category: category.key })}
            className="flex-1 py-3 rounded-full text-white font-medium disabled:opacity-60"
            style={{ background: BRAND }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
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

  const [screen, setScreen] = useState('home');
  const [addStep, setAddStep] = useState(null);
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

  const go = (s) => {
    if (s === 'add') { setAddStep('pick'); setScreen('add'); return; }
    if (s === 'trip' && !trip) { setScreen('newtrip'); return; }
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
      console.error(e);
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async ({ text, media, category }) => {
    if (!session) return;
    setSaving(true);
    try {
      if (category === 'inspo') {
        const row = await createInspiration(session.user.id, {
          title: text.slice(0, 40) || 'New inspiration',
          note: text,
          link: 'https://example.com',
          media,
        });
        setInspo(prev => [toInspo(row), ...prev]);
      } else {
        const row = await createEntry(session.user.id, trip?.id ?? null, {
          kind: category === 'tip' ? 'tip' : category === 'note' ? 'note' : 'journal',
          title: text.slice(0, 40) || 'New entry',
          body: text,
          media,
        });
        setEntries(prev => [toEntry(row), ...prev]);
      }
      setAddStep(null);
    } catch (e) {
      console.error(e);
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const currentEntry = entries.find(e => e.id === openEntryId);
  const currentInspo = inspo.find(i => i.id === openInspoId);

  if (!authReady) return null;
  if (!session) return <Login />;

  return (
    <div className="min-h-full flex justify-center" style={{ background: '#EEE9E1' }}>
      <div className="relative w-full max-w-[390px] min-h-screen bg-[#F4EFE7]">
        {loading ? (
          <div className="pt-24 text-center text-sm text-black/40">Loading your trip…</div>
        ) : (
          <>
            {screen === 'home' && <Home go={go} onSignOut={handleSignOut} hasTrip={!!trip} />}
            {screen === 'newtrip' && (
              <TripForm back={() => setScreen('home')} onSave={handleSaveTrip} saving={saving} />
            )}
            {screen === 'edittrip' && (
              <TripForm back={() => setScreen('trip')} onSave={handleSaveTrip} saving={saving} initial={trip} />
            )}
            {screen === 'trip' && !currentEntry && (
              <TripScreen
                back={() => setScreen('home')}
                entries={entries}
                openEntry={setOpenEntryId}
                onEdit={() => setScreen('edittrip')}
              />
            )}
            {screen === 'trip' && currentEntry && (
              <EntryDetail back={() => setOpenEntryId(null)} entry={currentEntry} />
            )}
            {screen === 'inspo' && !currentInspo && (
              <Inspiration back={() => setScreen('home')} items={inspo} openItem={setOpenInspoId} />
            )}
            {screen === 'inspo' && currentInspo && (
              <InspoDetail back={() => setOpenInspoId(null)} item={currentInspo} />
            )}
            {screen === 'add' && addStep === 'pick' && (
              <AddPicker close={() => setScreen('home')} pick={(c) => setAddStep(c)} />
            )}
            {screen === 'add' && addStep && addStep !== 'pick' && (
              <AddForm
                category={addStep}
                close={() => setScreen('home')}
                back={() => setAddStep('pick')}
                onSave={handleSave}
                saving={saving}
              />
            )}
          </>
        )}

        <BottomNav
          screen={screen}
          onInspo={() => { setOpenInspoId(null); setScreen('inspo'); }}
          onTrips={() => { setOpenEntryId(null); setScreen('trip'); }}
          onAdd={() => setAddStep('pick')}
        />
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
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none pb-3">
      <div className="pointer-events-auto w-[94%] max-w-[370px] bg-white rounded-full shadow-soft flex items-center justify-between px-4 py-2 relative">
        <NavBtn label="Inspo" icon={<IconCompass />} active={screen === 'inspo'} onClick={onInspo} />
        <button
          onClick={onAdd}
          className="w-14 h-14 rounded-full text-white shadow-lg -mt-8 flex items-center justify-center active:scale-95 transition"
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
