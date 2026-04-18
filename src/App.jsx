import { useEffect, useState } from 'react';
import './App.css';
import { supabase } from './supabase';
import Login from './Login';
import {
  ensureActiveTrip,
  getEntriesForTrip,
  getInspiration,
  createEntry,
  createInspiration,
  seedIfEmpty,
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
function Home({ go, onSignOut, email }) {
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
        <Tile label="active trip!" onClick={() => go('trip')} />
        <Tile label="past trips" onClick={() => {}} />
        <Tile label="my inspiration" onClick={() => go('inspo')} />
        <Tile label="add something" accent onClick={() => go('add')} />
      </div>
      {email && <div className="text-[11px] text-black/30 text-center mt-6">Signed in as {email}</div>}
    </div>
  );
}

function TripScreen({ back, entries, openEntry }) {
  const [tab, setTab] = useState('overview');
  const days = Array.from(new Set(entries.map(e => e.day)));
  return (
    <div className="pb-28">
      <Header title="active trip" back={back} />
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
    <Sheet close={close} title="add something">
      <div className="space-y-3 p-5">
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
    </Sheet>
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
    <Sheet
      close={close}
      leftLabel="Add"
      centre={<span className="px-3 py-1 rounded-full text-xs font-medium bg-black/5">{category.label}</span>}
    >
      <div className="p-5 space-y-4">
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
    </Sheet>
  );
}

function Sheet({ close, title, leftLabel, centre, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={close} />
      <div className="relative w-full max-w-[390px] bg-[#F4EFE7] rounded-t-3xl shadow-xl max-h-[92%] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div className="text-sm font-medium text-black/70 min-w-10">{leftLabel || ''}</div>
          <div className="flex-1 text-center text-sm font-medium">{centre || title}</div>
          <button onClick={close} className="w-9 h-9 rounded-full bg-white shadow-soft flex items-center justify-center min-w-9">
            <IconX />
          </button>
        </div>
        {children}
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
        const t = await seedIfEmpty(session.user.id);
        setTrip(t);
        const [es, is] = await Promise.all([
          getEntriesForTrip(t.id),
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
    if (s === 'add') setAddStep('pick');
    else setScreen(s);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setEntries([]); setInspo([]); setTrip(null); setScreen('home');
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
        const row = await createEntry(session.user.id, trip.id, {
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
            {screen === 'home' && <Home go={go} onSignOut={handleSignOut} email={session.user.email} />}
            {screen === 'trip' && !currentEntry && (
              <TripScreen back={() => setScreen('home')} entries={entries} openEntry={setOpenEntryId} />
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
          </>
        )}

        {addStep === 'pick' && (
          <AddPicker close={() => setAddStep(null)} pick={(c) => setAddStep(c)} />
        )}
        {addStep && addStep !== 'pick' && (
          <AddForm
            category={addStep}
            close={() => setAddStep(null)}
            back={() => setAddStep('pick')}
            onSave={handleSave}
            saving={saving}
          />
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
