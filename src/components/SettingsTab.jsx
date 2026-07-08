import { useState, useEffect } from 'react';
import { Save, Store, Clock, Globe, Code, Palette, Image as ImageIcon, Mail } from 'lucide-react';

export const SettingsTab = ({ sync }) => {
  const [activeSection, setActiveSection] = useState('general');
  const [saving, setSaving] = useState(false);

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
    { id: 'integration', label: 'Integrazione Sito', icon: <Code size={18} /> }
  ];

  return (
    <div style={{ display: 'flex', gap: '32px', height: '100%', animation: 'fadeIn 0.3s ease' }}>
      
      {/* Sidebar impostazioni */}
      <div style={{ width: '240px', flexShrink: 0 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>Impostazioni</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px',
                borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
                backgroundColor: activeSection === item.id ? 'var(--glass-bg)' : 'transparent',
                color: activeSection === item.id ? '#fff' : '#94a3b8',
                fontWeight: activeSection === item.id ? '600' : '500',
                fontSize: '0.9rem',
                border: activeSection === item.id ? '1px solid var(--glass-border)' : '1px solid transparent'
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="glass-card" style={{ flex: 1, padding: '32px', maxWidth: '600px' }}>
        
        {activeSection === 'general' && (
          <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#fff' }}>Personalizza il tuo Brand</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>Questi colori appariranno sulla tua pagina pubblica.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#cbd5e1' }}>Nome Salone</label>
              <input type="text" readOnly value={restaurant.name || ''} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#94a3b8', fontSize: '0.9rem' }} />
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Contatta l'assistenza per modificare il nome.</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={16} /> URL Logo (Opzionale)
              </label>
              <input type="text" value={formLogo} onChange={e => setFormLogo(e.target.value)} placeholder="https://tuosito.com/logo.png" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.9rem' }} />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#cbd5e1' }}>Colore Primario</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="color" value={formPrimary} onChange={e => setFormPrimary(e.target.value)} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }} />
                  <input type="text" value={formPrimary} onChange={e => setFormPrimary(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.9rem' }} />
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#cbd5e1' }}>Colore Secondario</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="color" value={formAccent} onChange={e => setFormAccent(e.target.value)} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }} />
                  <input type="text" value={formAccent} onChange={e => setFormAccent(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.9rem' }} />
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
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#fff' }}>Regole e Notifiche</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>Configura come ricevi le prenotazioni.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} /> Email per Notifiche
              </label>
              <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="Email dove ricevere le richieste" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.9rem' }} />
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Se vuoto, non riceverai notifiche via email.</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#cbd5e1' }}>Preavviso minimo per prenotare</label>
              <select value={formLeadTime} onChange={e => setFormLeadTime(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.9rem' }}>
                <option value="Nessun preavviso">Nessun preavviso</option>
                <option value="1 ora prima">1 ora prima</option>
                <option value="2 ore prima">2 ore prima</option>
                <option value="24 ore prima">24 ore prima</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#cbd5e1' }}>Intervallo slot temporali</label>
              <select value={formSlotInterval} onChange={e => setFormSlotInterval(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.9rem' }}>
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

        {/* Manteniamo le altre sezioni per UI */}
        {activeSection === 'hours' && (
          <div className="animate-fade-up">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#fff' }}>Orari di Apertura Salone</h3>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '24px' }}>Imposta gli orari generali (Funzione dimostrativa in questa beta).</p>
            {['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'].map((day, i) => (
              <div key={day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ fontWeight: '500', color: '#cbd5e1', width: '100px' }}>{day}</span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {i === 0 || i === 6 ? (
                    <span style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: '500' }}>Chiuso</span>
                  ) : (
                    <>
                      <input type="time" defaultValue="09:00" style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.9rem' }} />
                      <span style={{ color: '#94a3b8' }}>-</span>
                      <input type="time" defaultValue="19:00" style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.9rem' }} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'integration' && (
          <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#fff' }}>Integrazione col tuo sito web</h3>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 16px 0' }}>Copia questo codice e incollalo nel tuo sito web per mostrare il pulsante o il modulo di prenotazione direttamente ai tuoi clienti.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#cbd5e1' }}>Pulsante di prenotazione (Link diretto)</label>
              <textarea 
                readOnly 
                value={`<a href="${window.location.origin}/#/prenota?business=${restaurant.slug || 'demo'}" target="_blank" style="background-color: ${formPrimary}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">Prenota Ora</a>`}
                style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', minHeight: '80px', resize: 'none', fontFamily: 'monospace' }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#cbd5e1' }}>Widget integrato (iFrame)</label>
              <textarea 
                readOnly 
                value={`<iframe src="${window.location.origin}/#/prenota?business=${restaurant.slug || 'demo'}" width="100%" height="800" frameborder="0" style="border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>`}
                style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', minHeight: '80px', resize: 'none', fontFamily: 'monospace' }} 
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
