import { useState } from 'react';
import { Save, Store, Clock, Globe, Code } from 'lucide-react';

export const SettingsTab = ({ sync }) => {
  const [activeSection, setActiveSection] = useState('general');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 800);
  };

  const menuItems = [
    { id: 'general', label: 'Generali', icon: <Store size={18} /> },
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
                backgroundColor: activeSection === item.id ? '#e2e8f0' : 'transparent',
                color: activeSection === item.id ? '#0f172a' : '#64748b',
                fontWeight: activeSection === item.id ? '600' : '500',
                fontSize: '0.9rem'
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenuto principale */}
      <div style={{ flex: 1, backgroundColor: 'var(--glass-bg)', backdropFilter: 'blur(20px)', borderRadius: '16px', padding: '32px', boxShadow: 'none', maxWidth: '600px' }}>
        
        {activeSection === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#fff' }}>Informazioni Generali</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>Nome Salone</label>
              <input type="text" defaultValue={sync.restaurants.find(r => r.id === sync.restaurantId)?.name || ''} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>Indirizzo</label>
              <input type="text" placeholder="Es. Via Roma 1, Milano" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>Telefono Pubblico</label>
              <input type="tel" placeholder="Es. 333 1234567" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
            </div>

            <div style={{ marginTop: '16px' }}>
              <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
                <Save size={18} />
                {saving ? 'Salvataggio...' : 'Salva Modifiche'}
              </button>
            </div>
          </div>
        )}

        {activeSection === 'hours' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#fff' }}>Orari di Apertura Salone</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '24px' }}>Imposta gli orari generali in cui il salone è aperto ai clienti. Gli orari dei singoli membri dello staff possono essere gestiti nella tab "Team".</p>
            
            {['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'].map((day, i) => (
              <div key={day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: '500', color: '#334155', width: '100px' }}>{day}</span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {i === 0 || i === 6 ? ( // Lunedì e Domenica chiusi di default nel mockup
                    <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '500' }}>Chiuso</span>
                  ) : (
                    <>
                      <input type="time" defaultValue="09:00" style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                      <span style={{ color: '#94a3b8' }}>-</span>
                      <input type="time" defaultValue="19:00" style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                    </>
                  )}
                </div>
              </div>
            ))}

            <div style={{ marginTop: '24px' }}>
              <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
                <Save size={18} />
                {saving ? 'Salvataggio...' : 'Salva Orari'}
              </button>
            </div>
          </div>
        )}

        {activeSection === 'booking' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#fff' }}>Regole Prenotazione Online</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>Preavviso minimo per prenotare</label>
              <select style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                <option>Nessun preavviso</option>
                <option>1 ora prima</option>
                <option>2 ore prima</option>
                <option>24 ore prima</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>Intervallo slot temporali</label>
              <select style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                <option>Ogni 15 minuti</option>
                <option>Ogni 30 minuti</option>
                <option>Ogni 60 minuti</option>
              </select>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
                <Save size={18} />
                {saving ? 'Salvataggio...' : 'Salva Regole'}
              </button>
            </div>
          </div>
        )}

        {activeSection === 'integration' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#fff' }}>Integrazione col tuo sito web</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 16px 0' }}>Copia questo codice e incollalo nel tuo sito web per mostrare il pulsante o il modulo di prenotazione direttamente ai tuoi clienti.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>Pulsante di prenotazione (Link diretto)</label>
              <div style={{ position: 'relative' }}>
                <textarea 
                  readOnly 
                  value={`<a href="https://specchietto.it/#/prenota?business=${sync.restaurants.find(r => r.id === sync.restaurantId)?.slug || 'demo'}" target="_blank" style="background-color: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">Prenota Ora</a>`}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: 'var(--ink)', color: '#334155', minHeight: '80px', resize: 'none' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>Widget integrato (iFrame)</label>
              <div style={{ position: 'relative' }}>
                <textarea 
                  readOnly 
                  value={`<iframe src="https://specchietto.it/#/prenota?business=${sync.restaurants.find(r => r.id === sync.restaurantId)?.slug || 'demo'}" width="100%" height="600" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>`}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: 'var(--ink)', color: '#334155', minHeight: '80px', resize: 'none' }} 
                />
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
