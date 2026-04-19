// screens.jsx — v4: wired care-log — mark-taken, vitals, check-in, falls

const { useState: useState2 } = React;

// ═══ TODAY ═══════════════════════════════════════════════════
function TodayScreen({ onNav, stakeholder, online }) {
  const scoped = stakeholder === 'aide';
  const isRick = stakeholder === 'rick';
  const greeting = { linda: 'Good afternoon, Linda', rick: 'Good afternoon, Rick', amy: 'Hi Amy', ben: 'Hi Ben', aide: 'Good afternoon' }[stakeholder] || 'Welcome';

  const { log, lastOf } = useCareLog();
  const [openModal, setOpenModal] = useState2(null); // 'checkin' | 'vitals' | 'fall' | {kind:'med', med}

  // Which meds have been taken today?
  const takenToday = new Set(
    log.filter(e => e.kind === 'med' && e.detail?.action === 'taken' && (e.ts || '').startsWith('2026-04-19'))
       .map(e => e.detail.name)
  );

  const nextMed = MOCK_MEDICATIONS.find(m => !takenToday.has(m.name) && m.freq !== 'Q4H PRN');
  const lastVitals = lastOf('vitals');
  const lastCheckin = lastOf('checkin');

  const items = [
    { time: '7:00', state: 'ok', icon: <IconPill className="icon"/>, title: 'Apixaban 5 mg',
      subtitle: takenToday.has('Apixaban') ? 'Taken ' + relTime((lastOf('med', { name: 'Apixaban', action: 'taken' }) || {}).ts) : 'Scheduled', tone: 'meds' },
    { time: '8:00', state: lastVitals ? 'ok' : 'pending', icon: <IconActivity className="icon"/>,
      title: 'Morning vitals',
      subtitle: lastVitals ? `BP ${lastVitals.detail.bp || '—'} · SpO₂ ${lastVitals.detail.spo2 || '—'}%` : 'Log now',
      tone: 'vitals',
      actions: !lastVitals && !scoped ? [<button key="a" className="btn secondary sm" onClick={() => setOpenModal('vitals')}><IconPlus className="icon-sm"/>Log</button>] : null,
    },
    { time: 'Now',  state: lastCheckin ? 'ok' : 'pending', isNow: true, icon: <IconHeart className="icon"/>,
      title: lastCheckin ? 'Last check-in' : 'How is Rick feeling?',
      subtitle: lastCheckin ? `${relTime(lastCheckin.ts)} · ${lastCheckin.detail.feeling}` : '30-sec check-in',
      tone: 'recovery',
      actions: [<button key="a" className="btn primary sm" onClick={() => setOpenModal('checkin')}>Start</button>,
                <button key="b" className="btn ghost sm">Later</button>] },
    nextMed && { time: '1:00', state: 'pending', icon: <IconPill className="icon"/>,
      title: `${nextMed.name} ${nextMed.dose}`, subtitle: `Scheduled ${nextMed.freq}`, tone: 'meds',
      actions: [<button key="a" className="btn secondary sm" onClick={() => setOpenModal({ kind: 'med', med: nextMed })}><IconCheck className="icon-sm"/>Mark taken</button>,
                <button key="b" className="btn ghost sm" onClick={() => setOpenModal({ kind: 'med', med: nextMed })}>Skip…</button>] },
    { time: '2:00', state: 'pending', icon: <IconUser className="icon"/>, title: 'PT session at home', subtitle: 'Marcus · 45 min', tone: 'people' },
    { time: '5:00', state: 'pending', icon: <IconActivity className="icon"/>, title: 'Evening vitals', subtitle: 'Reminder', tone: 'vitals' },
    { time: '8:00', state: 'pending', icon: <IconPill className="icon"/>, title: 'Apixaban 5 mg', subtitle: 'Scheduled', tone: 'meds' },
  ].filter(Boolean);

  return (
    <>
    <div className="stack-16" style={{ padding: '0 14px 140px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 2px' }}>
        <div className="stack-2">
          <div className="t-label">Sunday, Apr 19</div>
          <div className="t-h1">{greeting}</div>
        </div>
        {!online && <OfflineBadge/>}
      </div>

      <HeroCard onOpenProfile={() => onNav('profile')}/>

      {!scoped && (
        <QuickActionsRow
          onCheckin={() => setOpenModal('checkin')}
          onVitals={() => setOpenModal('vitals')}
          onSymptom={() => setOpenModal('symptom')}
          onFall={() => setOpenModal('fall')}
        />
      )}

      {!scoped && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <VitalsTile label="Blood pressure" value="128/78" unit="mmHg" trend={[124,130,128,132,129,131,128]} tone="warning" foot="Stable this week"/>
          <VitalsTile label="SpO₂" value="93" unit="%" trend={[96,95,94,94,93,93,93]} tone="warning" foot="Trending down"/>
        </div>
      )}

      <div>
        <SectionLabel action={<button className="btn ghost sm">Full schedule <IconChevronRight className="icon-sm"/></button>}>Today's plan</SectionLabel>
        <div className="timeline">
          {items.filter(it => !scoped || it.tone !== 'meds').map((it, i) => <TimelineItem key={i} {...it}/>)}
        </div>
      </div>

      {!scoped && (
        <div>
          <SectionLabel action={<button className="btn ghost sm" onClick={() => onNav('allergies')}>See all <IconChevronRight className="icon-sm"/></button>}>Life-threatening allergies</SectionLabel>
          <AllergyRow allergy={MOCK_ALLERGIES[0]} onOpen={() => onNav('allergies')}/>
        </div>
      )}

      {/* Recent activity feed */}
      <ActivityFeed log={log.slice(0, 5)}/>

      {/* ER banner only surfaces if viewer ISN'T Rick — he has the center tab */}
      {!isRick && !scoped && (
        <button className="card" onClick={() => onNav('ER')} style={{
          padding: 14, cursor: 'pointer', border: '1px solid var(--critical-edge)',
          background: 'linear-gradient(180deg, var(--critical-wash), var(--surface))',
          display: 'flex', gap: 12, alignItems: 'center', width: '100%', fontFamily: 'inherit', textAlign: 'left',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: 'var(--critical)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><IconFileText className="icon"/></div>
          <div className="stack-2" style={{ flex: 1 }}>
            <div className="t-body" style={{ fontWeight: 600 }}>Generate ER handoff PDF</div>
            <div className="t-meta">One-page summary for emergency staff</div>
          </div>
          <IconChevronRight className="icon" style={{ color: 'var(--critical-ink)' }}/>
        </button>
      )}
    </div>
    {openModal === 'checkin' && <CheckinForm by={stakeholder} onClose={() => setOpenModal(null)}/>}
    {openModal === 'vitals'  && <LogVitalsForm by={stakeholder} onClose={() => setOpenModal(null)}/>}
    {openModal === 'symptom' && <LogSymptomForm by={stakeholder} onClose={() => setOpenModal(null)}/>}
    {openModal === 'fall'    && <LogFallForm   by={stakeholder} onClose={() => setOpenModal(null)}/>}
    {openModal?.kind === 'med' && <MedActionSheet med={openModal.med} by={stakeholder} onClose={() => setOpenModal(null)}/>}
    </>
  );
}

// Quick action row on Today
function QuickActionsRow({ onCheckin, onVitals, onSymptom, onFall }) {
  const actions = [
    { id: 'checkin', label: 'Check-in',   icon: <IconHeart className="icon"/>,         tone: 'recovery', fn: onCheckin },
    { id: 'vitals',  label: 'Log vitals', icon: <IconActivity className="icon"/>,      tone: 'vitals',   fn: onVitals },
    { id: 'symptom', label: 'Symptom',    icon: <IconAlertCircle className="icon"/>,   tone: 'surgery',  fn: onSymptom },
    { id: 'fall',    label: 'Log fall',   icon: <IconFall className="icon"/>,          tone: 'allergy',  fn: onFall },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {actions.map(a => (
        <button key={a.id} onClick={a.fn}
          className={`cat-surface cat-${a.tone}`}
          style={{
            padding: '12px 8px', border: 0, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            borderRadius: 14,
          }}>
          <span style={{ color: `var(--cat-${a.tone}-ink)` }}>{a.icon}</span>
          <span className="t-body-sm" style={{ fontWeight: 600 }}>{a.label}</span>
        </button>
      ))}
    </div>
  );
}

// Activity feed row
function ActivityFeed({ log }) {
  if (!log.length) return null;
  const icon = {
    med: <IconPill className="icon-sm"/>, vitals: <IconActivity className="icon-sm"/>,
    checkin: <IconHeart className="icon-sm"/>, fall: <IconFall className="icon-sm"/>,
    symptom: <IconAlertCircle className="icon-sm"/>,
  };
  const tone = { med: 'meds', vitals: 'vitals', checkin: 'recovery', fall: 'allergy', symptom: 'surgery' };
  const summarize = (e) => {
    if (e.kind === 'med') {
      return e.detail.action === 'taken'
        ? `${e.detail.name} ${e.detail.dose} taken`
        : `${e.detail.name} skipped — ${e.detail.reason || 'no reason'}`;
    }
    if (e.kind === 'vitals') {
      const d = e.detail;
      return `Vitals: ${[d.bp && 'BP ' + d.bp, d.hr && 'HR ' + d.hr, d.spo2 && 'SpO₂ ' + d.spo2 + '%', d.temp && d.temp + '°F'].filter(Boolean).join(' · ')}`;
    }
    if (e.kind === 'checkin') {
      const f = e.detail.feeling;
      return `Check-in: feeling ${f}${e.detail.flags?.length ? ' · ' + e.detail.flags.join(', ') : ''}`;
    }
    if (e.kind === 'fall') {
      return `Fall logged — ${e.detail.location}${e.detail.injury ? ' (injury)' : ''}`;
    }
    if (e.kind === 'symptom') {
      const d = e.detail;
      return `Symptom: ${d.what}${d.location ? ' · ' + d.location : ''} · severity ${d.severity}/10`;
    }
    return e.kind;
  };
  return (
    <div>
      <SectionLabel>Recent activity</SectionLabel>
      <div className="card" style={{ padding: 4 }}>
        {log.map((e, i) => (
          <div key={e.id} className="row-flex" style={{
            gap: 10, padding: '10px 10px',
            borderBottom: i < log.length - 1 ? '1px solid var(--hairline)' : 'none',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `var(--cat-${tone[e.kind]}-bg)`, color: `var(--cat-${tone[e.kind]}-ink)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>{icon[e.kind]}</div>
            <div className="stack-2" style={{ flex: 1, minWidth: 0 }}>
              <div className="t-body-sm" style={{ fontWeight: 500 }}>{summarize(e)}</div>
              <div className="t-meta">{relTime(e.ts)} · {whoName(e.by)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ PROFILE ═════════════════════════════════════════════════
function ProfileScreen({ onNav, stakeholder, mpaStatus, bltActive }) {
  const scoped = stakeholder === 'aide';
  return (
    <div className="stack-16" style={{ padding: '0 14px 140px' }}>
      <HeroCard/>
      <div className="stack-10">
        <CategoryCard tone="allergy" icon={<IconAlertTriangle/>} label="Allergies"
          primary={`${MOCK_ALLERGIES.length} on file`} secondary="Penicillin → anaphylaxis"
          badge={`${MOCK_ALLERGIES.length}`} onClick={() => onNav('allergies')}
          chips={[<span key="1" className="chip critical" style={{ fontSize: 10.5 }}>1 life-threatening</span>]}/>
        <CategoryCard tone="surgery" icon={<IconBone/>} label="Surgery &amp; hardware"
          primary="L1–L5 fusion + sacral instrumentation" secondary="Mar 12, 2026 · Dr. Kim"
          onClick={() => onNav('surgery')}
          chips={[<span key="1" className="chip warning" style={{ fontSize: 10.5 }}>MRI cond. 1.5T only</span>,
                  bltActive && <span key="2" className="chip info" style={{ fontSize: 10.5 }}>BLT active</span>].filter(Boolean)}/>
        {!scoped && <CategoryCard tone="mpa" icon={<IconShieldCheck/>} label="Medical POA"
          primary={mpaStatus === 'inactive' ? 'Rick holds decisions' : 'Amy is deciding'}
          secondary={`Holder: ${MOCK_MPA.holderName}`} badge={mpaStatus} onClick={() => onNav('mpa')}/>}
        {!scoped && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <CategoryCard tone="meds" icon={<IconPill/>} label="Medications" primary={`${MOCK_MEDICATIONS.length} active`} secondary="1 high-risk" onClick={() => onNav('meds')}/>
            <CategoryCard tone="people" icon={<IconStethoscope/>} label="Care team" primary={`${MOCK_PROVIDERS.length} providers`} secondary="Spine, PCP, Pulm" onClick={() => onNav('people')}/>
          </div>
        )}
      </div>
    </div>
  );
}
// ═══ MEDS ═════════════════════════════════════════════════════
function MedsScreen({ onBack, canLog = true, stakeholder }) {
  const { log, lastOf } = useCareLog();
  const [openMed, setOpenMed] = useState2(null);

  const takenToday = new Set(
    log.filter(e => e.kind === 'med' && e.detail?.action === 'taken' && (e.ts || '').startsWith('2026-04-19'))
       .map(e => e.detail.name)
  );
  const due = MOCK_MEDICATIONS.filter(m => !takenToday.has(m.name) && m.freq !== 'Q4H PRN');
  const taken = MOCK_MEDICATIONS.filter(m => takenToday.has(m.name));

  const lastTakenStr = (name) => {
    const e = lastOf('med', { name, action: 'taken' });
    return e ? relTime(e.ts) : 'no record';
  };

  return (
    <>
      <ScreenHeader title="Medications" kicker="Today" onBack={onBack}/>
      <div className="stack-16" style={{ padding: '0 14px 140px' }}>
        <div className="cat-surface cat-meds" style={{ padding: 14 }}>
          <div className="row-flex" style={{ gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: 'oklch(1 0 0 / 0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cat-meds-ink)',
            }}><IconPill className="icon-lg"/></div>
            <div className="stack-2" style={{ flex: 1 }}>
              <div className="t-label" style={{ color: 'var(--cat-meds-ink)' }}>Today</div>
              <div className="t-h2">{taken.length} of {MOCK_MEDICATIONS.length} taken</div>
            </div>
          </div>
        </div>

        {due.length > 0 && (
          <div>
            <SectionLabel>Due now / pending</SectionLabel>
            <div className="stack-8">
              {due.map(m => (
                <div key={m.name} onClick={() => canLog && setOpenMed(m)} style={{ cursor: canLog ? 'pointer' : 'default' }}>
                  <MedCard med={{ ...m, lastTaken: lastTakenStr(m.name) }}
                    daysLeft={m.class === 'anticoagulant' ? 8 : 12} state="due"/>
                </div>
              ))}
            </div>
          </div>
        )}

        {taken.length > 0 && (
          <div>
            <SectionLabel>Taken today</SectionLabel>
            <div className="stack-8">
              {taken.map(m => (
                <MedCard key={m.name} med={{ ...m, lastTaken: lastTakenStr(m.name) }}
                  daysLeft={m.class === 'anticoagulant' ? 18 : 12} state="taken"/>
              ))}
            </div>
          </div>
        )}

        <div className="card-sunken" style={{ padding: 14 }}>
          <div className="t-label">Why one tint per med?</div>
          <div className="t-body-sm muted-2" style={{ marginTop: 4 }}>
            Red = anticoagulant (highest stakes). Apixaban misses can cause clotting events; we color-code and badge it so it's never confused with a routine pill.
          </div>
        </div>
      </div>
      {openMed && <MedActionSheet med={openMed} by={stakeholder} onClose={() => setOpenMed(null)}/>}
    </>
  );
}

// ═══ VITALS ═══════════════════════════════════════════════════
function VitalsScreen({ onBack, canLog = true, stakeholder }) {
  const { log } = useCareLog();
  const [openLog, setOpenLog] = useState2(false);

  // Latest from log, falling back to mock
  const latestLog = log.find(e => e.kind === 'vitals');
  const latest = latestLog ? { ...MOCK_VITALS_LAST, ...latestLog.detail, takenAt: relTime(latestLog.ts) + ' · ' + whoName(latestLog.by) } : MOCK_VITALS_LAST;
  const bpTrend = MOCK_VITALS_HISTORY.map(v => parseInt(v.bp.split('/')[0]));
  const hrTrend = MOCK_VITALS_HISTORY.map(v => v.hr);
  const spo2Trend = MOCK_VITALS_HISTORY.map(v => v.spo2);
  const tempTrend = MOCK_VITALS_HISTORY.map(v => Math.round(v.temp * 10) / 10);
  return (
    <>
      <ScreenHeader title="Vitals" kicker="Today" onBack={onBack}
        trailing={canLog && <button className="btn primary sm" onClick={() => setOpenLog(true)}><IconPlus className="icon-sm"/>Log</button>}/>
      <div className="stack-16" style={{ padding: '0 14px 140px' }}>
        <div className="cat-surface cat-vitals" style={{ padding: 14 }}>
          <div className="t-label" style={{ color: 'var(--cat-vitals-ink)' }}>Last taken</div>
          <div className="t-h2" style={{ marginTop: 4 }}>{latest.takenAt}</div>
          <div className="row-flex" style={{ gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            {latest.bp && <span className="chip neutral mono">BP {latest.bp}</span>}
            {latest.hr && <span className="chip neutral mono">HR {latest.hr}</span>}
            {latest.spo2 && <span className="chip neutral mono">SpO₂ {latest.spo2}%</span>}
            {latest.temp && <span className="chip neutral mono">{latest.temp}°F</span>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <VitalsTile label="Blood pressure" value="128/78" unit="mmHg" trend={bpTrend} tone="warning" foot="Systolic stable"/>
          <VitalsTile label="Heart rate" value="92" unit="bpm" trend={hrTrend} tone="neutral" foot="Slightly elevated"/>
          <VitalsTile label="SpO₂" value="93" unit="%" trend={spo2Trend} tone="warning" foot="↓ from 96% a week ago"/>
          <VitalsTile label="Temp" value="100.2" unit="°F" trend={tempTrend} tone="warning" foot="Low-grade fever"/>
          <VitalsTile label="Resp rate" value="20" unit="/min" trend={[18,19,19,20,20,20,20]} tone="neutral"/>
          <VitalsTile label="Pain" value="4" unit="/10" trend={[5,5,4,4,3,4,4]} tone="ok" foot="Improving"/>
        </div>

        <div>
          <SectionLabel>Orthostatic check — this morning</SectionLabel>
          <div className="card" style={{ padding: 14 }}>
            <div className="row-flex-between">
              <div className="stack-2"><div className="t-meta">Lying</div><div className="t-h3 mono">132/80</div></div>
              <IconArrowRight className="icon" style={{ color: 'var(--ink-4)' }}/>
              <div className="stack-2"><div className="t-meta">Sitting</div><div className="t-h3 mono">118/72</div></div>
              <IconArrowRight className="icon" style={{ color: 'var(--ink-4)' }}/>
              <div className="stack-2"><div className="t-meta">Standing</div><div className="t-h3 mono" style={{ color: 'var(--warning-ink)' }}>110/70</div></div>
            </div>
            <div className="t-body-sm" style={{ marginTop: 10, color: 'var(--warning-ink)' }}>
              −22 mmHg on standing — borderline orthostatic hypotension. Note fall risk.
            </div>
          </div>
        </div>

        <div>
          <SectionLabel>7-day history</SectionLabel>
          <div className="card" style={{ padding: '4px 14px' }}>
            {MOCK_VITALS_HISTORY.slice().reverse().map((v, i) => (
              <div key={i} className="row-flex-between" style={{ padding: '10px 2px', borderBottom: i < 6 ? '1px solid var(--hairline)' : 'none' }}>
                <div className="t-body-sm" style={{ fontWeight: 600 }}>{v.date}</div>
                <div className="row-flex" style={{ gap: 14 }}>
                  <span className="t-meta mono">{v.bp}</span>
                  <span className="t-meta mono">HR {v.hr}</span>
                  <span className="t-meta mono">SpO₂ {v.spo2}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {openLog && <LogVitalsForm by={stakeholder} onClose={() => setOpenLog(false)}/>}
    </>
  );
}

// ═══ PEOPLE ═══════════════════════════════════════════════════
function PeopleScreen({ onBack, stakeholder }) {
  const isAmy = stakeholder === 'amy';
  return (
    <>
      <ScreenHeader title="People" kicker="Care team &amp; contacts" onBack={onBack}
        trailing={isAmy && <button className="btn secondary sm"><IconPlus className="icon-sm"/>Add</button>}/>
      <div className="stack-16" style={{ padding: '0 14px 140px' }}>
        <div>
          <SectionLabel>Family &amp; emergency contacts</SectionLabel>
          <div className="stack-8">
            {MOCK_EMERGENCY_CONTACTS.map(c => (
              <ContactCard key={c.id} name={c.name} sub={c.relationship} phone={c.phone}
                last={c.lastContacted} tone="people" showEdit={isAmy}/>
            ))}
          </div>
        </div>
        <div>
          <SectionLabel>Providers</SectionLabel>
          <div className="stack-8">
            {MOCK_PROVIDERS.map(p => (
              <ContactCard key={p.id} name={p.name} sub={`${p.role} · ${p.org}`} phone={p.phone}
                tone="people" showEdit={isAmy}/>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function ContactCard({ name, sub, phone, last, tone = 'people', showEdit }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('');
  return (
    <div className={`cat-surface cat-${tone}`} style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 999,
        background: 'linear-gradient(135deg, oklch(0.75 0.08 50), oklch(0.65 0.09 30))',
        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, fontSize: 13,
      }}>{initials}</div>
      <div className="stack-2" style={{ flex: 1, minWidth: 0 }}>
        <div className="t-body" style={{ fontWeight: 600 }}>{name}</div>
        <div className="t-meta">{sub}</div>
        {last && <div className="t-meta" style={{ color: 'var(--cat-people-ink)' }}>Last contacted: {last}</div>}
      </div>
      <div className="row-flex" style={{ gap: 4 }}>
        <a className="btn secondary sm" href={`tel:${phone}`} style={{ padding: 8 }}><IconPhone className="icon-sm"/></a>
        {showEdit && <button className="btn ghost sm" style={{ padding: 8 }}><IconMoreH className="icon-sm"/></button>}
      </div>
    </div>
  );
}

// ═══ RECORDS ══════════════════════════════════════════════════
function RecordsScreen({ onNav, onBack, stakeholder }) {
  const isAmy = stakeholder === 'amy';
  return (
    <>
      <ScreenHeader title="Records" kicker="Diagnoses, history &amp; documents" onBack={onBack}
        trailing={isAmy && <button className="btn secondary sm"><IconPlus className="icon-sm"/>Add</button>}/>
      <div className="stack-12" style={{ padding: '0 14px 140px' }}>
        {isAmy && (
          <div className="cat-surface cat-mpa" style={{ padding: 14 }}>
            <div className="row-flex" style={{ gap: 10 }}>
              <IconShieldCheck className="icon" style={{ color: 'var(--cat-mpa-ink)' }}/>
              <div className="stack-2" style={{ flex: 1 }}>
                <div className="t-label" style={{ color: 'var(--cat-mpa-ink)' }}>Steward view</div>
                <div className="t-body-sm">You can add, edit, and verify entries in the record. Changes are attributed to you.</div>
              </div>
            </div>
          </div>
        )}

        <CategoryCard tone="allergy" icon={<IconAlertTriangle/>} label="Allergies"
          primary={`${MOCK_ALLERGIES.length} on file`} secondary={isAmy ? '2 unverified — needs clinician confirm' : 'Penicillin anaphylaxis'}
          badge={isAmy ? '2 unverified' : undefined}
          onClick={() => onNav('allergies')}/>

        <CategoryCard tone="surgery" icon={<IconBone/>} label="Surgery"
          primary="L1–L5 fusion + hardware" secondary="Mar 12, 2026"
          onClick={() => onNav('surgery')}/>

        <CategoryCard tone="recovery" icon={<IconActivity/>} label="Active diagnoses"
          primary={`${MOCK_ACTIVE_DIAGNOSES.length} conditions`} secondary="2 acute, 3 historical"/>

        <CategoryCard tone="people" icon={<IconFall/>} label="Fall history"
          primary={`${MOCK_FALL_HISTORY.length} incidents`} secondary="Most recent: Mar 19, 2026"/>

        {isAmy && (
          <CategoryCard tone="mpa" icon={<IconShieldCheck/>} label="Medical POA"
            primary="On file · inactive" secondary="Durable POA (2022) — view or upload capacity doc"
            onClick={() => onNav('mpa')}/>
        )}

        <div className="stack-8">
          <SectionLabel>Documents</SectionLabel>
          <div className="card" style={{ padding: 6 }}>
            {[
              { name: 'Operative report', date: '2026-03-12' },
              { name: 'Discharge summary', date: '2026-03-18' },
              { name: 'Pre-op MRI', date: '2026-03-10' },
              { name: 'Durable POA (2022)', date: '2022-04-08' },
            ].map((d, i) => (
              <div key={i} className="row-flex" style={{ gap: 12, padding: 10 }}>
                <div style={{
                  width: 36, height: 40, borderRadius: 6,
                  background: 'var(--cat-surgery-bg)', border: '1px solid var(--cat-surgery-edge)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cat-surgery-ink)',
                }}><IconFileText className="icon-sm"/></div>
                <div className="stack-2" style={{ flex: 1 }}>
                  <div className="t-body-sm" style={{ fontWeight: 600 }}>{d.name}</div>
                  <div className="t-meta">{formatDate(d.date)}</div>
                </div>
                {isAmy && <button className="btn ghost sm" style={{ padding: 6 }}><IconMoreH className="icon-sm"/></button>}
                <IconChevronRight className="icon-sm" style={{ color: 'var(--ink-4)' }}/>
              </div>
            ))}
          </div>
          {isAmy && (
            <button className="btn secondary" style={{ width: '100%' }}>
              <IconUpload className="icon-sm"/>Upload document
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ═══ ALLERGIES ════════════════════════════════════════════════
function AllergiesScreen({ onBack, stakeholder }) {
  const isAmy = stakeholder === 'amy';
  const groups = {
    life_threatening: MOCK_ALLERGIES.filter(a => a.severity === 'life_threatening'),
    moderate: MOCK_ALLERGIES.filter(a => a.severity === 'moderate'),
    mild: MOCK_ALLERGIES.filter(a => a.severity === 'mild'),
  };
  const [open, setOpen] = useState2(null);
  return (
    <>
      <ScreenHeader title="Allergies" kicker="Records" onBack={onBack}
        trailing={isAmy && <button className="btn secondary sm"><IconPlus className="icon-sm"/>Add</button>}/>
      <div className="stack-16" style={{ padding: '0 14px 140px' }}>
        {groups.life_threatening.length > 0 && (
          <div style={{
            background: 'linear-gradient(180deg, var(--critical-wash), oklch(0.98 0.015 25 / 0.6))',
            borderRadius: 'var(--r-lg)', padding: 16, border: '1px solid var(--critical-edge)',
          }}>
            <div className="row-flex" style={{ gap: 8, marginBottom: 10 }}>
              <IconAlertTriangle className="icon" style={{ color: 'var(--critical)' }}/>
              <span className="t-label" style={{ color: 'var(--critical-ink)' }}>Life-threatening</span>
            </div>
            <div className="stack-8">
              {groups.life_threatening.map(a => <AllergyRow key={a.id} allergy={a} onOpen={setOpen}/>)}
            </div>
          </div>
        )}
        {groups.moderate.length > 0 && (
          <div><SectionLabel>Moderate</SectionLabel>
            <div className="stack-8">{groups.moderate.map(a => <AllergyRow key={a.id} allergy={a} onOpen={setOpen}/>)}</div></div>
        )}
        {groups.mild.length > 0 && (
          <div><SectionLabel>Mild</SectionLabel>
            <div className="stack-8">{groups.mild.map(a => <AllergyRow key={a.id} allergy={a} onOpen={setOpen}/>)}</div></div>
        )}
      </div>
      {open && <AllergyDetailSheet allergy={open} onClose={() => setOpen(null)} canEdit={isAmy}/>}
    </>
  );
}
function AllergyDetailSheet({ allergy, onClose, canEdit }) {
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'oklch(0.2 0.02 260 / 0.4)',
      display: 'flex', alignItems: 'flex-end', zIndex: 30,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: 'var(--surface)', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 18, paddingBottom: 28,
      }}>
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 999, margin: '-4px auto 14px' }}/>
        <div className="row-flex-between">
          <div className="stack-2">
            <div className="t-h1">{allergy.allergen}</div>
            <div className="t-body-sm muted-2">{allergy.reaction}</div>
          </div>
          {severityChip(allergy.severity)}
        </div>
        <div className="card-sunken" style={{ marginTop: 14, padding: 12 }}>
          <div className="t-label">Verified by</div>
          <div className="t-body" style={{ marginTop: 4 }}>
            {allergy.verifiedBy || <span className="muted-2">Not yet verified by a clinician</span>}
          </div>
          {allergy.verifiedDate && <div className="t-meta" style={{ marginTop: 2 }}>{allergy.verifiedDate}</div>}
        </div>
        <div className="card-sunken" style={{ marginTop: 10, padding: 12 }}>
          <div className="t-label">Entered by</div>
          <div className="t-body" style={{ marginTop: 4 }}>{allergy.enteredBy}</div>
        </div>
        {canEdit && (
          <div className="row-flex" style={{ gap: 8, marginTop: 14 }}>
            {!allergy.verifiedBy && <button className="btn primary sm" style={{ flex: 1 }}><IconShieldCheck className="icon-sm"/>Mark verified</button>}
            <button className="btn secondary sm" style={{ flex: 1 }}>Edit</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ SURGERY ═════════════════════════════════════════════════
function SurgeryScreen({ onBack, bltActive }) {
  return (
    <>
      <ScreenHeader title="Surgery" kicker="Records" onBack={onBack}/>
      <div className="stack-16" style={{ padding: '0 14px 140px' }}>
        <div className="cat-surface cat-surgery" style={{ padding: 18 }}>
          <div className="row-flex" style={{ gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'oklch(1 0 0 / 0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cat-surgery-ink)' }}><IconBone className="icon-lg"/></div>
            <div className="stack-2" style={{ flex: 1 }}>
              <div className="t-label" style={{ color: 'var(--cat-surgery-ink)' }}>Most recent</div>
              <div className="t-h1" style={{ lineHeight: 1.2 }}>L1–L5 fusion + sacral instrumentation</div>
            </div>
          </div>
          <div className="t-body-sm muted-2" style={{ marginTop: 10 }}>{formatDate(MOCK_PATIENT.surgeryDate)} · Dr. Marcus Kim · Brigham Spine Center</div>
          <div className="row-flex" style={{ gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {mriChip('conditional_1.5T')}
            {bltActive && <span className="chip info">BLT · lifts ~{formatDate(MOCK_PATIENT.bltLiftDate)}</span>}
          </div>
        </div>
        {bltActive && (
          <div className="cat-surface cat-recovery" style={{ padding: 16 }}>
            <div className="row-flex" style={{ gap: 14 }}>
              <RecoveryRing size={66} stroke={5} progress={5/12}>
                <div className="stack-2" style={{ textAlign: 'center' }}>
                  <div className="t-label" style={{ fontSize: 9, color: 'var(--cat-recovery-ink)' }}>WEEK</div>
                  <div className="t-h2">5 / 12</div>
                </div>
              </RecoveryRing>
              <div className="stack-4" style={{ flex: 1 }}>
                <div className="t-label" style={{ color: 'var(--cat-recovery-ink)' }}>Recovery (BLT)</div>
                <div className="t-body" style={{ fontWeight: 600 }}>No Bending, Lifting, or Twisting</div>
                <div className="t-meta">Est. lifts <span className="mono">{formatDate(MOCK_PATIENT.bltLiftDate)}</span> · surgeon clearance required</div>
              </div>
            </div>
          </div>
        )}
        <div>
          <SectionLabel>Hardware inventory</SectionLabel>
          <div className="card" style={{ padding: '4px 16px' }}>
            {MOCK_HARDWARE.map((h, i) => <HardwareItem key={i} item={h}/>)}
          </div>
        </div>
      </div>
    </>
  );
}

// ═══ MPA (with audit log) ════════════════════════════════════
function MPAScreen({ onBack, status, onActivate, stakeholder }) {
  const isAmy = stakeholder === 'amy';
  return (
    <>
      <ScreenHeader title="Medical POA" kicker={isAmy ? 'Your authority' : 'Profile'} onBack={onBack}/>
      <div className="stack-16" style={{ padding: '0 14px 140px' }}>
        <MPAStatusCard status={status} holder={MOCK_MPA}/>
        <div className="card" style={{ padding: 16 }}>
          <SectionLabel>Document on file</SectionLabel>
          <div className="row-flex" style={{ gap: 12 }}>
            <div style={{ width: 40, height: 48, borderRadius: 6, background: 'var(--cat-mpa-bg)',
              border: '1px solid var(--cat-mpa-edge)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cat-mpa-ink)' }}><IconFileText className="icon"/></div>
            <div className="stack-2" style={{ flex: 1 }}>
              <div className="t-body" style={{ fontWeight: 600 }}>{MOCK_MPA.poaDocument}</div>
              <div className="t-meta">Durable · signed 2022 · notarized</div>
            </div>
            <button className="btn secondary sm">View</button>
          </div>
        </div>
        {status === 'inactive' && isAmy && (
          <div className="cat-surface cat-vitals" style={{ padding: 16 }}>
            <div className="stack-8">
              <div className="row-flex" style={{ gap: 8 }}>
                <IconInfo className="icon" style={{ color: 'var(--cat-vitals-ink)' }}/>
                <span className="t-label" style={{ color: 'var(--cat-vitals-ink)' }}>Activating your authority</span>
              </div>
              <div className="t-body-sm" style={{ color: 'var(--ink-2)' }}>
                Your MPA becomes active only when a clinician documents that Rick is incapacitated. Upload a signed capacity determination to activate.
              </div>
              <button className="btn primary" style={{ marginTop: 6 }} onClick={onActivate}>
                <IconUpload className="icon-sm"/>Upload capacity determination
              </button>
            </div>
          </div>
        )}
        <div>
          <SectionLabel action={isAmy ? <span className="t-meta">Your audit trail</span> : null}>Activation history</SectionLabel>
          {MOCK_MPA.activationHistory.length === 0 ? (
            <div className="card-sunken" style={{ padding: 18, textAlign: 'center' }}>
              <div className="t-body-sm muted">No prior activations</div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              {MOCK_MPA.activationHistory.map((h, i) => (
                <div key={h.id} style={{ padding: 14, borderBottom: i < MOCK_MPA.activationHistory.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
                  <div className="row-flex-between">
                    <span className={`chip ${h.event === 'Activated' ? 'warning' : 'ok'}`}>{h.event}</span>
                    <div className="t-meta mono">{formatDate(h.date)}</div>
                  </div>
                  <div className="t-body" style={{ marginTop: 8, fontWeight: 600 }}>{h.reason}</div>
                  <div className="t-body-sm muted-2" style={{ marginTop: 2 }}>{h.note}</div>
                  <div className="t-meta" style={{ marginTop: 6 }}>Clinician: {h.clinician}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ═══ ER HANDOFF ══════════════════════════════════════════════
function ERHandoffScreen({ onBack }) {
  const [generated, setGenerated] = useState2(false);
  const [includeInsurance, setIncludeInsurance] = useState2(false);
  return (
    <>
      <ScreenHeader title="ER Handoff" kicker="Emergency" onBack={onBack}/>
      {!generated ? (
        <div className="stack-16" style={{ padding: '0 14px 140px' }}>
          <div className="cat-surface cat-allergy" style={{ padding: 18 }}>
            <div className="row-flex" style={{ gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'oklch(1 0 0 / 0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--critical)' }}>
                <IconFileText className="icon-lg"/></div>
              <div className="stack-2" style={{ flex: 1 }}>
                <div className="t-label" style={{ color: 'var(--cat-allergy-ink)' }}>One-page PDF</div>
                <div className="t-h2">Hand this to the ER clinician</div>
              </div>
            </div>
            <div className="t-body-sm" style={{ marginTop: 10, color: 'var(--ink-2)' }}>Designed for a 15-second read. Allergies, hardware, meds, and contacts visible at the top.</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <SectionLabel>Included by default</SectionLabel>
            <div className="stack-6">
              {['Identifiers and demographics','Life-threatening allergies','Active diagnoses','Current medications + last taken','Surgical hardware + MRI safety','Recent vitals (24h) + orthostatic','Providers and emergency contacts','MPA holder + current status','Advance directive and code status'].map((item, i) => (
                <div key={i} className="row-flex" style={{ gap: 10, padding: '3px 0' }}>
                  <IconCheck className="icon-sm" style={{ color: 'var(--ok-ink)' }}/>
                  <div className="t-body-sm">{item}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <SectionLabel>Optional</SectionLabel>
            <label className="row-flex" style={{ gap: 12, cursor: 'pointer', padding: '2px 0' }}>
              <input type="checkbox" checked={includeInsurance} onChange={e => setIncludeInsurance(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}/>
              <div className="stack-2" style={{ flex: 1 }}>
                <div className="t-body-sm" style={{ fontWeight: 600 }}>Include insurance details</div>
                <div className="t-meta">Not needed for clinical care — privacy concern if PDF is lost</div>
              </div>
            </label>
          </div>
          <button className="btn primary" style={{ width: '100%', padding: '14px 18px', fontSize: 16, minHeight: 52 }} onClick={() => setGenerated(true)}>
            <IconFileText className="icon"/>Generate PDF
          </button>
        </div>
      ) : (
        <div className="stack-12" style={{ padding: '0 14px 140px' }}>
          <ERPDFPreview/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <button className="btn secondary"><IconDownload className="icon-sm"/>Save</button>
            <button className="btn secondary"><IconShare className="icon-sm"/>Share</button>
            <button className="btn secondary"><IconPrint className="icon-sm"/>Print</button>
          </div>
          <button className="btn ghost" onClick={() => setGenerated(false)} style={{ justifyContent: 'center' }}>Regenerate</button>
        </div>
      )}
    </>
  );
}
function ERPDFPreview() {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 14, fontSize: 10.5, lineHeight: 1.35, fontFamily: 'var(--font-sans)', color: '#111', boxShadow: 'var(--shadow-1)' }}>
      <div style={{ borderBottom: '2px solid #111', paddingBottom: 6, marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Rick Whitman</div>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }}>DOB 04/15/1948 (77) · M</div>
        </div>
        <div style={{ fontSize: 9, color: '#555', marginTop: 2 }}>EC: Linda Whitman (617) 555-0102 · Amy W-K (508) 555-0147 · MPA: INACTIVE</div>
      </div>
      <PDFSection label="⚠ ALLERGIES" critical>
        <div style={{ fontWeight: 700, color: '#b91c1c' }}>Penicillin → Anaphylaxis (LIFE-THREATENING)</div>
        <div>Sulfa → Rash · Latex → Dermatitis · Shellfish → Nausea</div>
      </PDFSection>
      <PDFSection label="ACTIVE DIAGNOSES">
        <div>• s/p L1–L5 fusion + sacral instrumentation (03/12/2026)</div>
        <div>• Pulmonary emboli ×2 (03/20/2026) — <b>on apixaban</b></div>
        <div>• Pneumonia (03/20/2026, levofloxacin)</div>
      </PDFSection>
      <PDFSection label="CURRENT MEDICATIONS">
        <div><b>Apixaban 5 mg BID</b> — last 8:04 AM · Levofloxacin 750 mg daily — 9:00 AM</div>
        <div>Oxycodone 5 mg Q4H PRN · Acetaminophen 650 mg Q6H · Lisinopril 10 mg · Docusate 100 mg BID</div>
      </PDFSection>
      <PDFSection label="SURGICAL HARDWARE" critical>
        <div>Pedicle screws L1–L5 (10, Ti) · Rods ×2 · Sacral instrum. · Bilateral hip prostheses (Zimmer, 2019)</div>
        <div style={{ fontWeight: 700, color: '#b45309' }}>MRI: conditional 1.5T only</div>
      </PDFSection>
      <PDFSection label="RECENT VITALS (24h)">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5 }}>BP 128/78 · HR 92 · T 100.2°F · SpO₂ 93% · RR 20 · Pain 4/10</div>
      </PDFSection>
      <PDFSection label="CODE / AD / MPA">
        <div>Full code · AD on file · MPA: Amy W-K (508) 555-0147 — currently <b>INACTIVE</b></div>
      </PDFSection>
    </div>
  );
}
function PDFSection({ label, children, critical }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 0.5, color: critical ? '#b91c1c' : '#555', borderBottom: '1px solid #ddd', paddingBottom: 2, marginBottom: 3 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

Object.assign(window, {
  TodayScreen, ProfileScreen, AllergiesScreen, SurgeryScreen, MPAScreen, ERHandoffScreen,
  MedsScreen, VitalsScreen, PeopleScreen, RecordsScreen,
});
