import { useState } from 'react';
import { ResourcesTab } from './ResourcesTab';
import { ServicesTab } from './ServicesTab';
import { AgendaTab } from './AgendaTab';

const TABS = [
  { id: 'agenda', label: 'Calendario' },
  { id: 'resources', label: 'Team' },
  { id: 'services', label: 'Servizi' }
];

const TenantSwitcher = ({ sync }) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setCreating(true);
    setError('');
    const { success, error: err } = await sync.createRestaurant(name.trim(), slug.trim());
    if (!success) setError(err || 'Errore durante la creazione.');
    setCreating(false);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '480px' }}>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Scegli un salone da gestire</h2>

      {sync.restaurants.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <select
            defaultValue=""
            onChange={(e) => e.target.value && sync.switchRestaurant(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.85rem' }}
          >
            <option value="" disabled>Seleziona un salone esistente...</option>
            {sync.restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>Oppure creane uno nuovo:</p>
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome salone" style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug (es. salone-prova)" style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
        <button type="submit" disabled={creating} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
          {creating ? 'Creo...' : '+ Crea salone'}
        </button>
        {error && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{error}</span>}
      </form>
    </div>
  );
};

export const Dashboard = ({ sync, onLogout }) => {
  const [activeTab, setActiveTab] = useState('agenda');
  const isSuperAdmin = sync.user?.role === 'super_admin';
  const needsTenantSelection = isSuperAdmin && !sync.restaurantId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'sans-serif' }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
        borderBottom: '1px solid #e2e8f0',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <strong style={{ fontSize: '1.1rem' }}>Specchietto</strong>
          {!needsTenantSelection && (
            <nav style={{ display: 'flex', gap: '4px' }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: activeTab === tab.id ? '700' : '500',
                    backgroundColor: activeTab === tab.id ? '#0f172a' : 'transparent',
                    color: activeTab === tab.id ? '#fff' : '#334155'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isSuperAdmin && sync.restaurantId && (
            <button
              onClick={() => sync.switchRestaurant('')}
              style={{ border: '1px solid #e2e8f0', background: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Cambia salone
            </button>
          )}
          <button
            onClick={onLogout}
            style={{ border: '1px solid #e2e8f0', background: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Esci
          </button>
        </div>
      </header>

      <main style={{ flex: 1, overflow: 'auto', padding: needsTenantSelection ? '0' : '24px', backgroundColor: '#f8fafc' }}>
        {needsTenantSelection ? (
          <TenantSwitcher sync={sync} />
        ) : (
          <>
            {activeTab === 'agenda' && <AgendaTab sync={sync} />}
            {activeTab === 'resources' && <ResourcesTab sync={sync} />}
            {activeTab === 'services' && <ServicesTab sync={sync} />}
          </>
        )}
      </main>
    </div>
  );
};
