import { useState, useEffect } from 'react'
import { Compass, X, Check, ArrowRight, Repeat } from 'lucide-react'

const ACCENT = '#4C6481'
const DECISIONS_KEY = 'lu-kompas-decisions-v1'

// ── De drie waarden-vragen ───────────────────────────────────────
const VRAGEN = [
  { id: 'v1', q: 'Past het bij sport én business?', sub: 'Het merk staat op de kruising van die twee. Alles wat maar één kant dient, verwatert het.' },
  { id: 'v2', q: 'Draait het zonder mij?', sub: 'Eenmalig bouwen, oneindig verkopen. Alles wat wekelijkse aanwezigheid nodig heeft, is een uitzondering en wordt duur betaald.' },
  { id: 'v3', q: 'Houdt het m\'n agenda vrij?', sub: 'Meetings zijn de duurste munt. Slow mornings, training en reizen staan eerst, de rest past zich aan.' },
]

const NIET_IN_MODEL = [
  'Groepsprogramma\'s met live sessies. Not my thing, dus niet in het model.',
  'Uurtje-factuurtje in elke vorm, behalve het 1:1 topsegment zolang ik dat zelf wil.',
  'Lanceringsstress met aftelklokken en kunstmatige schaarste. Evergreen of niet.',
]

// ── Productladder ────────────────────────────────────────────────
const LADDER = [
  { trede: 'Gratis', wat: 'Blog, wekelijkse brief, Zondag Reset, proeflessen', prijs: '€0', status: 'live' },
  { trede: 'Instap', wat: 'Weekplanner, Kwartaalplanner, CEO-dag, Checklist, Visie-gids', prijs: '€9,90 tot €39', status: 'live' },
  { trede: 'Kern', wat: 'Sporten / Voedzaam eten met een drukke agenda + bundel', prijs: '€49 tot €119', status: 'live' },
  { trede: 'Vlaggenschip', wat: 'The Hybrid Method: business én lichaam in één systeem, self-paced, geen live component', prijs: '€397 founding, €497 later', status: 'bouwen · jaar 1' },
  { trede: 'Continuïteit', wat: 'ceo lifestyle™ club: maandelijkse toolkit, template-drops, brief-plus. Content-only, geen calls', prijs: '€29 per maand', status: 'jaar 2' },
  { trede: 'Corporate', wat: 'Blijven bewegen at work: bedrijven licentiëren de cursusbibliotheek voor hun team', prijs: '€4k tot €10k per jaar', status: 'jaar 2 · pilots via BORA' },
  { trede: 'Certificering', wat: 'Coaches en trainers leren werken met The Hybrid Method', prijs: '€6k tot €8k', status: 'jaar 3+' },
]

// ── De machine ───────────────────────────────────────────────────
const MACHINE = [
  { n: 1, titel: 'Content brengt ze binnen', tekst: 'Instagram en de podcast zijn de motor, de blog vangt zoekverkeer. Twee dagen per maand batchen, de rest is inplannen. Elke post wijst naar de gratis laag.' },
  { n: 2, titel: 'De lijst houdt ze vast', tekst: 'De Zondag Reset en proeflessen zijn de magneten. Welkomstreeks van vijf mails, dan de wekelijkse brief. De lijst is het enige kanaal dat van ons is.' },
  { n: 3, titel: 'Funnels verkopen', tekst: 'Wie de reset pakt, krijgt de weekplanner. Wie een cursus koopt, groeit automatisch richting The Hybrid Method. Elke mail staat vooraf geschreven en verstuurt zichzelf.' },
  { n: 4, titel: 'Licenties schalen', tekst: 'Corporate en certificering verkopen tientallen plekken per deal, zonder extra uren. Eerste pilots via het BORA-netwerk en podcast-gasten: warme deuren.' },
]

// ── Mijlpalen ────────────────────────────────────────────────────
const FASES = [
  { fase: 'Fase 1', periode: 'jaar 1', omzet: '€100k', doel: 'De machine aanzetten', tekst: 'E-mailautomatisering live, wekelijkse brief zonder uitzondering, lijst naar 5.000. The Hybrid Method bouwen en evergreen lanceren aan founding-prijzen. Dit is het bouwjaar: alles wat je maakt, verkoopt daarna jaren door.' },
  { fase: 'Fase 2', periode: 'jaar 2', omzet: '€300k tot €600k', doel: 'Continuïteit', tekst: 'De club open, drie corporate pilots via het eigen netwerk, lijst naar 20.000. Eerste async hulp aan boord. 1:1 naar €7.500. Rond de bovenkant van deze fase is het leven uit dit plan betaald.' },
  { fase: 'Fase 3', periode: 'jaar 3-4', omzet: '€1M tot €2M', doel: 'Schaal kopen', tekst: 'Betaalde advertenties op de bewezen funnel, corporate van pilots naar portfolio, team van drie. Engelstalige versie van het vlaggenschip.' },
  { fase: 'Fase 4', periode: 'jaar 5+', omzet: '€3M tot €6M', doel: 'Het merk laat anderen werken', tekst: 'Certificering draait, corporate internationaal, LAURENCE UVIN is de naam die valt als het over sport én business gaat. De vraag is niet meer "kan het" maar "hoeveel wil ik nog".' },
]

// ── Beslissingstoets ─────────────────────────────────────────────
interface SavedDecision { id: string; idee: string; verdict: 'ja' | 'nee'; date: string }

function BeslissingsToets() {
  const [idee, setIdee] = useState('')
  const [antwoorden, setAntwoorden] = useState<Record<string, boolean | null>>({ v1: null, v2: null, v3: null })
  const [historie, setHistorie] = useState<SavedDecision[]>(() => {
    try { return JSON.parse(localStorage.getItem(DECISIONS_KEY) ?? '[]') } catch { return [] }
  })

  useEffect(() => { localStorage.setItem(DECISIONS_KEY, JSON.stringify(historie)) }, [historie])

  const beantwoord = Object.values(antwoorden).every(a => a !== null)
  const drieJa = Object.values(antwoorden).every(a => a === true)
  const verdict: 'ja' | 'nee' | null = beantwoord ? (drieJa ? 'ja' : 'nee') : null

  function bewaar() {
    if (!idee.trim() || !verdict) return
    setHistorie(h => [{ id: crypto.randomUUID(), idee: idee.trim(), verdict, date: new Date().toISOString().split('T')[0] }, ...h].slice(0, 20))
    setIdee('')
    setAntwoorden({ v1: null, v2: null, v3: null })
  }

  return (
    <div style={{ borderRadius: 16, border: `1.5px solid ${ACCENT}30`, background: 'var(--color-card)', overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px 14px', background: 'rgba(76,100,129,0.05)', borderBottom: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Het kompas · toets een idee</p>
        <p style={{ fontSize: 12, color: 'var(--color-subtle)', lineHeight: 1.5 }}>Elk nieuw idee, elke aanvraag, elke kans gaat door deze drie vragen. Drie keer ja, of het is nee.</p>
      </div>

      <div style={{ padding: '18px 22px' }}>
        <input
          value={idee}
          onChange={e => setIdee(e.target.value)}
          placeholder="Bijv. gastles geven, nieuw product, samenwerking..."
          style={{ width: '100%', padding: '11px 14px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {VRAGEN.map((v, i) => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: ACCENT, fontFamily: 'var(--font-mono)', marginTop: 8, flexShrink: 0 }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 2 }}>{v.q}</p>
                <p style={{ fontSize: 11, color: 'var(--color-subtle)', lineHeight: 1.5 }}>{v.sub}</p>
              </div>
              <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginTop: 4 }}>
                <button
                  onClick={() => setAntwoorden(a => ({ ...a, [v.id]: true }))}
                  style={{ padding: '5px 14px', borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
                    border: `1.5px solid ${antwoorden[v.id] === true ? '#6DB889' : 'var(--color-border)'}`,
                    background: antwoorden[v.id] === true ? '#6DB889' : 'transparent',
                    color: antwoorden[v.id] === true ? '#fff' : 'var(--color-ink)' }}>
                  Ja
                </button>
                <button
                  onClick={() => setAntwoorden(a => ({ ...a, [v.id]: false }))}
                  style={{ padding: '5px 14px', borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
                    border: `1.5px solid ${antwoorden[v.id] === false ? '#C4935A' : 'var(--color-border)'}`,
                    background: antwoorden[v.id] === false ? '#C4935A' : 'transparent',
                    color: antwoorden[v.id] === false ? '#fff' : 'var(--color-ink)' }}>
                  Nee
                </button>
              </div>
            </div>
          ))}
        </div>

        {verdict && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 11, marginBottom: 12,
            background: verdict === 'ja' ? 'rgba(109,184,137,0.10)' : 'rgba(196,147,90,0.10)',
            border: `1px solid ${verdict === 'ja' ? 'rgba(109,184,137,0.35)' : 'rgba(196,147,90,0.35)'}` }}>
            {verdict === 'ja' ? <Check size={16} color="#6DB889" strokeWidth={3} /> : <X size={16} color="#C4935A" strokeWidth={3} />}
            <p style={{ fontSize: 13, fontWeight: 700, color: verdict === 'ja' ? '#6DB889' : '#C4935A', flex: 1 }}>
              {verdict === 'ja' ? 'Drie keer ja. Dit past in het plan.' : 'Geen drie keer ja. Dan is het nee.'}
            </p>
            {idee.trim() && (
              <button onClick={bewaar} style={{ padding: '6px 14px', borderRadius: 16, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Bewaar
              </button>
            )}
          </div>
        )}

        {historie.length > 0 && (
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>Eerdere beslissingen</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {historie.slice(0, 6).map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, borderRadius: 5, background: d.verdict === 'ja' ? 'rgba(109,184,137,0.15)' : 'rgba(196,147,90,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {d.verdict === 'ja' ? <Check size={9} color="#6DB889" strokeWidth={3} /> : <X size={9} color="#C4935A" strokeWidth={3} />}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-ink)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.idee}</span>
                  <span style={{ fontSize: 9, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{d.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export function LuKompas() {
  return (
    <div style={{ maxWidth: 780 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Compass size={14} color={ACCENT} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, fontFamily: 'var(--font-mono)' }}>Het Groeiplan · 2026</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-ink)', lineHeight: 1.15, marginBottom: 10 }}>
          Run a business that<br />doesn't run you.
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-subtle)', lineHeight: 1.65, maxWidth: 560 }}>
          Sport en business, allebei voluit. Een bedrijf dat on repeat draait terwijl jij traint, reist of aan je zwembad zit.
          Geen groepsprogramma's, bijna geen meetings, wel systemen. Elke beslissing wordt aan dit plan getoetst: past het niet, dan doen we het niet.
        </p>
      </div>

      {/* Beslissingstoets */}
      <div style={{ marginBottom: 32 }}>
        <BeslissingsToets />
      </div>

      {/* Purpose + niet in het model */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div style={{ borderRadius: 14, border: '1px solid var(--color-border)', background: 'var(--color-card)', padding: '18px 20px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>Waarom dit bedrijf bestaat</p>
          <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.65 }}>
            Ook met een druk leven kan je blijven bewegen, en ook met grote ambitie kan je leven vol blijven.
            Het bewijs van het merk is het leven van de oprichter. Als de business Laurence opeet, klopt het product niet meer.
          </p>
        </div>
        <div style={{ borderRadius: 14, border: '1px solid var(--color-border)', background: 'var(--color-card)', padding: '18px 20px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>Bewust niet in het model</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {NIET_IN_MODEL.map((n, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <X size={11} color="#C4935A" style={{ marginTop: 3, flexShrink: 0 }} strokeWidth={3} />
                <p style={{ fontSize: 12, color: 'var(--color-ink)', lineHeight: 1.55 }}>{n}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Productladder */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>De productladder</p>
        <div style={{ borderRadius: 14, border: '1px solid var(--color-border)', background: 'var(--color-card)', overflow: 'hidden' }}>
          {LADDER.map((l, i) => {
            const isLive = l.status === 'live'
            return (
              <div key={l.trede} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderBottom: i < LADDER.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: ACCENT, fontFamily: 'var(--font-mono)', width: 84, flexShrink: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{l.trede}</span>
                <p style={{ fontSize: 12.5, color: 'var(--color-ink)', flex: 1, lineHeight: 1.5 }}>{l.wat}</p>
                <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, width: 130, textAlign: 'right' }}>{l.prijs}</span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 99, flexShrink: 0, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
                  background: isLive ? 'rgba(109,184,137,0.12)' : 'rgba(76,100,129,0.10)',
                  color: isLive ? '#6DB889' : ACCENT }}>
                  {l.status}
                </span>
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--color-subtle)', lineHeight: 1.6, marginTop: 10, paddingLeft: 2 }}>
          1:1 coaching blijft bestaan als topsegment: vier klanten per kwartaal aan €7.500. Niet omdat het moet, maar zolang het energie gééft.
        </p>
      </div>

      {/* De machine */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Repeat size={12} color={ACCENT} />
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>De machine · zo draait het on repeat</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {MACHINE.map(m => (
            <div key={m.n} style={{ borderRadius: 14, border: '1px solid var(--color-border)', background: 'var(--color-card)', padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: 16, background: 'rgba(76,100,129,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: ACCENT, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{m.n}</span>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>{m.titel}</p>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-subtle)', lineHeight: 1.6 }}>{m.tekst}</p>
            </div>
          ))}
        </div>
        <div style={{ borderRadius: 14, border: '1px solid var(--color-border)', background: 'rgba(76,100,129,0.04)', padding: '16px 20px', marginTop: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Jouw week in dit model</p>
          <p style={{ fontSize: 12.5, color: 'var(--color-ink)', lineHeight: 1.65 }}>
            Twee vaste maakdagen per week. Eén blok van maximaal twee uur voor alles wat een gesprek moet zijn. De rest is training, leven, reizen.
            De agenda is het product: als jouw week niet meer toont wat het merk belooft, is dat het eerste alarmsignaal, nog voor de cijfers.
          </p>
        </div>
      </div>

      {/* Mijlpalen */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ArrowRight size={12} color={ACCENT} />
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>Van vandaag naar zes miljoen</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FASES.map((f, i) => (
            <div key={f.fase} style={{ display: 'flex', gap: 16, borderRadius: 14, border: '1px solid var(--color-border)', background: 'var(--color-card)', padding: '16px 20px' }}>
              <div style={{ width: 90, flexShrink: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: ACCENT, fontFamily: 'var(--font-mono)' }}>{f.fase}</p>
                <p style={{ fontSize: 9, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{f.periode}</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-ink)', marginTop: 6, letterSpacing: '-0.01em' }}>{f.omzet}</p>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>{f.doel}</p>
                <p style={{ fontSize: 12, color: 'var(--color-subtle)', lineHeight: 1.6 }}>{f.tekst}</p>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-subtle)', fontStyle: 'italic', marginTop: 14, textAlign: 'center', fontFamily: 'var(--font-serif)' }}>
          Niets te verliezen, alles te bouwen. Elke week is gewoon de volgende kleine overwinning afvinken.
        </p>
      </div>
    </div>
  )
}
