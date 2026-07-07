import { useState } from 'react';
import {
  Calendar, Users, Percent, ShieldCheck, Smartphone, Clock, Check,
  ArrowRight, Menu, X, Sparkles, Mail
} from 'lucide-react';

const backendUrl = 'http://localhost:3001';
const ACCENT = '#FF5C82';
const INK = '#14141c';

const BENEFITS = [
  {
    icon: Percent,
    title: 'Zero commissioni per appuntamento',
    desc: "A differenza dei marketplace di bellezza, ogni prenotazione arriva dal tuo sito. Nessuna percentuale sul servizio, nessun cliente che scorre altri saloni nella stessa lista."
  },
  {
    icon: Calendar,
    title: 'Agenda in tempo reale, per operatore',
    desc: 'Ogni operatore ha il proprio calendario con orari e durate personalizzate. Niente più doppie prenotazioni o buchi in agenda scoperti troppo tardi.'
  },
  {
    icon: ShieldCheck,
    title: 'Meno clienti che spariscono',
    desc: "Conferme e promemoria automatici. Il cliente sa sempre data, ora e con chi ha l'appuntamento — e tu sai sempre a che punto è la giornata."
  }
];

const STEPS = [
  { icon: Smartphone, title: 'Il cliente prenota da solo', desc: '24 ore su 24, dal telefono, senza bisogno di chiamare.' },
  { icon: Users, title: 'Sceglie servizio e operatore', desc: 'Oppure "nessuna preferenza": il sistema propone il primo libero.' },
  { icon: Clock, title: 'Tu ricevi la richiesta', desc: 'Confermi con un tap. Lo stato si aggiorna per tutto lo staff.' },
  { icon: Calendar, title: "L'agenda si aggiorna da sola", desc: "Niente quaderni, niente doppie prenotazioni, niente telefonate perse." }
];

const COMPARISON = [
  { theirs: 'Commissione su ogni prenotazione', ours: 'Zero commissioni, sempre' },
  { theirs: 'Il cliente vede anche i tuoi concorrenti', ours: 'Il cliente prenota solo da te' },
  { theirs: 'Quaderno o agenda cartacea', ours: 'Agenda digitale in tempo reale, per operatore' },
  { theirs: 'Telefonate continue durante il lavoro', ours: 'Prenotazioni automatiche, 24/7' },
  { theirs: 'Nessun promemoria automatico', ours: 'Conferme e promemoria automatici' }
];

const FAQS = [
  { q: 'Devo installare qualcosa?', a: 'No. Il cliente prenota da una pagina web, tu gestisci tutto da un pannello accessibile da computer o telefono — è disponibile anche una app per Android.' },
  { q: 'Posso avere più operatori con orari diversi?', a: "Sì, ogni operatore ha il proprio calendario, i propri servizi assegnati e il proprio orario settimanale, incluse eccezioni per ferie o chiusure straordinarie." },
  { q: 'Quanto costa?', a: 'Specchietto è in fase di lancio. Stiamo selezionando i primi saloni partner con condizioni dedicate — lasciaci i tuoi contatti qui sotto.' },
  { q: 'Funziona anche per centri estetici e nail artist?', a: 'Sì, il sistema è pensato per qualsiasi servizio alla persona con appuntamenti a durata variabile: parrucchieri, centri estetici, nail artist e studi simili.' }
];

const sectionTitleStyle = { fontSize: '1.8rem', fontWeight: '700', marginBottom: '12px', color: INK };
const sectionDescStyle = { fontSize: '1rem', color: '#64748b', maxWidth: '560px', margin: '0 auto', lineHeight: '1.6' };

export const LandingPage = ({ onOpenLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [leadForm, setLeadForm] = useState({ restaurant_name: '', name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!leadForm.restaurant_name.trim() || !leadForm.name.trim() || !leadForm.email.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch(`${backendUrl}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadForm)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore durante l\'invio.');
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: INK, overflowX: 'hidden' }}>
      {/* Nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', backgroundColor: 'rgba(20,20,28,0.85)', backdropFilter: 'blur(10px)', color: '#fff'
      }}>
        <strong style={{ fontSize: '1.15rem' }}>Specchietto</strong>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="landing-nav-desktop">
          <a href="#come-funziona" style={{ color: '#c9c7d3', textDecoration: 'none', fontSize: '0.9rem' }}>Come funziona</a>
          <a href="#faq" style={{ color: '#c9c7d3', textDecoration: 'none', fontSize: '0.9rem' }}>FAQ</a>
          <button onClick={onOpenLogin} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            Accedi
          </button>
          <a href="#early-access" style={{ backgroundColor: ACCENT, color: '#fff', padding: '9px 18px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none' }}>
            Accesso anticipato
          </a>
        </nav>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="landing-nav-mobile-btn" style={{ display: 'none', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div style={{ backgroundColor: INK, padding: '16px 32px', display: 'flex', flexDirection: 'column', gap: '14px' }} className="landing-nav-mobile-panel">
          <a href="#come-funziona" style={{ color: '#c9c7d3', textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>Come funziona</a>
          <a href="#faq" style={{ color: '#c9c7d3', textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>FAQ</a>
          <button onClick={onOpenLogin} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>Accedi</button>
        </div>
      )}

      {/* Hero */}
      <section style={{
        background: 'radial-gradient(circle at 20% 20%, #23233a 0%, #14141c 55%, #0b0b10 100%)',
        color: '#fff', padding: '90px 24px 100px', textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,92,130,0.12)',
          color: ACCENT, padding: '6px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '700', marginBottom: '24px'
        }}>
          <Sparkles size={14} /> Per parrucchieri, centri estetici, nail artist
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: '800', maxWidth: '780px', margin: '0 auto 20px', lineHeight: '1.15' }}>
          Il tuo salone, sempre prenotabile.<br />Zero commissioni, zero telefonate perse.
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#c9c7d3', maxWidth: '600px', margin: '0 auto 36px', lineHeight: '1.6' }}>
          Specchietto è l'agenda digitale pensata per chi lavora con le mani: ogni operatore col suo calendario,
          promemoria automatici per i clienti, nessuna percentuale su ogni appuntamento.
        </p>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#early-access" style={{
            backgroundColor: ACCENT, color: '#fff', padding: '14px 28px', borderRadius: '10px', fontWeight: '700',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: `0 12px 28px ${ACCENT}40`
          }}>
            Richiedi accesso anticipato <ArrowRight size={18} />
          </a>
          <a href="#/prenota?business=salone-prova" style={{
            backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
            padding: '14px 28px', borderRadius: '10px', fontWeight: '600', textDecoration: 'none'
          }}>
            Guarda una demo dal vivo
          </a>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: '80px 24px', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={sectionTitleStyle}>Fatto per chi vive di appuntamenti</h2>
          <p style={sectionDescStyle}>Non un gestionale generico adattato alla bell'e meglio: pensato da zero per servizi con durata variabile e più operatori.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
          {BENEFITS.map((b, i) => (
            <div key={i} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: `${ACCENT}15`, color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <b.icon size={22} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '8px' }}>{b.title}</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6', margin: 0 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="come-funziona" style={{ padding: '80px 24px', backgroundColor: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={sectionTitleStyle}>Come funziona</h2>
          <p style={sectionDescStyle}>Dalla prenotazione del cliente alla giornata organizzata, senza passaggi manuali.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '0 12px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%', backgroundColor: INK, color: ACCENT,
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontWeight: '700'
              }}>
                <s.icon size={22} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: ACCENT, marginBottom: '6px' }}>PASSO {i + 1}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '6px' }}>{s.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5', margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section style={{ padding: '80px 24px', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={sectionTitleStyle}>Dal quaderno degli appuntamenti a un sistema vero</h2>
          <p style={sectionDescStyle}>Rispetto alle app di prenotazione con commissioni, o al metodo "a penna":</p>
        </div>
        <div style={{ maxWidth: '640px', margin: '0 auto', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
          {COMPARISON.map((row, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: i < COMPARISON.length - 1 ? '1px solid #f1f5f9' : 'none'
            }}>
              <div style={{ padding: '16px 20px', color: '#94a3b8', fontSize: '0.88rem', borderRight: '1px solid #f1f5f9' }}>{row.theirs}</div>
              <div style={{ padding: '16px 20px', fontSize: '0.88rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color={ACCENT} style={{ flexShrink: 0 }} /> {row.ours}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Early access */}
      <section id="early-access" style={{ padding: '80px 24px', background: `radial-gradient(circle at 80% 20%, #23233a 0%, #14141c 55%, #0b0b10 100%)`, color: '#fff' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '12px' }}>Entra tra i primi saloni partner</h2>
          <p style={{ color: '#c9c7d3', marginBottom: '32px', lineHeight: '1.6' }}>
            Specchietto è in fase di lancio. Lasciaci i tuoi contatti: ti richiamiamo per una demo e condizioni dedicate ai primi partner.
          </p>

          {submitted ? (
            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '28px' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>✓</div>
              <p style={{ margin: 0 }}>Grazie! Ti contatteremo a breve.</p>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <input
                value={leadForm.restaurant_name}
                onChange={(e) => setLeadForm({ ...leadForm, restaurant_name: e.target.value })}
                placeholder="Nome del salone"
                required
                style={inputStyleDark}
              />
              <input
                value={leadForm.name}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                placeholder="Il tuo nome"
                required
                style={inputStyleDark}
              />
              <input
                type="email"
                value={leadForm.email}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                placeholder="Email"
                required
                style={inputStyleDark}
              />
              <input
                type="tel"
                value={leadForm.phone}
                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                placeholder="Telefono (facoltativo)"
                style={inputStyleDark}
              />
              <button type="submit" disabled={submitting} style={{
                backgroundColor: ACCENT, color: '#fff', border: 'none', padding: '14px', borderRadius: '10px',
                fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: `0 8px 20px ${ACCENT}40`
              }}>
                <Mail size={16} /> {submitting ? 'Invio...' : 'Richiedi accesso anticipato'}
              </button>
              {submitError && <span style={{ color: '#fca5a5', fontSize: '0.85rem' }}>{submitError}</span>}
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '80px 24px', backgroundColor: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={sectionTitleStyle}>Hai ancora dei dubbi?</h2>
        </div>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          {FAQS.map((f, i) => (
            <div key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '20px 4px',
                  fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: INK
                }}
              >
                {f.q}
                <span style={{ color: ACCENT, fontSize: '1.2rem' }}>{expandedFaq === i ? '−' : '+'}</span>
              </button>
              {expandedFaq === i && (
                <p style={{ padding: '0 4px 20px', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: INK, color: '#8b889a', padding: '32px 24px', textAlign: 'center', fontSize: '0.8rem' }}>
        <strong style={{ color: '#fff' }}>Specchietto</strong> — gestionale di prenotazioni per servizi alla persona.
        <div style={{ marginTop: '8px' }}>&copy; {new Date().getFullYear()} Specchietto. Tutti i diritti riservati.</div>
      </footer>

      <style>{`
        @media (max-width: 720px) {
          .landing-nav-desktop { display: none !important; }
          .landing-nav-mobile-btn { display: block !important; }
        }
      `}</style>
    </div>
  );
};

const inputStyleDark = {
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.12)',
  backgroundColor: 'rgba(255,255,255,0.05)',
  color: '#fff',
  fontSize: '0.9rem',
  outline: 'none'
};
