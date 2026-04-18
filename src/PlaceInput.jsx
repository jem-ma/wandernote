import { useEffect, useRef, useState } from 'react';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Debounced Mapbox geocoding autocomplete.
// value: { name: string, lat: number|null, lng: number|null }
export default function PlaceInput({ value, onChange, placeholder, disabled, className }) {
  const [text, setText] = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const sessionRef = useRef(cryptoToken());
  const timerRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    setText(value?.name || '');
  }, [value?.name]);

  useEffect(() => {
    const onDoc = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const query = (q) => {
    if (!TOKEN || !q || q.length < 2) { setSuggestions([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(q)}&language=en&limit=5&session_token=${sessionRef.current}&access_token=${TOKEN}`;
        const r = await fetch(url);
        const j = await r.json();
        setSuggestions(j.suggestions || []);
      } catch (e) {
        console.error('Mapbox suggest failed', e);
      }
    }, 220);
  };

  const pick = async (s) => {
    try {
      const r = await fetch(`https://api.mapbox.com/search/searchbox/v1/retrieve/${s.mapbox_id}?session_token=${sessionRef.current}&access_token=${TOKEN}`);
      const j = await r.json();
      const feat = j.features?.[0];
      const [lng, lat] = feat?.geometry?.coordinates || [null, null];
      const name = feat?.properties?.full_address || feat?.properties?.name || s.name;
      setText(name);
      onChange({ name, lat, lng });
      setOpen(false);
      sessionRef.current = cryptoToken();
    } catch (e) {
      console.error('Mapbox retrieve failed', e);
    }
  };

  const handleInput = (v) => {
    setText(v);
    onChange({ name: v, lat: null, lng: null });
    query(v);
    setOpen(true);
  };

  return (
    <div className="relative" ref={boxRef}>
      <input
        className={className}
        value={text}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => text && setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-2xl shadow-soft overflow-hidden border border-black/5">
          {suggestions.map(s => (
            <button
              type="button"
              key={s.mapbox_id}
              onClick={() => pick(s)}
              className="w-full text-left px-4 py-3 hover:bg-black/5 border-b border-black/5 last:border-0"
            >
              <div className="text-sm font-medium">{s.name}</div>
              {s.place_formatted && (
                <div className="text-xs text-black/50 mt-0.5">{s.place_formatted}</div>
              )}
            </button>
          ))}
        </div>
      )}
      {!TOKEN && text && (
        <div className="text-[11px] text-black/40 mt-1">Mapbox token missing — free text only.</div>
      )}
    </div>
  );
}

function cryptoToken() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
