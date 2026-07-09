import { useState, useEffect, useCallback } from 'react';
import { Save, Store, Clock, Globe, Code, Palette, Image as ImageIcon, Mail, CreditCard, CheckCircle2, AlertTriangle, Loader } from 'lucide-react';

export const SettingsTab = ({ sync }) => {
  const [activeSection, setActiveSection] = useState('general');
  const [saving, setSaving] = useState(false);

  // --- Pagamenti (Stripe) ---
  const [stripeStatus, setStripeStatus] = useState(null); // { connected, onboarded } | null = ancora in caricamento
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [savingPayments, setSavingPayments] = useState(false);

  const loadStripeStatus = useCallback(async () => {
    try {
      const status = await sync.getStripeConnectStatus();
      setStripeStatus(status);
    } catch (e) {
      setStripeStatus({ connected: false, onboarded: false });
    }
  }, [sync]);

  useEffect(() => { loadStripeStatus(); }, [loadStripeStatus]);

  const handleConnectStripe = async () => {
    setConnecting(true);
    setConnectError('');
    try {
      const url = await sync.startStripeConnectOnboarding();
      window.location.href = url;
    } catch (e) {
      setConnectError(e.message || 'Errore nel collegamento con Stripe.');
      setConnecting(false);
    }
  };

  const handleSavePaymentSettings = async (e) => {
    e.preventDefault();
    setSavingPayments(true);
    const enabled = e.target.stripe_enabled.checked;
    const type = e.target.stripe_type.value;
    const amount = e.target.stripe_amount.value;
    await sync.saveSettings({
      stripe_enabled: enabled ? '1' : '0',
      stripe_type: type,
      stripe_amount: amount
    });
    setSavingPayments(false);
    alert('Impostazioni Stripe salvate!');
  };

  // Settings State
  const restaurant = sync.restaurants.find(r => r.id === sync.restaurantId) || {};
  const [formLogo, setFormLogo] = useState('');
  const [formPrimary, setFormPrimary] = useState('#FF5C82');
  const [formAccent, setFormAccent] = useState('#a855f7');
  
  const [formEmail, setFormEmail] = useState('');
  const [formLeadTime, setFormLeadTime] = useState('Nessun preavviso');
  const [formSlotInterval, setFormSlotInterval] = useState('Ogni 30 minuti');

  // Sync state with props
  useEffect(() => {
    setFormLogo(restaurant.logo || '');
    setFormPrimary(restaurant.primary_color || '#FF5C82');
    setFormAccent(restaurant.accent_color || '#a855f7');
    setFormEmail(sync.settings?.notification_email || '');
    setFormLeadTime(sync.settings?.booking_lead_time || 'Nessun preavviso');
    setFormSlotInterval(sync.settings?.booking_slot_interval || 'Ogni 30 minuti');
  }, [restaurant, sync.settings]);

  const handleSaveBranding = async () => {
    setSaving(true);
    await sync.updateBranding(formLogo, formPrimary, formAccent);
    setSaving(false);
  };

  const handleSaveBookingSettings = async () => {
    setSaving(true);
    await sync.saveSettings({
      notification_email: formEmail,
      booking_lead_time: formLeadTime,
      booking_slot_interval: formSlotInterval
    });
    setSaving(false);
  };

  const menuItems = [
    { id: 'general', label: 'Info & Brand', icon: <Palette size={18} /> },
    { id: 'hours', label: 'Orari Salone', icon: <Clock size={18} /> },
    { id: 'booking', label: 'Prenotazioni Online', icon: <Globe size={18} /> },
    { id: 'payments', label: 'Pagamenti', icon: <CreditCard size={18} /> },
    { id: 'integration', label: 'Integrazione Sito', icon: <Code size={18} /> }
  ];

  return (
    <div style={{ display: 'flex', gap: '32px', height: '100%', animation: 'fadeIn 0.3s ease' }}>
      
      {/* Sidebar impostazioni */}
      <div style={{ width: '240px', flexShrink: 0 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Impostazioni</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px',
                borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
                backgroundColor: activeSection === item.id ? '#ffffff' : 'transparent',
                color: activeSection === item.id ? '#fff' : '#94a3b8',
                fontWeight: activeSection === item.id ? '600' : '500',
                fontSize: '0.9rem',
                border: activeSection === item.id ? '1px solid #e2e8f0' : '1px solid transparent'
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="admin-card" style={{ flex: 1, padding: '32px', maxWidth: '600px' }}>
        
        {activeSection === 'general' && (
          <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#0f172a' }}>Personalizza il tuo Brand</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>Questi colori appariranno sulla tua pagina pubblica.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Nome Salone</label>
              <input type="text" readOnly value={restaurant.name || ''} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.9rem' }} />
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Contatta l'assistenza per modificare il nome.</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={16} /> URL Logo (Opzionale)
              </label>
              <input type="text" value={formLogo} onChange={e => setFormLogo(e.target.value)} placeholder="https://tuosito.com/logo.png" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.9rem' }} />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Colore Primario</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="color" value={formPrimary} onChange={e => setFormPrimary(e.target.value)} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }} />
                  <input type="text" value={formPrimary} onChange={e => setFormPrimary(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.9rem' }} />
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Colore Secondario</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="color" value={formAccent} onChange={e => setFormAccent(e.target.value)} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }} />
                  <input type="text" value={formAccent} onChange={e => setFormAccent(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.9rem' }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button onClick={handleSaveBranding} className="glow-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                <Save size={18} />
                {saving ? 'Salvataggio...' : 'Salva Modifiche Brand'}
              </button>
            </div>
          </div>
        )}

        {activeSection === 'booking' && (
          <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#0f172a' }}>Regole e Notifiche</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>Configura come ricevi le prenotazioni.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} /> Email per Notifiche
              </label>
              <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="Email dove ricevere le richieste" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.9rem' }} />
              <span style={{ fontSize: '0.8rem', color: '#475569' }}>Se vuoto, non riceverai notifiche via email.</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Preavviso minimo per prenotare</label>
              <select value={formLeadTime} onChange={e => setFormLeadTime(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.9rem' }}>
                <option value="Nessun preavviso">Nessun preavviso</option>
                <option value="1 ora prima">1 ora prima</option>
                <option value="2 ore prima">2 ore prima</option>
                <option value="24 ore prima">24 ore prima</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Intervallo slot temporali</label>
              <select value={formSlotInterval} onChange={e => setFormSlotInterval(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.9rem' }}>
                <option value="Ogni 15 minuti">Ogni 15 minuti</option>
                <option value="Ogni 30 minuti">Ogni 30 minuti</option>
                <option value="Ogni 60 minuti">Ogni 60 minuti</option>
              </select>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button onClick={handleSaveBookingSettings} className="glow-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                <Save size={18} />
                {saving ? 'Salvataggio...' : 'Salva Regole'}
              </button>
            </div>
          </div>
        )}

        {activeSection === 'payments' && (
          <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#0f172a' }}>Pagamenti</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>Collega il tuo account Stripe e configura acconti o penali no-show.</p>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#fafafa', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} /> Account Stripe del salone
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '16px' }}>
                Per incassare acconti online e link di pagamento devi collegare il tuo account Stripe: i pagamenti dei tuoi clienti arriveranno direttamente a te, non a Specchietto.
              </p>

              {stripeStatus === null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                  <Loader size={16} className="animate-spin" /> Verifica dello stato in corso...
                </div>
              )}

              {stripeStatus && stripeStatus.onboarded && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: '600', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={20} /> Account Stripe collegato e pronto a ricevere pagamenti.
                </div>
              )}

              {stripeStatus && !stripeStatus.onboarded && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: '600', fontSize: '0.9rem', marginBottom: '12px' }}>
                    <AlertTriangle size={18} />
                    {stripeStatus.connected ? 'Configurazione Stripe da completare.' : 'Nessun account Stripe collegato.'}
                  </div>
                  <button
                    onClick={handleConnectStripe}
                    disabled={connecting}
                    style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6366f1', color: '#fff', fontWeight: '600', cursor: connecting ? 'default' : 'pointer', opacity: connecting ? 0.7 : 1 }}
                  >
                    {connecting ? 'Reindirizzamento a Stripe...' : (stripeStatus.connected ? 'Completa la configurazione Stripe' : 'Collega il tuo account Stripe')}
                  </button>
                  {connectError && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '8px' }}>{connectError}</p>}
                </div>
              )}
            </div>

            <div style={{ padding: '20px', backgroundColor: '#fafafa', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1rem' }}>
                🔒 Protezione No-Show (Stripe)
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '16px' }}>Proteggi il tuo tempo richiedendo la carta di credito a garanzia o un deposito anticipato.</p>

              {sync.settings?.stripe_enabled === '1' && stripeStatus && !stripeStatus.onboarded && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', marginBottom: '16px' }}>
                  <AlertTriangle size={16} />
                  L'acquisizione carta è attiva ma il salone non ha ancora collegato Stripe: i clienti non potranno pagare finché non completi la configurazione qui sopra.
                </div>
              )}

              <form onSubmit={handleSavePaymentSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  <input type="checkbox" name="stripe_enabled" defaultChecked={sync.settings?.stripe_enabled === '1'} style={{ width: '18px', height: '18px' }} />
                  Attiva Acquisizione Carta (Stripe)
                </label>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>Tipo di Protezione</label>
                    <select name="stripe_type" defaultValue={sync.settings?.stripe_type || 'fee'} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <option value="fee">Solo Penale (Blocco Carta)</option>
                      <option value="deposit">Deposito Anticipato (Acconto)</option>
                    </select>
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>Importo (€ o %)</label>
                    <input type="number" name="stripe_amount" min="1" step="1" defaultValue={sync.settings?.stripe_amount || 15} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
                  </div>
                </div>

                <button type="submit" disabled={savingPayments} style={{ alignSelf: 'flex-start', padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6366f1', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
                  {savingPayments ? 'Salvataggio...' : 'Salva Impostazioni Stripe'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Manteniamo le altre sezioni per UI */}
        {activeSection === 'hours' && (
          <div className="animate-fade-up">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#0f172a' }}>Orari di Apertura Salone</h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '24px' }}>Imposta gli orari generali (Funzione dimostrativa in questa beta).</p>
            {['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'].map((day, i) => (
              <div key={day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: '500', color: '#334155', width: '100px' }}>{day}</span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {i === 0 || i === 6 ? (
                    <span style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: '500' }}>Chiuso</span>
                  ) : (
                    <>
                      <input type="time" defaultValue="09:00" style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.9rem' }} />
                      <span style={{ color: '#475569' }}>-</span>
                      <input type="time" defaultValue="19:00" style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.9rem' }} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'integration' && (
          <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#0f172a' }}>Integrazione col tuo sito web</h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 16px 0' }}>Copia questo codice e incollalo nel tuo sito web per mostrare il pulsante o il modulo di prenotazione direttamente ai tuoi clienti.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Pulsante di prenotazione (Link diretto)</label>
              <textarea 
                readOnly 
                value={`<a href="${window.location.origin}/#/prenota?business=${restaurant.slug || 'demo'}" target="_blank" style="background-color: ${formPrimary}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">Prenota Ora</a>`}
                style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'rgba(0,0,0,0.3)', color: '#0f172a', minHeight: '80px', resize: 'none', fontFamily: 'monospace' }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Widget integrato (iFrame)</label>
              <textarea 
                readOnly 
                value={`<iframe src="${window.location.origin}/#/prenota?business=${restaurant.slug || 'demo'}" width="100%" height="800" frameborder="0" style="border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>`}
                style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'rgba(0,0,0,0.3)', color: '#0f172a', minHeight: '80px', resize: 'none', fontFamily: 'monospace' }} 
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
