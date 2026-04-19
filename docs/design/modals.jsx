// modals.jsx — Shared bottom-sheet modal + the four logging forms:
// MedActionSheet, LogVitalsForm, CheckinForm, LogFallForm.
// All write through useCareLog.

const { useState: useStateM } = React;

// ── Reusable bottom sheet ────────────────────────────────────
function Sheet({ title, kicker, onClose, children, footer }) {
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'oklch(0.2 0.02 260 / 0.45)',
      display: 'flex', alignItems: 'flex-end', zIndex: 40,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: 'var(--surface)',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: '92%', overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '10px 18px 6px' }}>
          <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 999, margin: '0 auto 12px' }}/>
          {kicker && <div className="t-label">{kicker}</div>}
          <div className="t-h2" style={{ marginTop: 2 }}>{title}</div>
        </div>
        <div style={{ padding: '8px 18px 18px', flex: 1 }}>{children}</div>
        {footer && (
          <div style={{
            padding: '12px 18px 20px', borderTop: '1px solid var(--hairline)',
            background: 'var(--surface)', position: 'sticky', bottom: 0,
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

// ── Med action sheet: Taken / Skip (with reason) ─────────────
function MedActionSheet({ med, by, onClose, onLogged }) {
  const { addEntry } = useCareLog();
  const [mode, setMode] = useStateM(null); // null | 'take' | 'skip'
  const [reason, setReason] = useStateM('');
  const reasons = ['Rick refused', 'Already taken', 'Not feeling well', 'Waiting on doctor', 'Other'];

  const logTaken = () => {
    addEntry({ kind: 'med', by, detail: { name: med.name, dose: med.dose, action: 'taken' } });
    onLogged?.('taken'); onClose();
  };
  const logSkipped = () => {
    addEntry({ kind: 'med', by, detail: { name: med.name, dose: med.dose, action: 'skipped', reason: reason || 'Other' } });
    onLogged?.('skipped'); onClose();
  };

  return (
    <Sheet title={med.name + ' · ' + med.dose} kicker="Log this dose" onClose={onClose}>
      {!mode && (
        <div className="stack-10">
          <button className="btn primary" style={{ width: '100%', padding: 14, justifyContent: 'flex-start' }} onClick={() => setMode('take')}>
            <IconCheck className="icon"/>Mark as taken now
          </button>
          <button className="btn secondary" style={{ width: '100%', padding: 14, justifyContent: 'flex-start' }} onClick={() => setMode('skip')}>
            <IconX className="icon"/>Skip this dose…
          </button>
          <div className="card-sunken" style={{ padding: 12, marginTop: 4 }}>
            <div className="t-label">Last taken</div>
            <div className="t-body-sm" style={{ marginTop: 2 }}>{med.lastTaken}</div>
          </div>
        </div>
      )}
      {mode === 'take' && (
        <div className="stack-10">
          <div className="card-sunken" style={{ padding: 14 }}>
            <div className="t-body">Confirm: {med.name} {med.dose} taken just now by {whoName(by)}.</div>
          </div>
          <div className="row-flex" style={{ gap: 8 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => setMode(null)}>Back</button>
            <button className="btn primary" style={{ flex: 2 }} onClick={logTaken}><IconCheck className="icon-sm"/>Confirm</button>
          </div>
        </div>
      )}
      {mode === 'skip' && (
        <div className="stack-10">
          <div className="t-label">Why skipped?</div>
          <div className="stack-6">
            {reasons.map(r => (
              <button key={r} onClick={() => setReason(r)}
                className={`card`}
                style={{
                  padding: 12, textAlign: 'left', cursor: 'pointer',
                  border: reason === r ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: reason === r ? 'var(--accent-wash)' : 'var(--surface)',
                  width: '100%', fontFamily: 'inherit',
                }}>
                <span className="t-body-sm">{r}</span>
              </button>
            ))}
          </div>
          <div className="row-flex" style={{ gap: 8 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => setMode(null)}>Back</button>
            <button className="btn secondary" style={{ flex: 2 }} disabled={!reason} onClick={logSkipped}>Log as skipped</button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

// ── Log vitals form ──────────────────────────────────────────
function LogVitalsForm({ by, onClose, onLogged }) {
  const { addEntry } = useCareLog();
  const [sys, setSys] = useStateM(''); const [dia, setDia] = useStateM('');
  const [hr, setHr] = useStateM(''); const [spo2, setSpo2] = useStateM('');
  const [temp, setTemp] = useStateM(''); const [pain, setPain] = useStateM(4);

  const submit = () => {
    const detail = {};
    if (sys && dia) detail.bp = `${sys}/${dia}`;
    if (hr) detail.hr = Number(hr);
    if (spo2) detail.spo2 = Number(spo2);
    if (temp) detail.temp = Number(temp);
    detail.pain = pain;
    addEntry({ kind: 'vitals', by, detail });
    onLogged?.(); onClose();
  };

  const anyField = sys || dia || hr || spo2 || temp;

  return (
    <Sheet title="Log vitals" kicker="Now" onClose={onClose}
      footer={
        <div className="row-flex" style={{ gap: 8 }}>
          <button className="btn ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn primary" style={{ flex: 2 }} disabled={!anyField} onClick={submit}>Save reading</button>
        </div>
      }>
      <div className="stack-12">
        <div>
          <div className="t-label" style={{ marginBottom: 6 }}>Blood pressure</div>
          <div className="row-flex" style={{ gap: 10, alignItems: 'center' }}>
            <NumInput value={sys} onChange={setSys} placeholder="120" max={3} w={74}/>
            <span className="muted-2 t-h3">/</span>
            <NumInput value={dia} onChange={setDia} placeholder="80" max={3} w={74}/>
            <span className="t-meta">mmHg</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FieldRow label="Heart rate" unit="bpm"><NumInput value={hr} onChange={setHr} placeholder="88" max={3}/></FieldRow>
          <FieldRow label="SpO₂" unit="%"><NumInput value={spo2} onChange={setSpo2} placeholder="96" max={3}/></FieldRow>
          <FieldRow label="Temp" unit="°F"><NumInput value={temp} onChange={setTemp} placeholder="98.6" max={5}/></FieldRow>
          <FieldRow label="Pain" unit="/10">
            <div className="row-flex" style={{ gap: 4 }}>
              {[0,2,4,6,8,10].map(n => (
                <button key={n} onClick={() => setPain(n)}
                  style={{
                    width: 28, height: 28, borderRadius: 8, border: pain === n ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: pain === n ? 'var(--accent-wash)' : 'var(--surface)',
                    color: 'var(--ink)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{n}</button>
              ))}
            </div>
          </FieldRow>
        </div>
      </div>
    </Sheet>
  );
}

function FieldRow({ label, unit, children }) {
  return (
    <div className="stack-4">
      <div className="t-label">{label}</div>
      <div className="row-flex" style={{ gap: 6, alignItems: 'center' }}>
        {children}
        {unit && <span className="t-meta">{unit}</span>}
      </div>
    </div>
  );
}

function NumInput({ value, onChange, placeholder, max = 3, w = 64 }) {
  return (
    <input
      type="text" inputMode="decimal" value={value}
      onChange={e => onChange(e.target.value.slice(0, max))}
      placeholder={placeholder}
      style={{
        width: w, padding: '8px 10px', borderRadius: 10,
        border: '1px solid var(--border)', background: 'var(--surface)',
        fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--ink)',
        textAlign: 'center',
      }}
    />
  );
}

// ── 30-sec check-in ──────────────────────────────────────────
function CheckinForm({ by, onClose, onLogged }) {
  const { addEntry } = useCareLog();
  const [feeling, setFeeling] = useStateM(null);
  const [flags, setFlags] = useStateM([]);
  const [note, setNote] = useStateM('');

  const feelings = [
    { id: 'good',    label: 'Good',        emoji: '◠', tone: 'ok' },
    { id: 'ok',      label: 'OK',          emoji: '◠', tone: 'info' },
    { id: 'off',     label: 'Off',         emoji: '◠', tone: 'warning' },
    { id: 'bad',     label: 'Bad',         emoji: '◠', tone: 'critical' },
  ];
  const chips = ['More pain', 'Less appetite', 'Dizzy', 'Short of breath', 'Fell or stumbled', 'Confused', 'Swelling'];

  const toggleFlag = (f) => setFlags(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const submit = () => {
    addEntry({ kind: 'checkin', by, detail: { feeling, flags, note: note.trim() } });
    onLogged?.(); onClose();
  };

  return (
    <Sheet title="30-second check-in" kicker="How is Rick right now?" onClose={onClose}
      footer={
        <div className="row-flex" style={{ gap: 8 }}>
          <button className="btn ghost" style={{ flex: 1 }} onClick={onClose}>Later</button>
          <button className="btn primary" style={{ flex: 2 }} disabled={!feeling} onClick={submit}>Save check-in</button>
        </div>
      }>
      <div className="stack-14">
        <div>
          <div className="t-label" style={{ marginBottom: 8 }}>Overall</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {feelings.map(f => (
              <button key={f.id} onClick={() => setFeeling(f.id)}
                style={{
                  padding: '14px 6px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                  border: feeling === f.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: feeling === f.id ? 'var(--accent-wash)' : 'var(--surface)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 999,
                  background: `var(--${f.tone === 'info' ? 'accent' : f.tone})`,
                  opacity: 0.85,
                }}/>
                <div className="t-body-sm" style={{ fontWeight: 600 }}>{f.label}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="t-label" style={{ marginBottom: 8 }}>Anything new? (tap all that apply)</div>
          <div className="row-flex" style={{ gap: 6, flexWrap: 'wrap' }}>
            {chips.map(c => {
              const on = flags.includes(c);
              return (
                <button key={c} onClick={() => toggleFlag(c)}
                  style={{
                    padding: '8px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
                    border: on ? '1.5px solid var(--warning)' : '1px solid var(--border)',
                    background: on ? 'var(--warning-wash)' : 'var(--surface)',
                    color: on ? 'var(--warning-ink)' : 'var(--ink-2)',
                    fontSize: 12.5, fontWeight: 600,
                  }}>
                  {c}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="t-label" style={{ marginBottom: 6 }}>Note (optional)</div>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Anything else you want Amy or Ben to see…"
            style={{
              width: '100%', minHeight: 80, padding: '10px 12px', borderRadius: 12,
              border: '1px solid var(--border)', background: 'var(--surface)',
              fontSize: 14, fontFamily: 'inherit', color: 'var(--ink)', resize: 'vertical',
            }}/>
        </div>
      </div>
    </Sheet>
  );
}

// ── Log fall / incident ──────────────────────────────────────
function LogFallForm({ by, onClose, onLogged }) {
  const { addEntry } = useCareLog();
  const [where, setWhere] = useStateM('');
  const [injury, setInjury] = useStateM(false);
  const [attention, setAttention] = useStateM(false);
  const [note, setNote] = useStateM('');

  const locations = ['Bathroom', 'Bedroom', 'Living room', 'Kitchen', 'Stairs', 'Outdoors', 'Other'];

  const submit = () => {
    addEntry({ kind: 'fall', by, detail: { location: where || 'Other', injury, required_attention: attention, circumstances: note.trim() } });
    onLogged?.(); onClose();
  };

  return (
    <Sheet title="Log a fall or incident" kicker="Record for Rick's history" onClose={onClose}
      footer={
        <div className="row-flex" style={{ gap: 8 }}>
          <button className="btn ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn primary" style={{ flex: 2 }} disabled={!where} onClick={submit}>Save incident</button>
        </div>
      }>
      <div className="stack-14">
        <div>
          <div className="t-label" style={{ marginBottom: 6 }}>Where</div>
          <div className="row-flex" style={{ gap: 6, flexWrap: 'wrap' }}>
            {locations.map(l => {
              const on = where === l;
              return (
                <button key={l} onClick={() => setWhere(l)}
                  style={{
                    padding: '8px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
                    border: on ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: on ? 'var(--accent-wash)' : 'var(--surface)',
                    color: on ? 'var(--accent-ink)' : 'var(--ink-2)',
                    fontSize: 12.5, fontWeight: 600,
                  }}>{l}</button>
              );
            })}
          </div>
        </div>
        <div className="stack-6">
          <ToggleRow label="Injury" sub="Any cuts, bruises, pain or soreness after" value={injury} onChange={setInjury}/>
          <ToggleRow label="Needed medical attention" sub="Urgent care, ER, or a provider call" value={attention} onChange={setAttention}/>
        </div>
        <div>
          <div className="t-label" style={{ marginBottom: 6 }}>What happened</div>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Tripped on rug, caught himself…"
            style={{
              width: '100%', minHeight: 84, padding: '10px 12px', borderRadius: 12,
              border: '1px solid var(--border)', background: 'var(--surface)',
              fontSize: 14, fontFamily: 'inherit', color: 'var(--ink)', resize: 'vertical',
            }}/>
        </div>
      </div>
    </Sheet>
  );
}

function ToggleRow({ label, sub, value, onChange }) {
  return (
    <label className="row-flex" style={{ gap: 12, padding: '6px 0', cursor: 'pointer' }}>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)}
        style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}/>
      <div className="stack-2" style={{ flex: 1 }}>
        <div className="t-body-sm" style={{ fontWeight: 600 }}>{label}</div>
        <div className="t-meta">{sub}</div>
      </div>
    </label>
  );
}

// ── Log symptom ──────────────────────────────────────────────
function LogSymptomForm({ by, onClose, onLogged }) {
  const { addEntry } = useCareLog();
  const [what, setWhat] = useStateM('');
  const [location, setLocation] = useStateM('');
  const [severity, setSeverity] = useStateM(4);
  const [when, setWhen] = useStateM('today');
  const [triggers, setTriggers] = useStateM([]);
  const [note, setNote] = useStateM('');

  const common = [
    { id: 'pain',      label: 'Pain' },
    { id: 'swelling',  label: 'Swelling' },
    { id: 'cough',     label: 'Cough' },
    { id: 'nausea',    label: 'Nausea' },
    { id: 'dizzy',     label: 'Dizziness' },
    { id: 'fatigue',   label: 'Fatigue' },
    { id: 'sob',       label: 'Short of breath' },
    { id: 'rash',      label: 'Rash' },
    { id: 'headache',  label: 'Headache' },
    { id: 'bleeding',  label: 'Bleeding / bruising' },
    { id: 'confused',  label: 'Confusion' },
    { id: 'fever',     label: 'Fever / chills' },
  ];
  const locations = ['Left knee (surgery)', 'Right knee', 'Chest', 'Abdomen', 'Head', 'Back', 'Arm', 'Leg', 'General'];
  const whens = [
    { id: 'now',       label: 'Just now' },
    { id: 'today',     label: 'Earlier today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'days',      label: 'Few days' },
  ];
  const triggerChips = ['After walking', 'After eating', 'After new med', 'At rest', 'Lying down', 'Morning', 'Night'];

  const toggleTrigger = (t) => setTriggers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  // Severity colour ramp: 0–3 ok, 4–6 warning, 7–10 critical
  const sevTone = severity >= 7 ? 'critical' : severity >= 4 ? 'warning' : 'ok';

  const submit = () => {
    addEntry({ kind: 'symptom', by, detail: {
      what, location: location || null, severity,
      started: when, triggers, note: note.trim(),
    }});
    onLogged?.(); onClose();
  };

  return (
    <Sheet title="Log a symptom" kicker="Something Rick is feeling" onClose={onClose}
      footer={
        <div className="row-flex" style={{ gap: 8 }}>
          <button className="btn ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn primary" style={{ flex: 2 }} disabled={!what} onClick={submit}>Save symptom</button>
        </div>
      }>
      <div className="stack-14">
        <div>
          <div className="t-label" style={{ marginBottom: 8 }}>What is it</div>
          <div className="row-flex" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {common.map(c => {
              const on = what === c.label;
              return (
                <button key={c.id} onClick={() => setWhat(c.label)}
                  style={{
                    padding: '8px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
                    border: on ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: on ? 'var(--accent-wash)' : 'var(--surface)',
                    color: on ? 'var(--accent-ink)' : 'var(--ink-2)',
                    fontSize: 12.5, fontWeight: 600,
                  }}>{c.label}</button>
              );
            })}
          </div>
          <input value={what} onChange={e => setWhat(e.target.value)}
            placeholder="Or describe in your own words…"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 12,
              border: '1px solid var(--border)', background: 'var(--surface)',
              fontSize: 14, fontFamily: 'inherit', color: 'var(--ink)',
            }}/>
        </div>

        <div>
          <div className="t-label" style={{ marginBottom: 6 }}>Where on the body (optional)</div>
          <div className="row-flex" style={{ gap: 6, flexWrap: 'wrap' }}>
            {locations.map(l => {
              const on = location === l;
              return (
                <button key={l} onClick={() => setLocation(on ? '' : l)}
                  style={{
                    padding: '7px 11px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
                    border: on ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: on ? 'var(--accent-wash)' : 'var(--surface)',
                    color: on ? 'var(--accent-ink)' : 'var(--ink-2)',
                    fontSize: 12, fontWeight: 600,
                  }}>{l}</button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="row-flex" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <div className="t-label">Severity (0–10)</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: `var(--${sevTone}-ink)` }}>
              {severity}
            </div>
          </div>
          <input type="range" min="0" max="10" step="1" value={severity}
            onChange={e => setSeverity(+e.target.value)}
            style={{ width: '100%', accentColor: `var(--${sevTone})` }}/>
          <div className="row-flex" style={{ justifyContent: 'space-between', marginTop: 2 }}>
            <span className="t-meta">None</span>
            <span className="t-meta">Mild</span>
            <span className="t-meta">Bad</span>
            <span className="t-meta">Worst</span>
          </div>
        </div>

        <div>
          <div className="t-label" style={{ marginBottom: 6 }}>Started</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {whens.map(w => (
              <button key={w.id} onClick={() => setWhen(w.id)}
                style={{
                  padding: '8px 4px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                  border: when === w.id ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  background: when === w.id ? 'var(--accent-wash)' : 'var(--surface)',
                  color: when === w.id ? 'var(--accent-ink)' : 'var(--ink-2)',
                  fontSize: 12, fontWeight: 600,
                }}>{w.label}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="t-label" style={{ marginBottom: 6 }}>Triggers (optional)</div>
          <div className="row-flex" style={{ gap: 6, flexWrap: 'wrap' }}>
            {triggerChips.map(t => {
              const on = triggers.includes(t);
              return (
                <button key={t} onClick={() => toggleTrigger(t)}
                  style={{
                    padding: '7px 11px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
                    border: on ? '1.5px solid var(--warning)' : '1px solid var(--border)',
                    background: on ? 'var(--warning-wash)' : 'var(--surface)',
                    color: on ? 'var(--warning-ink)' : 'var(--ink-2)',
                    fontSize: 12, fontWeight: 600,
                  }}>{t}</button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="t-label" style={{ marginBottom: 6 }}>Note (optional)</div>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="What makes it better or worse? Anything Amy or the doctor should see…"
            style={{
              width: '100%', minHeight: 72, padding: '10px 12px', borderRadius: 12,
              border: '1px solid var(--border)', background: 'var(--surface)',
              fontSize: 14, fontFamily: 'inherit', color: 'var(--ink)', resize: 'vertical',
            }}/>
        </div>

        {severity >= 7 && (
          <div className="card" style={{
            padding: '10px 12px', borderRadius: 12,
            background: 'var(--critical-wash)', border: '1px solid var(--critical-edge)',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <IconAlertTriangle className="icon" style={{ color: 'var(--critical-ink)', flexShrink: 0 }}/>
            <div className="t-body-sm" style={{ color: 'var(--critical-ink)' }}>
              This is severe. Consider generating an ER handoff or calling Rick's surgeon.
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

Object.assign(window, { Sheet, MedActionSheet, LogVitalsForm, CheckinForm, LogFallForm, LogSymptomForm });
