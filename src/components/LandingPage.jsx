import { useState } from 'react';
import {
  Calendar, Users, Percent, ShieldCheck, Smartphone, Clock, Check,
  ArrowRight, Menu, X, Sparkles, Mail, BarChart2, CreditCard, MessageCircle, Star,
  TrendingUp, Activity, SmartphoneNfc, Scissors, Gem
} from 'lucide-react';
import { getBackendUrl } from '../services/backendUrl';

const backendUrl = getBackendUrl();

const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '29',
    desc: 'Ideale per professionisti singoli o piccoli saloni.',
    features: [
      'Gestione Agenda Base',
      'Appuntamenti Illimitati',
      'Fino a 2 Operatori',
      'Pagina Pubblica Prenotazioni',
      'Dashboard Statistiche Base'
    ],
    recommended: false,
    color: '#3b82f6'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '59',
    desc: 'Per saloni in crescita che vogliono scalare il business.',
    features: [
      'Tutto quello in Starter, più:',
      'Fino a 5 Operatori',
      'Sincronizzazione in tempo reale',
      'Gestione Risorse (Cabine/Lavaggi)',
      'Statistiche Avanzate & Esportazione',
      'Integrazione Stripe (Prossimamente)'
    ],
    recommended: true,
    color: '#a855f7'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '99',
    desc: 'La suite completa per leader di mercato e multi-sede.',
    features: [
      'Tutto quello in Pro, più:',
      'Operatori Illimitati',
      'Programma Fedeltà e Promozioni',
      'Campagne Marketing (SMS/Email)',
      'Whitelist VIP & Blacklist',
      'API Dedicate e Supporto 24/7'
    ],
    recommended: false,
    color: '#FF5C82'
  }
];

const TESTIMONIALS = [
  {
    name: "Giulia M.",
    role: "Titolare, Centro Estetico Lotus",
    text: "Prima passavo le sere a rispondere su WhatsApp. Ora l'agenda si riempie da sola di notte. Un vero salvavita per il mio centro estetico.",
    rating: 5
  },
  {
    name: "Marco D.",
    role: "Proprietario, Barber Shop 900",
    text: "Zero doppie prenotazioni e statistiche chiarissime. So finalmente quale dei miei ragazzi fattura di più e quali servizi spingere.",
    rating: 5
  },
  {
    name: "Eleonora C.",
    role: "Nail Artist Freelance",
    text: "Non credevo mi servisse un gestionale, ma da quando ho la mia pagina personalizzata i clienti mi percepiscono come molto più professionale.",
    rating: 5
  }
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
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(255,92,130,0.15) 0%, transparent 60%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', animation: 'blobScale 15s infinite ease-in-out' }}></div>
      <div style={{ position: 'absolute', top: '30%', right: '-5%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 60%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', animation: 'blobScale 12s infinite ease-in-out reverse' }}></div>
      
      {/* NAV */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 4%', backgroundColor: 'rgba(10, 10, 16, 0.75)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <strong style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
          Specchietto<span style={{ color: 'var(--accent)' }}>.</span>
        </strong>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="landing-nav-desktop">
          <a href="#funzionalita" style={{ color: '#cbd5e1', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' }} onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='#cbd5e1'}>Funzionalità</a>
          <a href="#piani" style={{ color: '#cbd5e1', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' }} onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='#cbd5e1'}>Piani</a>
          <button onClick={onOpenLogin} style={{ background: 'none', border: 'none', color: '#fff', fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseEnter={e=>e.target.style.opacity='0.8'} onMouseLeave={e=>e.target.style.opacity='1'}>
            Login Salone
          </button>
          <a href="#early-access" className="glow-button" style={{ padding: '10px 20px', textDecoration: 'none', fontSize: '0.9rem' }}>
            Richiedi Accesso
          </a>
        </nav>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="landing-nav-mobile-btn" style={{ display: 'none', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </header>

      {/* HERO SECTION WITH MOCK UI */}
      <section style={{ position: 'relative', zIndex: 10, padding: '100px 4% 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div className="animate-fade-up" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,92,130,0.1)', border: '1px solid rgba(255,92,130,0.2)',
          color: '#FF5C82', padding: '8px 16px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '24px'
        }}>
          <Sparkles size={16} /> Il SaaS Verticale per Beauty & Wellness
        </div>
        
        <h1 className="animate-fade-up delay-100" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: '900', maxWidth: '1000px', margin: '0 0 24px 0', lineHeight: '1.1', letterSpacing: '-1.5px' }}>
          Raddoppia gli appuntamenti.<br/>
          <span style={{ background: 'linear-gradient(135deg, #FF5C82 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'gradientShift 8s ease infinite', backgroundSize: '200% 200%' }}>Azzera completamente i No-Show.</span>
        </h1>
        
        <p className="animate-fade-up delay-200" style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '700px', margin: '0 0 40px 0', lineHeight: '1.6', fontWeight: '400' }}>
          Un'unica piattaforma intelligente per gestire agenda, staff, recensioni e pagamenti. Dimentica WhatsApp e i gestionali generici: Specchietto è progettato <strong>solo per professionisti della bellezza</strong>.
        </p>
        
        <div className="animate-fade-up delay-300" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '80px' }}>
          <a href="#early-access" className="glow-button" style={{ padding: '16px 32px', fontSize: '1.1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Inizia Gratis <ArrowRight size={20} />
          </a>
          <a href="#/prenota?business=salone-prova" className="glass-card" style={{
            padding: '16px 32px', fontSize: '1.1rem', fontWeight: '600', textDecoration: 'none', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
          }}>
            Vedi Demo Prenotazioni
          </a>
        </div>

        {/* HERO MOCKUP */}
        <div className="animate-fade-up delay-400" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-20px', left: '-20px', right: '-20px', bottom: '-20px', background: 'linear-gradient(135deg, rgba(255,92,130,0.3) 0%, rgba(168,85,247,0.3) 100%)', filter: 'blur(40px)', zIndex: 0, borderRadius: '40px' }}></div>
          <div className="glass-card" style={{ position: 'relative', zIndex: 1, padding: '0', overflow: 'hidden', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ height: '40px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '8px' }}>
              <div style={{width: 12, height: 12, borderRadius: '50%', background: '#ef4444'}}></div>
              <div style={{width: 12, height: 12, borderRadius: '50%', background: '#eab308'}}></div>
              <div style={{width: 12, height: 12, borderRadius: '50%', background: '#22c55e'}}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', height: '500px', background: '#0a0a10' }}>
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', padding: '20px' }}>
                <div style={{ height: '30px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', marginBottom: '30px', width: '80%' }}></div>
                {[1,2,3,4,5].map(i => <div key={i} style={{ height: '20px', background: i===2 ? 'rgba(255,92,130,0.2)' : 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '16px', width: i===2 ? '100%' : '70%' }}></div>)}
              </div>
              <div style={{ padding: '30px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                  <div style={{ height: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', width: '200px' }}></div>
                  <div style={{ height: '32px', background: 'rgba(255,92,130,0.8)', borderRadius: '8px', width: '120px' }}></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '30px' }}>
                  {[1,2,3].map(i => <div key={i} style={{ height: '100px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}></div>)}
                </div>
                <div style={{ height: '200px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED FEATURES */}
      <section id="funzionalita" style={{ padding: '80px 4% 120px', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '2.8rem', fontWeight: '800', margin: '0 0 16px 0', letterSpacing: '-1px' }}>Progettato per chi lavora sul serio</h2>
          <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>Nessuna funzione inutile, solo strumenti potenti per aumentare i tuoi margini e ridurre lo stress quotidiano.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '100px', maxWidth: '1100px', margin: '0 auto' }}>
          
          {/* Feature 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 400px' }}>
              <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', marginBottom: '24px' }}><Calendar size={32} /></div>
              <h3 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '16px', letterSpacing: '-0.5px' }}>L'Agenda Intelligente</h3>
              <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '24px' }}>
                Non un semplice calendario, ma un'intelligenza artificiale che incastra perfettamente gli appuntamenti. Gestisci i tempi di posa, le pause e le competenze specifiche di ogni membro dello staff.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#e2e8f0', fontSize: '1.05rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}><Check size={20} color="#3b82f6" /> Prenotazioni multi-operatore</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}><Check size={20} color="#3b82f6" /> Ottimizzazione dei buchi in agenda</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="#3b82f6" /> Gestione delle cabine e macchinari</li>
              </ul>
            </div>
            <div style={{ flex: '1 1 400px', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ height: '300px', borderRadius: '12px', background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), transparent)', border: '1px dashed rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={64} color="rgba(59, 130, 246, 0.3)" />
              </div>
            </div>
          </div>

          {/* Feature 2 (Reversed) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap-reverse' }}>
            <div style={{ flex: '1 1 400px', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ height: '300px', borderRadius: '12px', background: 'linear-gradient(45deg, rgba(168, 85, 247, 0.1), transparent)', border: '1px dashed rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={64} color="rgba(168, 85, 247, 0.3)" />
              </div>
            </div>
            <div style={{ flex: '1 1 400px' }}>
              <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '16px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', marginBottom: '24px' }}><BarChart2 size={32} /></div>
              <h3 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '16px', letterSpacing: '-0.5px' }}>Business Intelligence Reale</h3>
              <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '24px' }}>
                Specchietto non ti dice solo quanto hai guadagnato, ti dice *come* guadagnare di più. Analizza la fidelizzazione dei clienti e i margini operativi per servizio.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#e2e8f0', fontSize: '1.05rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}><Check size={20} color="#a855f7" /> Reportistiche avanzate e Heatmap</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}><Check size={20} color="#a855f7" /> Classifica servizi più profittevoli</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="#a855f7" /> Esportazione per il commercialista</li>
              </ul>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 400px' }}>
              <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginBottom: '24px' }}><SmartphoneNfc size={32} /></div>
              <h3 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '16px', letterSpacing: '-0.5px' }}>Basta No-Show con i Pagamenti</h3>
              <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '24px' }}>
                Abitua i tuoi clienti al rispetto del tuo tempo. Grazie all'integrazione nativa (in arrivo) potrai richiedere una caparra o bloccare i furbetti che disdicono all'ultimo minuto.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#e2e8f0', fontSize: '1.05rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}><Check size={20} color="#10b981" /> Depositi cauzionali personalizzabili</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}><Check size={20} color="#10b981" /> Tokenizzazione carte di credito</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="#10b981" /> Blacklist automatica</li>
              </ul>
            </div>
            <div style={{ flex: '1 1 400px', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ height: '300px', borderRadius: '12px', background: 'linear-gradient(45deg, rgba(16, 185, 129, 0.1), transparent)', border: '1px dashed rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={64} color="rgba(16, 185, 129, 0.3)" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SOCIAL PROOF / TESTIMONIALS */}
      <section style={{ padding: '80px 4%', position: 'relative', zIndex: 10, backgroundColor: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 16px 0', letterSpacing: '-1px' }}>Chi lo usa non torna indietro</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {[...Array(t.rating)].map((_, idx) => <Star key={idx} size={18} color="#eab308" fill="#eab308" />)}
              </div>
              <p style={{ fontSize: '1.1rem', color: '#e2e8f0', fontStyle: 'italic', marginBottom: '24px', flex: 1 }}>"{t.text}"</p>
              <div>
                <strong style={{ display: 'block', color: '#fff', fontSize: '1.1rem' }}>{t.name}</strong>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="piani" style={{ padding: '120px 4%', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '2.8rem', fontWeight: '800', margin: '0 0 16px 0', letterSpacing: '-1px' }}>Scegli la grandezza del tuo Salone</h2>
          <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>Prezzi chiari e trasparenti, senza brutte sorprese. Puoi passare al piano superiore in qualsiasi momento.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', maxWidth: '1100px', margin: '0 auto', alignItems: 'center' }}>
          {PRICING_PLANS.map((plan) => (
            <div key={plan.id} className="glass-card" style={{ 
              padding: '40px 32px', 
              position: 'relative',
              border: plan.recommended ? `2px solid ${plan.color}` : '1px solid rgba(255,255,255,0.1)',
              transform: plan.recommended ? 'scale(1.05)' : 'scale(1)',
              zIndex: plan.recommended ? 2 : 1,
              background: plan.recommended ? 'linear-gradient(180deg, rgba(168, 85, 247, 0.1) 0%, rgba(10, 10, 16, 0.9) 100%)' : 'var(--glass-bg)'
            }}>
              {plan.recommended && (
                <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: plan.color, color: '#fff', padding: '4px 16px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '800' }}>
                  SCELTA POPOLARE
                </div>
              )}
              <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px', color: plan.color }}>{plan.name}</h3>
              <p style={{ color: '#94a3b8', minHeight: '48px', marginBottom: '24px' }}>{plan.desc}</p>
              <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{ fontSize: '3rem', fontWeight: '900', lineHeight: '1', color: '#fff' }}>€{plan.price}</span>
                <span style={{ color: '#94a3b8', paddingBottom: '8px' }}>/mese</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {plan.features.map((feature, i) => (
                  <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', color: '#e2e8f0' }}>
                    <Check size={20} color={plan.color} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '1rem' }}>{feature}</span>
                  </li>
                ))}
              </ul>
              <a href="#early-access" className="glow-button" style={{ 
                display: 'block', textAlign: 'center', textDecoration: 'none', padding: '16px', fontSize: '1.1rem',
                background: plan.recommended ? plan.color : 'rgba(255,255,255,0.05)',
                boxShadow: plan.recommended ? `0 0 20px ${plan.color}66` : 'none'
              }}>
                {plan.recommended ? 'Inizia Ora con Pro' : 'Seleziona Piano'}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* LEAD FORM / CALL TO ACTION */}
      <section id="early-access" style={{ padding: '120px 4%', position: 'relative', zIndex: 10 }}>
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 4%', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,92,130,0.05) 100%)', border: '1px solid rgba(255,92,130,0.2)' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px', letterSpacing: '-1px' }}>Pronto a scalare il tuo salone?</h2>
          <p style={{ color: '#94a3b8', fontSize: '1.15rem', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px' }}>
            Compila il modulo per essere ricontattato. Inizieremo con una demo gratuita di 14 giorni per farti toccare con mano le potenzialità di Specchietto.
          </p>

          {submitted ? (
            <div className="animate-fade-up" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', borderRadius: '16px', padding: '32px' }}>
              <Check size={48} style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.4rem', margin: '0 0 8px 0' }}>Richiesta Inviata con Successo!</h3>
              <p style={{ margin: 0, color: '#059669' }}>Un nostro consulente ti contatterà nelle prossime 24 ore.</p>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
              <input value={leadForm.restaurant_name} onChange={(e) => setLeadForm({ ...leadForm, restaurant_name: e.target.value })} placeholder="Nome del salone" required style={inputStyleDark} />
              <input value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} placeholder="Il tuo nome e cognome" required style={inputStyleDark} />
              <input type="email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} placeholder="La tua email principale" required style={inputStyleDark} />
              <input type="tel" value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} placeholder="Telefono" style={inputStyleDark} />
              <button type="submit" disabled={submitting} className="glow-button" style={{ gridColumn: '1 / -1', padding: '18px', fontSize: '1.1rem', marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <Mail size={20} /> {submitting ? 'Invio in corso...' : 'Inizia la Prova Gratuita'}
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
          {[
            { q: 'Posso importare i miei clienti dal vecchio gestionale?', a: 'Certamente! Il nostro team di supporto ti aiuterà gratuitamente a importare la tua anagrafica clienti e le tue prenotazioni future in formato Excel o CSV.' },
            { q: 'Devo scaricare un programma sul PC?', a: 'No, Specchietto funziona in cloud. Puoi aprirlo da Chrome, Safari, iPad o tramite la nostra WebApp sul tuo smartphone.' },
            { q: 'I clienti devono scaricare un\'app per prenotare?', a: 'Nessuna app richiesta! I tuoi clienti cliccheranno il link (che puoi mettere su Instagram o WhatsApp) e si aprirà una pagina web bellissima e veloce per prenotare.' },
            { q: 'Quanto ci vuole per configurare il tutto?', a: 'Meno di 10 minuti. Il nostro onboarding è facilissimo e ti permette di iniziare ad accettare prenotazioni fin dal primo giorno.' }
          ].map((f, i) => (
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
      <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '64px 4% 32px', color: '#64748b' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '64px', maxWidth: '1100px', margin: '0 auto', marginBottom: '64px' }}>
          <div style={{ flex: '2 1 300px' }}>
            <strong style={{ color: '#fff', fontSize: '1.4rem', display: 'block', marginBottom: '16px' }}>Specchietto.</strong>
            <p style={{ lineHeight: '1.6', maxWidth: '300px' }}>Il software gestionale intelligente dedicato esclusivamente a Parrucchieri, Centri Estetici e Barber Shop.</p>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <strong style={{ color: '#fff', display: 'block', marginBottom: '16px' }}>Prodotto</strong>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><a href="#funzionalita" style={{ color: '#94a3b8', textDecoration: 'none' }}>Funzionalità</a></li>
              <li><a href="#piani" style={{ color: '#94a3b8', textDecoration: 'none' }}>Piani e Prezzi</a></li>
              <li><a href="#/prenota?business=salone-prova" style={{ color: '#94a3b8', textDecoration: 'none' }}>Demo Prenotazioni</a></li>
            </ul>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <strong style={{ color: '#fff', display: 'block', marginBottom: '16px' }}>Azienda</strong>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><a href="#faq" style={{ color: '#94a3b8', textDecoration: 'none' }}>FAQ</a></li>
              <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Contattaci</a></li>
            </ul>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '32px' }}>
          &copy; {new Date().getFullYear()} Specchietto by Alta-Mente. Tutti i diritti riservati.
        </div>
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
