import { useState, useEffect } from 'react';
import { ShieldAlert, Users, TrendingUp, ChevronDown, CreditCard, MessageSquare, Phone, ExternalLink } from 'lucide-react';

const envVarStyle = {
  display: 'inline-block', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#f1f5f9',
  border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '0.85rem', color: '#0f172a'
};

const GuideStep = ({ children }) => (
  <li style={{ marginBottom: '8px', color: '#334155', fontSize: '0.9rem', lineHeight: 1.5 }}>{children}</li>
);

const IntegrationGuide = ({ id, icon, title, subtitle, status, open, onToggle, children }) => (
  <div className="admin-card" style={{ marginBottom: '12px', overflow: 'hidden' }}>
    <button
      onClick={() => onToggle(id)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        padding: '18px 20px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {icon}
        <div>
          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '1rem' }}>{title}</div>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {status && (
          <span style={{
            fontSize: '0.75rem', fontWeight: '600', padding: '4px 10px', borderRadius: '12px',
            backgroundColor: status === 'attivo' ? '#d1fae5' : status === 'prossimamente' ? '#fef3c7' : '#f1f5f9',
            color: status === 'attivo' ? '#065f46' : status === 'prossimamente' ? '#92400e' : '#475569'
          }}>
            {status === 'attivo' ? 'Attivo' : status === 'prossimamente' ? 'Prossimamente' : status}
          </span>
        )}
        <ChevronDown size={18} color="#94a3b8" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
    </button>
    {open && (
      <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ paddingTop: '16px' }}>{children}</div>
      </div>
    )}
  </div>
);

export const SuperAdminTab = ({ sync }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openGuide, setOpenGuide] = useState(null);
  const toggleGuide = (id) => setOpenGuide(prev => prev === id ? null : id);

  useEffect(() => {
    const load = async () => {
      const data = await sync.fetchSuperAdminRestaurants();
      setRestaurants(data);
      setLoading(false);
    };
    load();
  }, [sync]);

  const handlePlanChange = async (id, newPlan) => {
    const success = await sync.updateRestaurantPlan(id, newPlan);
    if (success) {
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, plan: newPlan } : r));
      if (sync.restaurantId === id) {
        // Force refresh current user's restaurant list to see the update immediately
        sync.refreshRestaurantsList();
      }
    } else {
      alert("Errore nell'aggiornamento del piano.");
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Caricamento dashboard SaaS...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <ShieldAlert size={28} color="#6366f1" />
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>Gestione SaaS & Piani</h2>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>Dashboard Super Admin per gestire gli abbonamenti dei saloni clienti.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="admin-card" style={{ padding: '20px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>Totale Saloni</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{restaurants.length}</div>
        </div>
        <div className="admin-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>Piano Pro/Premium</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>
            {restaurants.filter(r => r.plan === 'pro' || r.plan === 'premium').length}
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Salone</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Admin Email</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Iscrizione</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Stato</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Piano Abbonamento</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '16px', fontWeight: '600' }}>
                  {r.name}
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}>/{r.slug}</div>
                </td>
                <td style={{ padding: '16px', color: '#475569' }}>{r.admin_email || '—'}</td>
                <td style={{ padding: '16px', color: '#475569' }}>
                  {new Date(r.created_at).toLocaleDateString('it-IT')}
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600',
                    backgroundColor: r.active ? '#d1fae5' : '#fee2e2', 
                    color: r.active ? '#065f46' : '#991b1b' 
                  }}>
                    {r.active ? 'Attivo' : 'Sospeso'}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <select 
                    value={r.plan || 'starter'}
                    onChange={(e) => handlePlanChange(r.id, e.target.value)}
                    style={{ 
                      padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', 
                      backgroundColor: r.plan === 'premium' ? '#fef3c7' : r.plan === 'pro' ? '#e0e7ff' : '#f1f5f9',
                      fontWeight: '600', cursor: 'pointer'
                    }}
                  >
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                </td>
              </tr>
            ))}
            {restaurants.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  Nessun salone trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>Configurazione integrazioni piattaforma</h3>
        <p style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '0.9rem' }}>
          Chiavi e account a livello di piattaforma (un'unica configurazione nel <span style={envVarStyle}>.env</span> del backend, valida per tutti i saloni). I singoli saloni non devono ripetere questi passaggi, salvo dove indicato.
        </p>

        <IntegrationGuide
          id="stripe"
          icon={<CreditCard size={22} color="#6366f1" />}
          title="Pagamenti — Stripe Connect"
          subtitle="Acconti prenotazione online e link di pagamento dalla cassa"
          status="attivo"
          open={openGuide === 'stripe'}
          onToggle={toggleGuide}
        >
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <GuideStep>Crea un account Stripe (piattaforma) su <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer">dashboard.stripe.com/register</a>.</GuideStep>
            <GuideStep>Attiva <strong>Stripe Connect</strong> (Stripe → Connect → Impostazioni). È gratuito da attivare.</GuideStep>
            <GuideStep>Vai su Sviluppatori → Webhook → crea un endpoint su <span style={envVarStyle}>https://TUO-BACKEND/api/webhooks/stripe</span>.</GuideStep>
            <GuideStep>Nella configurazione del webhook attiva <strong>"Ascolta eventi sugli account collegati"</strong> (Connect) — senza questa opzione i pagamenti dei saloni non arriveranno al webhook.</GuideStep>
            <GuideStep>Seleziona gli eventi <span style={envVarStyle}>checkout.session.completed</span> e <span style={envVarStyle}>account.updated</span>.</GuideStep>
            <GuideStep>Copia la Secret key in <span style={envVarStyle}>STRIPE_SECRET_KEY</span> e il Signing secret del webhook in <span style={envVarStyle}>STRIPE_WEBHOOK_SECRET</span>.</GuideStep>
            <GuideStep>Ogni salone collega poi il <strong>proprio</strong> account Stripe da <em>Impostazioni → Pagamenti</em> nel suo pannello: i suoi incassi arrivano direttamente a lui, non alla piattaforma.</GuideStep>
          </ol>
        </IntegrationGuide>

        <IntegrationGuide
          id="telnyx"
          icon={<MessageSquare size={22} color="#0ea5e9" />}
          title="SMS — Telnyx"
          subtitle="Promemoria automatico 24h prima dell'appuntamento"
          status="attivo"
          open={openGuide === 'telnyx'}
          onToggle={toggleGuide}
        >
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <GuideStep>Crea un account su <a href="https://telnyx.com/sign-up" target="_blank" rel="noopener noreferrer">telnyx.com/sign-up</a> e aggiungi un metodo di pagamento (serve credito per inviare SMS).</GuideStep>
            <GuideStep>Vai su Numbers → Search & Buy e acquista un numero italiano con SMS abilitato.</GuideStep>
            <GuideStep>Vai su Messaging, crea un <strong>Messaging Profile</strong>, poi in My Numbers assegna il profilo al numero appena comprato.</GuideStep>
            <GuideStep>Vai su API Keys e copia la chiave in <span style={envVarStyle}>TELNYX_API_KEY</span>.</GuideStep>
            <GuideStep>Inserisci il numero comprato (formato internazionale, es. <span style={envVarStyle}>+393331234567</span>) in <span style={envVarStyle}>TELNYX_FROM_NUMBER</span>.</GuideStep>
          </ol>
          <p style={{ margin: '12px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Account unico di piattaforma, come per le email: il nome del salone compare nel testo del messaggio, nessuna configurazione richiesta ai singoli saloni.
          </p>
        </IntegrationGuide>

        <IntegrationGuide
          id="whatsapp"
          icon={<Phone size={22} color="#25D366" />}
          title="WhatsApp — Telnyx"
          subtitle="Notifiche automatiche via WhatsApp (in aggiunta a SMS ed email)"
          status="prossimamente"
          open={openGuide === 'whatsapp'}
          onToggle={toggleGuide}
        >
          <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#475569' }}>
            Non ancora implementato lato codice. A differenza dell'SMS, WhatsApp richiede una verifica Business su Meta e template di messaggio pre-approvati (fino a 24-48h di attesa) prima di poter inviare qualsiasi notifica automatica. Passaggi da completare quando si vorrà attivarlo:
          </p>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <GuideStep>Crea/verifica un <strong>account Meta Business Manager</strong> (richiesto da Meta per l'accesso a WhatsApp Business Platform).</GuideStep>
            <GuideStep>Nel Portale Telnyx: Messaging → WhatsApp → <strong>Connect WhatsApp Business Account</strong>, e completa la Embedded Signup con le credenziali Meta Business.</GuideStep>
            <GuideStep>Verifica un numero di telefono dedicato a WhatsApp (non può essere lo stesso già usato con WhatsApp personale).</GuideStep>
            <GuideStep>Crea i template di messaggio (es. promemoria appuntamento) e attendi l'approvazione di Meta (24-48h).</GuideStep>
            <GuideStep>Una volta approvati i template, l'invio via WhatsApp può essere implementato sullo stesso schema già usato per l'SMS (account unico di piattaforma).</GuideStep>
          </ol>
          <a href="https://developers.telnyx.com/docs/messaging/whatsapp/quickstart/index.md" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '0.85rem', color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>
            Guida completa Telnyx WhatsApp <ExternalLink size={14} />
          </a>
        </IntegrationGuide>
      </div>
    </div>
  );
};
