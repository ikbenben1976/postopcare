// components.jsx — v2 design system primitives (warm caregiver)
// Composes with styles.css tokens — pastel category tints, big type, soft surfaces.

const { useState } = React;

// ── Utility ──────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[+m - 1]} ${+d || ''}, ${y}`.replace(' ,', ',');
}

// ── Severity / MRI chip mappers ──────────────────────────────
function severityChip(severity) {
  const map = {
    life_threatening: { label: 'Life-threatening', tone: 'critical' },
    moderate: { label: 'Moderate', tone: 'warning' },
    mild: { label: 'Mild', tone: 'neutral' },
  };
  const c = map[severity] || map.mild;
  return <span className={`chip ${c.tone}`}>{c.label}</span>;
}
function mriChip(mri) {
  const map = {
    'mri_safe': { label: 'MRI safe', tone: 'ok' },
    'conditional_1.5T_3T': { label: 'MRI cond. 1.5T/3T', tone: 'info' },
    'conditional_1.5T': { label: 'MRI cond. 1.5T only', tone: 'warning' },
    'mri_unsafe': { label: 'MRI unsafe', tone: 'critical' },
    'unknown': { label: 'MRI unknown', tone: 'neutral' },
  };
  const c = map[mri] || map.unknown;
  return <span className={`chip ${c.tone}`}>{c.label}</span>;
}

// ── Recovery Ring (progress around avatar) ───────────────────
function RecoveryRing({ size = 96, stroke = 5, progress = 0.4, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * progress;
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--hairline)" strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--accent)" strokeWidth={stroke} fill="none"
                strokeLinecap="round" strokeDasharray={`${dash} ${c - dash}`}/>
      </svg>
      <div className="ring-inner">{children}</div>
    </div>
  );
}

// ── Hero identity card (used on both Today + Profile) ────────
function HeroCard({ compact, onOpenProfile }) {
  const weeks = 5; const total = 12;
  const progress = weeks / total;
  return (
    <div style={{
      background: 'linear-gradient(180deg, oklch(0.965 0.035 195), oklch(0.985 0.012 195 / 0.6))',
      borderRadius: 'var(--r-xl)',
      padding: compact ? 16 : 20,
      border: '1px solid var(--cat-vitals-edge)',
      display: 'flex', gap: 16, alignItems: 'center',
    }}>
      <RecoveryRing size={compact ? 72 : 88} stroke={5} progress={progress}>
        <div style={{
          width: compact ? 58 : 72, height: compact ? 58 : 72, borderRadius: 999,
          background: 'linear-gradient(135deg, oklch(0.78 0.08 50), oklch(0.66 0.1 30))',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: compact ? 20 : 26,
        }}>RW</div>
      </RecoveryRing>
      <div className="stack-4" style={{ flex: 1, minWidth: 0 }}>
        <div className="t-label" style={{ color: 'var(--accent-ink)' }}>Week {weeks} of {total} · BLT</div>
        <div className={compact ? 't-h1' : 't-display'} style={{ fontSize: compact ? 22 : 28 }}>Rick Whitman</div>
        <div className="t-body-sm muted-2">
          Recovering from spine surgery · 77 y.o.
        </div>
        {onOpenProfile && (
          <button className="btn ghost sm" onClick={onOpenProfile}
                  style={{ alignSelf: 'flex-start', padding: '4px 10px', marginTop: 4,
                           background: 'oklch(1 0 0 / 0.6)' }}>
            View full profile <IconChevronRight className="icon-sm"/>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Timeline for Today screen ────────────────────────────────
function TimelineItem({ time, state = 'pending', icon, title, subtitle, tone, actions, isNow }) {
  const toneBg = {
    meds: 'var(--cat-meds-bg)', vitals: 'var(--cat-vitals-bg)',
    surgery: 'var(--cat-surgery-bg)', recovery: 'var(--cat-recovery-bg)',
    people: 'var(--cat-people-bg)', default: 'var(--surface)',
  }[tone || 'default'];
  const toneEdge = {
    meds: 'var(--cat-meds-edge)', vitals: 'var(--cat-vitals-edge)',
    surgery: 'var(--cat-surgery-edge)', recovery: 'var(--cat-recovery-edge)',
    people: 'var(--cat-people-edge)', default: 'var(--hairline)',
  }[tone || 'default'];

  return (
    <div className="timeline-item">
      {isNow ? (
        <div className="timeline-now">
          <div style={{ width: 8, height: 8, borderRadius: 999, background: 'white' }}/>
        </div>
      ) : (
        <div className={`timeline-dot ${state}`}>
          {state === 'ok' && <IconCheck className="icon-sm" style={{ color: 'white', width: 10, height: 10 }}/>}
        </div>
      )}
      <div style={{
        background: toneBg, border: `1px solid ${toneEdge}`,
        borderRadius: 'var(--r-md)', padding: 12,
        opacity: state === 'ok' ? 0.75 : 1,
      }}>
        <div className="row-flex-between" style={{ gap: 8 }}>
          <div className="row-flex" style={{ gap: 10, minWidth: 0 }}>
            {icon && <span style={{ color: 'var(--ink-2)' }}>{icon}</span>}
            <div className="stack-2" style={{ minWidth: 0 }}>
              <div className="t-body" style={{ fontWeight: 600, textDecoration: state === 'ok' ? 'line-through' : 'none' }}>{title}</div>
              {subtitle && <div className="t-meta">{subtitle}</div>}
            </div>
          </div>
          <div className="t-meta mono" style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{time}</div>
        </div>
        {actions && <div className="row-flex" style={{ gap: 6, marginTop: 10 }}>{actions}</div>}
      </div>
    </div>
  );
}

// ── Pill visualization (from LikarBox) ───────────────────────
function PillGlyph({ color = 'var(--accent)', tone = 'capsule', size = 28 }) {
  if (tone === 'tablet') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
        <circle cx="16" cy="16" r="12" fill={color} opacity="0.25"/>
        <circle cx="16" cy="16" r="10" fill={color}/>
        <line x1="6" y1="16" x2="26" y2="16" stroke="white" strokeWidth="1.5" opacity="0.7"/>
      </svg>
    );
  }
  // capsule
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
      <defs>
        <clipPath id="cap">
          <rect x="4" y="10" width="24" height="12" rx="6"/>
        </clipPath>
      </defs>
      <rect x="4" y="10" width="12" height="12" fill={color} clipPath="url(#cap)"/>
      <rect x="16" y="10" width="12" height="12" fill="white" clipPath="url(#cap)"/>
      <rect x="4" y="10" width="24" height="12" rx="6" fill="none" stroke={color} strokeWidth="1.5"/>
    </svg>
  );
}

// ── Med card (with supply bar) ───────────────────────────────
function MedCard({ med, daysLeft = 12, supplyWarn, onTake, state = 'pending' }) {
  const colorByClass = {
    anticoagulant: 'oklch(0.58 0.18 25)',    // red — highest risk
    antibiotic:    'oklch(0.55 0.12 245)',   // blue
    opioid:        'oklch(0.60 0.14 295)',   // purple
    analgesic:     'oklch(0.62 0.10 155)',   // green
    'ace-inhibitor': 'oklch(0.65 0.10 75)',  // sand
    laxative:      'oklch(0.68 0.08 50)',    // peach
  };
  const color = colorByClass[med.class] || 'var(--ink-3)';
  const supplyTone = daysLeft <= 5 ? 'critical' : daysLeft <= 10 ? 'warning' : 'ok';

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="row-flex" style={{ gap: 12 }}>
        <PillGlyph color={color} tone={med.class === 'analgesic' || med.class === 'ace-inhibitor' ? 'tablet' : 'capsule'} size={30}/>
        <div className="stack-2" style={{ flex: 1, minWidth: 0 }}>
          <div className="t-body" style={{ fontWeight: 600 }}>{med.name} <span className="muted-2" style={{ fontWeight: 400 }}>· {med.dose}</span></div>
          <div className="t-meta">{med.freq} · last {med.lastTaken.replace('Today, ', '')}</div>
        </div>
        {state === 'taken' ? (
          <span className="chip ok"><IconCheck className="icon-sm"/>Taken</span>
        ) : state === 'due' ? (
          <span className="chip warning">Due now</span>
        ) : null}
      </div>
      <div style={{
        marginTop: 10, height: 4, borderRadius: 999, background: 'var(--hairline)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, width: `${Math.min(100, (daysLeft / 30) * 100)}%`,
          background: supplyTone === 'critical' ? 'var(--critical)' : supplyTone === 'warning' ? 'var(--warning)' : 'var(--ok)',
          borderRadius: 999,
        }}/>
      </div>
      <div className="row-flex-between" style={{ marginTop: 6 }}>
        <span className="t-meta">{daysLeft} days supply</span>
        {med.class === 'anticoagulant' && <span className="chip critical" style={{ fontSize: 10.5 }}>High-risk</span>}
      </div>
    </div>
  );
}

// ── Vitals tile with sparkline ───────────────────────────────
function VitalsTile({ label, value, unit, trend = [], tone = 'neutral', foot }) {
  const n = trend.length;
  const min = Math.min(...trend), max = Math.max(...trend);
  const range = Math.max(1, max - min);
  const points = trend.map((v, i) => {
    const x = (i / (n - 1)) * 100;
    const y = 28 - ((v - min) / range) * 22 - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const stroke = tone === 'warning' ? 'var(--warning)' : tone === 'critical' ? 'var(--critical)' : tone === 'ok' ? 'var(--ok)' : 'var(--accent)';

  return (
    <div className="cat-surface cat-vitals" style={{ padding: 14 }}>
      <div className="t-label" style={{ color: 'var(--cat-vitals-ink)' }}>{label}</div>
      <div className="row-flex" style={{ gap: 4, alignItems: 'baseline', marginTop: 4 }}>
        <span className="t-h1" style={{ fontSize: 22 }}>{value}</span>
        {unit && <span className="t-body-sm muted-2">{unit}</span>}
      </div>
      {n > 1 && (
        <svg className="sparkline" viewBox="0 0 100 28" preserveAspectRatio="none" style={{ marginTop: 4 }}>
          <polyline fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    points={points} vectorEffect="non-scaling-stroke"/>
        </svg>
      )}
      {foot && <div className="t-meta" style={{ marginTop: 2 }}>{foot}</div>}
    </div>
  );
}

// ── Allergy row (warmer) ─────────────────────────────────────
function AllergyRow({ allergy, onOpen }) {
  const life = allergy.severity === 'life_threatening';
  return (
    <button onClick={() => onOpen?.(allergy)} className="cat-surface cat-allergy"
      style={{
        textAlign: 'left', border: 0, cursor: 'pointer',
        display: 'flex', gap: 12, alignItems: 'center',
        background: life ? 'var(--critical-wash)' : 'var(--cat-allergy-bg)',
        borderLeft: life ? '4px solid var(--critical)' : '4px solid transparent',
        width: '100%', borderRadius: 14,
      }}>
      <div style={{
        width: 36, height: 36, borderRadius: 999,
        background: life ? 'var(--critical)' : 'var(--cat-allergy-edge)',
        color: life ? 'white' : 'var(--cat-allergy-ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IconAlertTriangle className="icon"/>
      </div>
      <div className="stack-2" style={{ flex: 1, minWidth: 0 }}>
        <div className="t-body" style={{ fontWeight: 600 }}>{allergy.allergen}</div>
        <div className="t-meta">{allergy.reaction}</div>
      </div>
      {severityChip(allergy.severity)}
    </button>
  );
}

// ── Category card (used as nav tile on profile) ──────────────
function CategoryCard({ tone, icon, label, primary, secondary, badge, onClick, chips }) {
  return (
    <button onClick={onClick} className={`cat-surface cat-${tone}`}
      style={{
        textAlign: 'left', border: '1px solid var(--hairline)', cursor: 'pointer',
        padding: 16, borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 10,
        fontFamily: 'inherit', width: '100%',
      }}>
      <div className="row-flex-between">
        <div className="row-flex" style={{ gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'oklch(1 0 0 / 0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: `var(--cat-${tone}-ink)`,
          }}>{React.cloneElement(icon, { className: 'icon' })}</div>
          <span className="t-label" style={{ color: `var(--cat-${tone}-ink)` }}>{label}</span>
        </div>
        {badge && <span className="chip" style={{
          background: 'oklch(1 0 0 / 0.7)', color: `var(--cat-${tone}-ink)`,
          borderColor: `var(--cat-${tone}-edge)`,
        }}>{badge}</span>}
      </div>
      <div className="t-h2" style={{ color: 'var(--ink)' }}>{primary}</div>
      {secondary && <div className="t-body-sm muted-2">{secondary}</div>}
      {chips && <div className="row-flex" style={{ gap: 6, flexWrap: 'wrap' }}>{chips}</div>}
    </button>
  );
}

// ── MPA status card ──────────────────────────────────────────
function MPAStatusCard({ status, holder }) {
  const map = {
    inactive: { tone: 'ok',       title: 'Decisions: Rick', sub: 'Rick holds full decision authority. MPA is on file but not active.' },
    active:   { tone: 'warning',  title: 'Decisions: Margaret', sub: 'MPA is active. Clinician documented incapacity.' },
    expired:  { tone: 'critical', title: 'MPA expired', sub: 'Holder has no current authority. Please renew on file.' },
  }[status] || { tone: 'ok', title: '—', sub: '' };

  return (
    <div className={`cat-surface cat-mpa`} style={{ padding: 18 }}>
      <div className="row-flex" style={{ gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'oklch(1 0 0 / 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--cat-mpa-ink)',
        }}>
          <IconShieldCheck className="icon-lg"/>
        </div>
        <div className="stack-2" style={{ flex: 1 }}>
          <div className="t-label" style={{ color: 'var(--cat-mpa-ink)' }}>Medical Power of Attorney</div>
          <div className="t-h2">{map.title}</div>
        </div>
        <span className={`chip ${map.tone}`} style={{ textTransform: 'capitalize' }}>{status}</span>
      </div>
      <div className="t-body-sm muted-2" style={{ marginTop: 10 }}>{map.sub}</div>
      {holder && (
        <div style={{
          marginTop: 12, padding: 10, borderRadius: 12,
          background: 'oklch(1 0 0 / 0.6)', border: '1px solid var(--cat-mpa-edge)',
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 999,
            background: 'linear-gradient(135deg, oklch(0.75 0.08 295), oklch(0.65 0.1 320))',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: 13,
          }}>MW</div>
          <div className="stack-2" style={{ flex: 1 }}>
            <div className="t-body-sm" style={{ fontWeight: 600 }}>{holder.holderName}</div>
            <div className="t-meta">{holder.holderRelationship} · {holder.holderPhone}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Hardware item row ────────────────────────────────────────
function HardwareItem({ item }) {
  return (
    <div className="row-flex" style={{ gap: 12, padding: '12px 2px', borderBottom: '1px solid var(--hairline)' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: 'var(--cat-surgery-bg)', border: '1px solid var(--cat-surgery-edge)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--cat-surgery-ink)',
      }}>
        <IconBone className="icon"/>
      </div>
      <div className="stack-2" style={{ flex: 1, minWidth: 0 }}>
        <div className="t-body" style={{ fontWeight: 600 }}>
          {item.type}{item.count > 1 ? ` ×${item.count}` : ''}
        </div>
        <div className="t-meta">
          {item.material} · {item.manufacturer}{item.model ? ` · ${item.model}` : ''}
          {item.levels ? ` · ${item.levels.join('–')}` : ''}
          {item.year ? ` · ${item.year}` : ''}
        </div>
      </div>
      {mriChip(item.mri)}
    </div>
  );
}

// ── Per-role tab configurations ──────────────────────────────
const NAV_CONFIGS = {
  linda: [
    { id: 'today',   label: 'Today',   icon: <IconCalendar/> },
    { id: 'meds',    label: 'Meds',    icon: <IconPill/> },
    { id: 'vitals',  label: 'Vitals',  icon: <IconActivity/> },
    { id: 'profile', label: 'Rick',    icon: <IconUser/> },
    { id: 'records', label: 'Records', icon: <IconFileText/> },
  ],
  rick: [
    { id: 'today',   label: 'Today',   icon: <IconCalendar/> },
    { id: 'meds',    label: 'Meds',    icon: <IconPill/> },
    { id: 'ER',      label: 'ER',      icon: <IconAlertTriangle/>, center: true },
    { id: 'vitals',  label: 'Vitals',  icon: <IconActivity/> },
    { id: 'people',  label: 'People',  icon: <IconUsers/> },
  ],
  amy: [
    { id: 'today',   label: 'Today',   icon: <IconCalendar/> },
    { id: 'records', label: 'Records', icon: <IconFileText/> },
    { id: 'people',  label: 'People',  icon: <IconUsers/> },
    { id: 'mpa',     label: 'MPA',     icon: <IconShieldCheck/> },
    { id: 'profile', label: 'Rick',    icon: <IconUser/> },
  ],
  ben: [
    { id: 'today',   label: 'Today',   icon: <IconCalendar/> },
    { id: 'records', label: 'Records', icon: <IconFileText/> },
    { id: 'people',  label: 'People',  icon: <IconUsers/> },
    { id: 'profile', label: 'Rick',    icon: <IconUser/> },
    { id: 'settings',label: 'Settings',icon: <IconSettings/> },
  ],
  aide: [
    { id: 'today',   label: 'Today',   icon: <IconCalendar/> },
    { id: 'meds',    label: 'Meds',    icon: <IconPill/> },
    { id: 'vitals',  label: 'Vitals',  icon: <IconActivity/> },
    { id: 'people',  label: 'Contacts',icon: <IconUsers/> },
    { id: 'profile', label: 'Rick',    icon: <IconUser/> },
  ],
};

// ── Bottom tab bar with raised center CTA (Rick only) ────────
function BottomNav({ current, onNav, stakeholder = 'linda' }) {
  const tabs = NAV_CONFIGS[stakeholder] || NAV_CONFIGS.linda;
  const cols = tabs.length;
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
      padding: '8px 10px 18px', background: 'oklch(1 0 0 / 0.92)',
      backdropFilter: 'blur(12px)', borderTop: '1px solid var(--hairline)',
      display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, alignItems: 'end',
    }}>
      {tabs.map(t => {
        if (t.center) {
          return (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => onNav(t.id)} style={{
                width: 58, height: 58, borderRadius: 999,
                background: 'linear-gradient(180deg, var(--critical), oklch(0.52 0.18 25))',
                color: 'white', border: '4px solid var(--surface)',
                boxShadow: 'var(--shadow-raised)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transform: 'translateY(-16px)',
                gap: 0,
              }}>
                <IconAlertTriangle className="icon"/>
                <span style={{ fontSize: 9.5, fontWeight: 700, marginTop: 1 }}>ER</span>
              </button>
            </div>
          );
        }
        const active = current === t.id;
        return (
          <button key={t.id} onClick={() => onNav(t.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            background: 'transparent', border: 0, cursor: 'pointer',
            color: active ? 'var(--accent-ink)' : 'var(--ink-4)',
            padding: '4px 0',
          }}>
            {React.cloneElement(t.icon, { className: 'icon' })}
            <span style={{ fontSize: 10.5, fontWeight: 600 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Stakeholder switcher ─────────────────────────────────────
function StakeholderSwitcher({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const c = STAKEHOLDERS.find(s => s.id === current) || STAKEHOLDERS[0];
  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 1000,
    }}>
      <button onClick={() => setOpen(v => !v)} className="card"
        style={{
          padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10,
          cursor: 'pointer', border: 0, fontFamily: 'inherit',
          boxShadow: 'var(--shadow-2)',
        }}>
        <span className="t-label">Viewing as</span>
        <span className="t-body-sm" style={{ fontWeight: 600 }}>{c.name}</span>
        <span className="chip neutral" style={{ fontSize: 10.5 }}>{c.role}</span>
        <IconChevronDown className="icon-sm" style={{ transform: open ? 'rotate(180deg)' : '' }}/>
      </button>
      {open && (
        <div className="card" style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0,
          padding: 6, minWidth: 320,
        }}>
          {STAKEHOLDERS.map(s => (
            <button key={s.id} onClick={() => { onChange(s.id); setOpen(false); }}
              style={{
                display: 'flex', gap: 10, width: '100%', padding: '8px 10px',
                background: s.id === current ? 'var(--accent-wash)' : 'transparent',
                border: 0, borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                fontFamily: 'inherit',
              }}>
              <div className="stack-2" style={{ flex: 1 }}>
                <div className="t-body-sm" style={{ fontWeight: 600 }}>{s.name}</div>
                <div className="t-meta">{s.role}</div>
              </div>
              {s.scope === 'scoped' && <span className="chip warning" style={{ fontSize: 10 }}>Scoped</span>}
              {s.id === current && <IconCheck className="icon-sm" style={{ color: 'var(--accent-ink)', alignSelf: 'center' }}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Offline badge ────────────────────────────────────────────
function OfflineBadge() {
  return (
    <div style={{
      padding: '6px 12px', borderRadius: 999,
      background: 'var(--warning-wash)', border: '1px solid var(--warning-edge)',
      color: 'var(--warning-ink)', fontSize: 12, fontWeight: 600,
      display: 'inline-flex', gap: 6, alignItems: 'center',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--warning)' }}/>
      Offline — cached data
    </div>
  );
}

// ── Section label ────────────────────────────────────────────
function SectionLabel({ children, action }) {
  return (
    <div className="row-flex-between" style={{ padding: '0 4px', marginBottom: 8 }}>
      <span className="t-label">{children}</span>
      {action}
    </div>
  );
}

// ── Screen header ────────────────────────────────────────────
function ScreenHeader({ title, kicker, onBack, trailing }) {
  return (
    <div style={{
      padding: '14px 16px 12px', background: 'var(--canvas)',
      position: 'sticky', top: 28, zIndex: 5,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {onBack && (
        <button className="btn ghost" onClick={onBack} style={{ padding: 8, minHeight: 36 }}>
          <IconChevronLeft className="icon"/>
        </button>
      )}
      <div className="stack-2" style={{ flex: 1 }}>
        {kicker && <div className="t-label">{kicker}</div>}
        <div className="t-h1">{title}</div>
      </div>
      {trailing}
    </div>
  );
}

Object.assign(window, {
  formatDate, severityChip, mriChip,
  RecoveryRing, HeroCard,
  TimelineItem, PillGlyph, MedCard, VitalsTile,
  AllergyRow, CategoryCard, MPAStatusCard, HardwareItem,
  BottomNav, StakeholderSwitcher, OfflineBadge, SectionLabel, ScreenHeader,
});
