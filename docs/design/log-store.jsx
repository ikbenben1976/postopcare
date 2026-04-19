// log-store.jsx — Shared care-log store. Persists to localStorage.
// Every mutation in the app flows through here so vitals/meds/falls/check-ins
// all show up in one unified feed and can be attributed to a stakeholder.

const LOG_KEY = 'rlca_care_log_v1';

// Seed entries (so history screens and "last taken" have something to read).
// These render as if they happened earlier today or over the past week.
const SEED_LOG = [
  { id: 's1', kind: 'med',       ts: '2026-04-19T08:04', by: 'linda', detail: { name: 'Apixaban',  dose: '5 mg',   action: 'taken' } },
  { id: 's2', kind: 'med',       ts: '2026-04-19T08:00', by: 'linda', detail: { name: 'Acetaminophen', dose: '650 mg', action: 'taken' } },
  { id: 's3', kind: 'med',       ts: '2026-04-19T08:04', by: 'linda', detail: { name: 'Lisinopril', dose: '10 mg',  action: 'taken' } },
  { id: 's4', kind: 'med',       ts: '2026-04-19T09:00', by: 'aide',  detail: { name: 'Levofloxacin', dose: '750 mg', action: 'taken' } },
  { id: 's5', kind: 'vitals',    ts: '2026-04-19T07:12', by: 'linda', detail: { bp: '128/78', hr: 92, spo2: 93, temp: 100.2, pain: 4 } },
  { id: 's6', kind: 'checkin',   ts: '2026-04-18T20:30', by: 'rick',  detail: { feeling: 'ok', note: 'Tired but ate dinner. PT exercises done.' } },
];

const { useState: useState4, useEffect: useEffect4, useCallback } = React;

function loadLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return SEED_LOG;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_LOG;
  } catch { return SEED_LOG; }
}

// Global singleton so all hook consumers see the same list.
let _log = loadLog();
const _subs = new Set();
function _publish() { _subs.forEach(fn => fn(_log)); }
function _persist() {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(_log)); } catch {}
}

function useCareLog() {
  const [log, setLog] = useState4(_log);
  useEffect4(() => {
    _subs.add(setLog);
    return () => _subs.delete(setLog);
  }, []);

  const addEntry = useCallback((entry) => {
    const full = {
      id: 'l_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      ts: new Date().toISOString().slice(0, 16),
      ...entry,
    };
    _log = [full, ...(_log || [])];
    _persist(); _publish();
    return full;
  }, []);

  const clearAll = useCallback(() => {
    _log = SEED_LOG.slice();
    _persist(); _publish();
  }, []);

  // Derived helpers
  const byKind = (kind) => log.filter(e => e.kind === kind);
  const lastOf = (kind, match) => log.find(e =>
    e.kind === kind && (!match || Object.entries(match).every(([k, v]) => e.detail?.[k] === v))
  );

  return { log, addEntry, clearAll, byKind, lastOf };
}

// Friendly-relative time formatter for the feed
function relTime(iso) {
  if (!iso) return '';
  // Anchor "now" at Apr 19, 2026 3:14 PM for deterministic demo text.
  const now = new Date('2026-04-19T15:14');
  const then = new Date(iso.length <= 16 ? iso : iso.slice(0, 16));
  const diffMin = Math.round((now - then) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 12) return `${diffHr} hr ago`;
  // Same day?
  const sameDay = now.toDateString() === then.toDateString();
  const hm = then.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Today, ${hm}`;
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (y.toDateString() === then.toDateString()) return `Yesterday, ${hm}`;
  return then.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + hm;
}

function whoName(id) {
  return ({ linda: 'Linda', rick: 'Rick', amy: 'Amy', ben: 'Ben', aide: 'Aide' }[id]) || id;
}

Object.assign(window, { useCareLog, relTime, whoName });
