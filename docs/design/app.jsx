// app.jsx — Root v2: Today / Profile / ER / People / Records routing + bottom nav + tweaks

const { useState: useState3, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mpaStatus": "inactive",
  "bltActive": true,
  "stakeholder": "linda",
  "online": true,
  "accent": "teal"
}/*EDITMODE-END*/;

const ACCENT_MAP = {
  teal:       { accent: 'oklch(0.52 0.09 195)', ink: 'oklch(0.38 0.08 195)', wash: 'oklch(0.96 0.025 195)', edge: 'oklch(0.86 0.05 195)' },
  indigo:     { accent: 'oklch(0.48 0.10 265)', ink: 'oklch(0.36 0.10 265)', wash: 'oklch(0.96 0.02 265)',  edge: 'oklch(0.86 0.04 265)' },
  terracotta: { accent: 'oklch(0.58 0.12 40)',  ink: 'oklch(0.44 0.12 40)',  wash: 'oklch(0.97 0.025 40)',  edge: 'oklch(0.88 0.05 40)' },
  sage:       { accent: 'oklch(0.52 0.08 150)', ink: 'oklch(0.38 0.08 150)', wash: 'oklch(0.96 0.02 150)',  edge: 'oklch(0.86 0.04 150)' },
};

function App() {
  const [tweaks, setTweaks] = useState3(() => {
    try {
      const saved = localStorage.getItem('rlca_tweaks_v2');
      return saved ? { ...TWEAK_DEFAULTS, ...JSON.parse(saved) } : TWEAK_DEFAULTS;
    } catch { return TWEAK_DEFAULTS; }
  });

  // Route has two shapes: a main tab ('today','profile','people','records','ER')
  // or a detail screen ('allergies','surgery','mpa')
  const [route, setRoute] = useState3(() => localStorage.getItem('rlca_route_v2') || 'today');
  const [tweakPanelOpen, setTweakPanelOpen] = useState3(false);

  useEffect(() => { localStorage.setItem('rlca_tweaks_v2', JSON.stringify(tweaks)); }, [tweaks]);
  useEffect(() => { localStorage.setItem('rlca_route_v2', route); }, [route]);

  useEffect(() => {
    const a = ACCENT_MAP[tweaks.accent] || ACCENT_MAP.teal;
    const root = document.documentElement;
    root.style.setProperty('--accent', a.accent);
    root.style.setProperty('--accent-ink', a.ink);
    root.style.setProperty('--accent-wash', a.wash);
    root.style.setProperty('--accent-edge', a.edge);
  }, [tweaks.accent]);

  useEffect(() => {
    function handler(e) {
      if (e.data?.type === '__activate_edit_mode') setTweakPanelOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweakPanelOpen(false);
    }
    window.addEventListener('message', handler);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch {}
    return () => window.removeEventListener('message', handler);
  }, []);

  const updateTweak = (patch) => {
    const next = { ...tweaks, ...patch };
    setTweaks(next);
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*'); } catch {}
  };

  const sh = tweaks.stakeholder;
  const DETAIL_ROUTES = ['allergies', 'surgery'];
  const backTarget = sh === 'amy' ? 'records' : 'profile';
  const currentTab = DETAIL_ROUTES.includes(route) ? backTarget : route;

  let screen;
  switch (route) {
    case 'profile':
      screen = <ProfileScreen onNav={setRoute} stakeholder={sh} mpaStatus={tweaks.mpaStatus} bltActive={tweaks.bltActive}/>; break;
    case 'allergies':
      screen = <AllergiesScreen onBack={() => setRoute(backTarget)} stakeholder={sh}/>; break;
    case 'surgery':
      screen = <SurgeryScreen onBack={() => setRoute(backTarget)} bltActive={tweaks.bltActive}/>; break;
    case 'mpa':
      screen = <MPAScreen onBack={() => setRoute(sh === 'amy' ? 'today' : 'profile')} status={tweaks.mpaStatus}
                          onActivate={() => updateTweak({ mpaStatus: 'active' })} stakeholder={sh}/>; break;
    case 'ER':
      screen = <ERHandoffScreen onBack={() => setRoute('today')}/>; break;
    case 'meds':
      screen = <MedsScreen onBack={() => setRoute('today')} canLog={sh === 'linda' || sh === 'rick' || sh === 'aide'} stakeholder={sh}/>; break;
    case 'vitals':
      screen = <VitalsScreen onBack={() => setRoute('today')} canLog={sh === 'linda' || sh === 'rick' || sh === 'aide'} stakeholder={sh}/>; break;
    case 'people':
      screen = <PeopleScreen onBack={() => setRoute('today')} stakeholder={sh}/>; break;
    case 'records':
      screen = <RecordsScreen onNav={setRoute} onBack={() => setRoute('today')} stakeholder={sh}/>; break;
    case 'settings':
      screen = <ComingSoon label="Settings" kicker="Integrations &amp; exports" onBack={() => setRoute('today')}/>; break;
    case 'today':
    default:
      screen = <TodayScreen onNav={setRoute} stakeholder={sh} online={tweaks.online}/>;
  }

  return (
    <div className="app-wrap">
      <DesktopChrome stakeholder={tweaks.stakeholder}/>
      <div className="phone-stage">
        <div className="phone-frame">
          <div className="phone-screen scroll-y">
            <div className="status-bar">
              <span className="mono">3:14</span>
              <span style={{ display: 'flex', gap: 4, alignItems: 'center', opacity: 0.9 }}>
                <span style={{ fontSize: 10 }}>●●●●</span>
                <span style={{ fontSize: 10 }}>{tweaks.online ? 'LTE' : 'Offline'}</span>
                <span style={{
                  display: 'inline-block', width: 22, height: 10,
                  border: '1px solid currentColor', borderRadius: 2, position: 'relative',
                }}>
                  <span style={{ position: 'absolute', inset: 1, width: '85%', background: 'currentColor', borderRadius: 1 }}/>
                </span>
              </span>
            </div>
            <div style={{ paddingTop: 8, paddingBottom: 8 }}>
              {screen}
            </div>
            <BottomNav current={currentTab} onNav={setRoute} stakeholder={sh}/>
          </div>
        </div>
        <SidePanel route={route}/>
      </div>

      <StakeholderSwitcher current={tweaks.stakeholder} onChange={id => updateTweak({ stakeholder: id })}/>

      {tweakPanelOpen && (
        <TweakPanel tweaks={tweaks} onChange={updateTweak} onClose={() => setTweakPanelOpen(false)}/>
      )}
    </div>
  );
}

// ── Placeholder screen for modules not in this iteration ─────
function ComingSoon({ label, kicker, onBack }) {
  return (
    <>
      <ScreenHeader title={label} kicker={kicker} onBack={onBack}/>
      <div className="stack-16" style={{ padding: '0 14px 140px' }}>
        <div className="card-sunken" style={{ padding: 24, textAlign: 'center' }}>
          <div className="t-h3" style={{ marginBottom: 6 }}>{label}</div>
          <div className="t-body-sm muted-2">Module scoped for the next iteration.</div>
        </div>
      </div>
    </>
  );
}

// ── Desktop chrome ───────────────────────────────────────────
function DesktopChrome({ stakeholder }) {
  const s = STAKEHOLDERS.find(x => x.id === stakeholder) || STAKEHOLDERS[0];
  return (
    <div style={{ padding: '28px 36px 12px', display: 'flex',
      alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
      <div className="stack-4">
        <div className="t-label" style={{ color: 'var(--accent-ink)' }}>Module 01 · Patient profile &amp; clinical context</div>
        <div className="t-display">Rick &amp; Linda Care App</div>
        <div className="t-body-sm muted-2">v2 · warm caregiver direction · mobile prototype, viewed as {s.role}</div>
      </div>
      <div className="row-flex" style={{ gap: 8 }}>
        <span className="chip neutral">402 × 820</span>
        <span className="chip accent">iOS · v2</span>
      </div>
    </div>
  );
}

// ── Side panel ───────────────────────────────────────────────
function SidePanel({ route }) {
  const notes = {
    today: {
      title: 'Today',
      bullets: [
        'Primary surface: a vertical timeline of meds, vitals, PT, and check-ins — anchored by "Now".',
        'Four vital tiles with 7-day sparklines show direction, not just today\'s number.',
        'Life-threatening allergies remain always-visible at the bottom of the scroll.',
        'Hero card shows recovery progress (Week 5 of 12, BLT) so context stays human.',
      ],
    },
    profile: {
      title: 'Rick',
      bullets: [
        'Hero card + quick-facts strip replaces the old dense header.',
        'Pastel category cards — one tint per domain (allergy=rose, surgery=sand, MPA=lavender, meds=mint, people=peach).',
        'Chips preview the most important truth of each section without drilling in.',
        'Scoped aide hides meds, diagnoses, and MPA.',
      ],
    },
    allergies: {
      title: 'Allergies',
      bullets: [
        'Life-threatening gets a standalone card with filled icon + left-rule + critical wash — triple-coded.',
        'Tap any allergy to open a bottom sheet with "verified by" / "entered by" attribution.',
        'Moderate and mild grouped separately so scanning is severity-first.',
      ],
    },
    surgery: {
      title: 'Surgery',
      bullets: [
        'Recovery ring gives the lift-date a sense of momentum instead of dread.',
        'Hardware list surfaces MRI compatibility per implant — most useful line for an ER imaging tech.',
        'BLT surfaced honestly as an estimate requiring surgeon clearance.',
      ],
    },
    mpa: {
      title: 'Medical POA',
      bullets: [
        'Inactive state reads as good news (green "Rick holds decisions") rather than a warning.',
        'Activation path is transparent: requires a signed capacity determination.',
        'Upload CTA is foregrounded only when activation would actually be needed.',
      ],
    },
    ER: {
      title: 'ER handoff',
      bullets: [
        'Review-first flow: user sees what will be included before generating.',
        'PDF stays clinical, dense, single-page — warmth belongs in the app, precision in the handoff.',
        'Insurance excluded by default (privacy concern if the PDF is lost).',
      ],
    },
    people: {
      title: 'People',
      bullets: ['Care team + contacts module (not in this iteration).'],
    },
    records: {
      title: 'Records',
      bullets: ['Full records module (not in this iteration) — allergies/surgery/MPA are linked from here.'],
    },
  };
  const n = notes[route] || notes.today;
  return (
    <div className="side-panel">
      <div className="stack-16">
        <div className="stack-4">
          <div className="t-label">Design notes — {n.title}</div>
          <div className="t-h2">Why it looks this way</div>
        </div>
        <ul className="design-notes">
          {n.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
        <div className="hr"/>
        <div className="stack-8">
          <div className="t-label">Inspiration</div>
          <div className="t-body-sm muted-2">
            Warmth + identity (CareMate) · Timeline + pill-supply (LikarBox) · Calm surfaces + mood check-ins (Wellness/Aging-Care).
          </div>
        </div>
        <div className="hr"/>
        <div className="stack-8">
          <div className="t-label">Try it</div>
          <div className="t-body-sm muted-2">
            Use the bottom tab bar to switch between Today, Rick, People, and Records. Tap the red ER button any time. Switch stakeholders (bottom-center pill). Open Tweaks (toolbar) to flip MPA, BLT, connectivity, and accent.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tweaks panel ─────────────────────────────────────────────
function TweakPanel({ tweaks, onChange, onClose }) {
  return (
    <div className="tweak-panel card">
      <div className="row-flex-between" style={{ padding: '12px 14px', borderBottom: '1px solid var(--hairline)' }}>
        <div className="t-h3">Tweaks</div>
        <button className="btn ghost sm" onClick={onClose}><IconX className="icon-sm"/></button>
      </div>
      <div className="stack-16" style={{ padding: 14 }}>
        <TweakRow label="MPA status">
          <Seg options={[
            { id: 'inactive', label: 'Inactive' },
            { id: 'active', label: 'Active' },
            { id: 'expired', label: 'Expired' },
          ]} value={tweaks.mpaStatus} onChange={v => onChange({ mpaStatus: v })}/>
        </TweakRow>
        <TweakRow label="BLT precautions">
          <Seg options={[
            { id: true, label: 'Active' },
            { id: false, label: 'Lifted' },
          ]} value={tweaks.bltActive} onChange={v => onChange({ bltActive: v })}/>
        </TweakRow>
        <TweakRow label="Connectivity">
          <Seg options={[
            { id: true, label: 'Online' },
            { id: false, label: 'Offline' },
          ]} value={tweaks.online} onChange={v => onChange({ online: v })}/>
        </TweakRow>
        <TweakRow label="Accent color">
          <div className="row-flex" style={{ gap: 6 }}>
            {Object.keys(ACCENT_MAP).map(k => (
              <button key={k} onClick={() => onChange({ accent: k })} title={k}
                      style={{
                        width: 28, height: 28, borderRadius: 999, cursor: 'pointer',
                        background: ACCENT_MAP[k].accent,
                        border: tweaks.accent === k ? '2px solid var(--ink)' : '2px solid transparent',
                        padding: 0,
                      }}/>
            ))}
          </div>
        </TweakRow>
      </div>
    </div>
  );
}

function TweakRow({ label, children }) {
  return (
    <div className="stack-6">
      <div className="t-label">{label}</div>
      {children}
    </div>
  );
}

function Seg({ options, value, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', background: 'var(--surface-3)', padding: 2,
      borderRadius: 999, border: '1px solid var(--border)',
    }}>
      {options.map(o => (
        <button key={String(o.id)} onClick={() => onChange(o.id)}
                style={{
                  padding: '6px 12px', borderRadius: 999, border: 0,
                  background: o.id === value ? 'var(--surface)' : 'transparent',
                  boxShadow: o.id === value ? 'var(--shadow-1)' : 'none',
                  color: o.id === value ? 'var(--ink)' : 'var(--ink-3)',
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { App });

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
