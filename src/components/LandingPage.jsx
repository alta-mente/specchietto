import { useState } from 'react';
import {
  Calendar, Users, Percent, ShieldCheck, Smartphone, Clock, Check,
  ArrowRight, Menu, X, Sparkles, Mail
} from 'lucide-react';
import { getBackendUrl } from '../services/backendUrl';

const backendUrl = getBackendUrl();

const AUDIENCES = [
  'Parrucchieri', 'Barbieri', 'Spa e Benessere', 'Sport e Padel',
  'Palestra e Yoga', 'Massaggi', 'Salute e Medicina', 'Lezioni e Ripetizioni',
  'Centri Estetici', 'Consulenza', 'Toelettatura', 'Spazi di Coworking'
];

const BENEFITS = [
  {
    icon: Percent,
    title: 'Zero commissioni',
    desc: "Nessuna percentuale sul servizio, nessun cliente che scorre altri saloni nella stessa lista. Le prenotazioni sono tue."
  },
  {
    icon: Calendar,
    title: 'Agenda in tempo reale',
    desc: 'Ogni operatore ha il proprio calendario con orari personalizzati. Niente più doppie prenotazioni o buchi in agenda.'
  },
  {
    icon: ShieldCheck,
    title: 'Nessuna disdetta',
    desc: "Conferme e promemoria automatici via SMS o Email. Il cliente sa sempre data e ora, azzerando le dimenticanze."
  }
];

const STEPS = [
  { icon: Smartphone, title: 'Il cliente prenota da solo', desc: '24 ore su 24, dal telefono, scegliendo il servizio desiderato.' },
  { icon: Users, title: 'Sceglie lo staff preferito', desc: 'Oppure "nessuna preferenza": il sistema propone il primo libero.' },
  { icon: Clock, title: 'Ricevi la notifica in app', desc: 'Ti arriva un avviso sul telefono. Clicchi "Accetta" ed è fatta.' },
  { icon: Calendar, title: "L'agenda si sincronizza", desc: "Tutto lo staff vede l'impegno, senza bisogno di scrivere nulla a mano." }
];

const COMPARISON = [
  { theirs: 'Commissione fissa o in %', ours: 'Zero commissioni, per sempre' },
  { theirs: 'Mostra i tuoi concorrenti', ours: 'Prenotano solo dal tuo sito' },
  { theirs: 'Agenda cartacea confusionaria', ours: 'Agenda digitale per operatore' },
  { theirs: 'Interruzioni per rispondere', ours: 'Prenotazioni automatiche 24/7' }
];

const FAQS = [
  { q: 'Devo installare qualcosa sul PC?', a: 'No, accedi da browser. Ma avrai a disposizione anche un\'app nativa iOS/Android per accettare le richieste in un lampo.' },
  { q: 'Posso avere più operatori con orari diversi?', a: "Sì, ogni membro dello staff ha i suoi servizi, le sue pause e le sue ferie indipendenti." },
  { q: 'C\'è un canone mensile?', a: 'Specchietto è in fase di lancio esclusivo. Chi entra ora come early adopter avrà condizioni uniche. Scrivici per saperne di più.' },
  { q: 'Funziona per centri estetici e barbieri?', a: 'Assolutamente sì. Il sistema gestisce appuntamenti a durata variabile perfetti per parrucchieri, estetiste e barbershop.' }
];

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
    <div style={{ backgroundColor: 'var(--ink)', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* BACKGROUND ELEMENTS */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(255,92,130,0.2) 0%, transparent 60%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', animation: 'blobScale 15s infinite ease-in-out' }}></div>
      <div style={{ position: 'absolute', top: '20%', right: '-5%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 60%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', animation: 'blobScale 12s infinite ease-in-out reverse' }}></div>

      {/* NAV */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 4%', backgroundColor: 'rgba(10, 10, 16, 0.7)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--glass-border)'
      }}>
        <strong style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
          Specchietto<span style={{ color: 'var(--accent)' }}>.</span>
        </strong>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="landing-nav-desktop">
          <a href="#come-funziona" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' }} onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='#94a3b8'}>Come funziona</a>
          <a href="#faq" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' }} onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='#94a3b8'}>FAQ</a>
          <button onClick={onOpenLogin} style={{ background: 'none', border: 'none', color: '#fff', fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseEnter={e=>e.target.style.opacity='0.8'} onMouseLeave={e=>e.target.style.opacity='1'}>
            Login Salone
          </button>
          <a href="#early-access" className="glow-button" style={{ padding: '12px 24px', textDecoration: 'none', fontSize: '0.9rem' }}>
            Richiedi Accesso
          </a>
        </nav>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="landing-nav-mobile-btn" style={{ display: 'none', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </header>

      {/* HERO */}
      <section style={{ position: 'relative', zIndex: 10, padding: '120px 4% 140px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="animate-fade-up" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          color: '#fff', padding: '8px 16px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '32px', backdropFilter: 'blur(10px)'
        }}>
          <Sparkles size={16} color="var(--accent)" /> Creato per Parrucchieri & Beauty
        </div>
        
        <h1 className="animate-fade-up delay-100" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: '900', maxWidth: '900px', margin: '0 0 24px 0', lineHeight: '1.1', letterSpacing: '-1px' }}>
          Agenda sempre piena.<br/>
          <span style={{ background: 'linear-gradient(135deg, #FF5C82 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'gradientShift 8s ease infinite', backgroundSize: '200% 200%' }}>Zero commissioni.</span>
        </h1>
        
        <p className="animate-fade-up delay-200" style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '640px', margin: '0 0 48px 0', lineHeight: '1.6', fontWeight: '400' }}>
          Specchietto è l'ecosistema definitivo per i servizi alla persona. I clienti prenotano da soli, il tuo staff è sempre sincronizzato.
        </p>
        
        <div className="animate-fade-up delay-300" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#early-access" className="glow-button" style={{ padding: '16px 32px', fontSize: '1.05rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Inizia Ora <ArrowRight size={20} />
          </a>
          <a href="#/prenota?business=salone-prova" className="glass-card" style={{
            padding: '16px 32px', fontSize: '1.05rem', fontWeight: '600', textDecoration: 'none', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
          }}>
            Vedi Demo App
          </a>
        </div>
      </section>

      {/* BENEFITS */}
      <section style={{ position: 'relative', zIndex: 10, padding: '0 4% 120px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', maxWidth: '1100px', margin: '-60px auto 0' }}>
          {BENEFITS.map((b, i) => (
            <div key={i} className="glass-card animate-fade-up" style={{ padding: '40px 32px', animationDelay: `${300 + (i * 100)}ms` }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(255,92,130,0.2), rgba(255,92,130,0.05))', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid rgba(255,92,130,0.2)' }}>
                <b.icon size={28} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '12px', letterSpacing: '-0.5px' }}>{b.title}</h3>
              <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TARGET AUDIENCE */}
      <section style={{ position: 'relative', zIndex: 10, padding: '0 4% 120px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 16px 0', letterSpacing: '-1px' }}>Pensato su misura per te</h2>
        <p style={{ fontSize: '1.15rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto 48px' }}>
          Qualsiasi sia la tua professione, se gestisci il tuo tempo ad appuntamenti, Specchietto è il software giusto.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', maxWidth: '900px', margin: '0 auto' }}>
          {AUDIENCES.map((audience, i) => (
            <div key={i} className="glass-card" style={{
              padding: '12px 24px', fontSize: '1.05rem', fontWeight: '600', color: '#fff',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))', cursor: 'default'
            }}>
              {audience}
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="come-funziona" style={{ padding: '100px 4%', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 16px 0', letterSpacing: '-1px' }}>Il flusso perfetto</h2>
          <p style={{ fontSize: '1.15rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>Dimentica WhatsApp, chiamate perse e agende scarabocchiate. Funziona tutto in automatico.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px', maxWidth: '1100px', margin: '0 auto' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '24px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', position: 'relative'
              }}>
                <s.icon size={36} />
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '800' }}>
                  {i + 1}
                </div>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px' }}>{s.title}</h3>
              <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: '1.5', margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* EARLY ACCESS */}
      <section id="early-access" style={{ padding: '120px 4%', position: 'relative', zIndex: 10 }}>
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 4%', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,92,130,0.05) 100%)' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px', letterSpacing: '-1px' }}>Entra nel futuro del tuo salone</h2>
          <p style={{ color: '#94a3b8', fontSize: '1.15rem', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px' }}>
            Siamo in fase di lancio esclusiva. Iscriviti per provare la piattaforma in anteprima e bloccare condizioni speciali a vita.
          </p>

          {submitted ? (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', borderRadius: '16px', padding: '32px' }}>
              <Check size={48} style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.4rem', margin: '0 0 8px 0' }}>Richiesta Inviata!</h3>
              <p style={{ margin: 0, color: '#059669' }}>Ti contatteremo prestissimo al recapito indicato.</p>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
              <input value={leadForm.restaurant_name} onChange={(e) => setLeadForm({ ...leadForm, restaurant_name: e.target.value })} placeholder="Nome del salone" required style={inputStyleDark} />
              <input value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} placeholder="Il tuo nome" required style={inputStyleDark} />
              <input type="email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} placeholder="Email" required style={inputStyleDark} />
              <input type="tel" value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} placeholder="Telefono" style={inputStyleDark} />
              <button type="submit" disabled={submitting} className="glow-button" style={{ gridColumn: '1 / -1', padding: '18px', fontSize: '1.1rem', marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <Mail size={20} /> {submitting ? 'Elaborazione...' : 'Invia Richiesta di Accesso'}
              </button>
              {submitError && <div style={{ gridColumn: '1 / -1', color: '#ef4444', textAlign: 'center', marginTop: '8px' }}>{submitError}</div>}
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '80px 4% 120px' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px' }}>Domande Frequenti</h2>
        </div>
        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {FAQS.map((f, i) => (
            <div key={i} className="glass-card" style={{ padding: '24px', cursor: 'pointer' }} onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '700', fontSize: '1.1rem' }}>
                {f.q}
                <span style={{ color: 'var(--accent)', fontSize: '1.5rem', transition: 'transform 0.3s', transform: expandedFaq === i ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
              </div>
              <div style={{ 
                maxHeight: expandedFaq === i ? '200px' : '0', overflow: 'hidden', transition: 'all 0.3s ease',
                opacity: expandedFaq === i ? 1 : 0, marginTop: expandedFaq === i ? '16px' : '0', color: '#94a3b8', lineHeight: '1.6'
              }}>
                {f.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '48px 4%', textAlign: 'center', color: '#64748b' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
          <strong style={{ color: '#fff', fontSize: '1.2rem' }}>Specchietto.</strong>
        </div>
        <p style={{ margin: '0 0 24px 0', fontSize: '0.9rem' }}>Il software intelligente per professionisti della bellezza.</p>
        <div style={{ fontSize: '0.8rem' }}>&copy; {new Date().getFullYear()} Specchietto. Tutti i diritti riservati.</div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .landing-nav-desktop { display: none !important; }
          .landing-nav-mobile-btn { display: block !important; }
          form { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

const inputStyleDark = {
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid var(--glass-border)',
  backgroundColor: 'rgba(0,0,0,0.2)',
  color: '#fff',
  fontSize: '1rem',
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.3s'
};
