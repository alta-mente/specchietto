import { useState } from 'react';
import { ResourcesTab } from './ResourcesTab';
import { ServicesTab } from './ServicesTab';
import { AgendaTab } from './AgendaTab';
import { ClientsTab } from './ClientsTab';
import { OverviewTab } from './OverviewTab';
import { SettingsTab } from './SettingsTab';
import { MarketingTab } from './MarketingTab';
import { LayoutDashboard, Calendar, Users, Scissors, Settings, Megaphone, LogOut, Briefcase, ChevronDown } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Panoramica', icon: <LayoutDashboard size={20} /> },
  { id: 'agenda', label: 'Calendario', icon: <Calendar size={20} /> },
  { id: 'clients', label: 'Clienti', icon: <Users size={20} /> },
  { id: 'resources', label: 'Team', icon: <Briefcase size={20} /> },
  { id: 'services', label: 'Servizi', icon: <Scissors size={20} /> },
  { id: 'marketing', label: 'Marketing', icon: <Megaphone size={20} /> },
  { id: 'settings', label: 'Impostazioni', icon: <Settings size={20} /> }
];

const CATEGORIES = [
  { value: 'hair_salon', label: 'Parrucchiere' },
  { value: 'barbershop', label: 'Barbiere' },
  { value: 'spa_wellness', label: 'Spa e Benessere' },
  { value: 'sports_padel', label: 'Sport e Padel' },
  { value: 'gym_yoga', label: 'Palestra e Yoga' },
  { value: 'massage_therapy', label: 'Massaggi' },
  { value: 'health_medical', label: 'Salute e Medicina' },
  { value: 'tutoring_lessons', label: 'Lezioni e Ripetizioni' },
  { value: 'beauty_studio', label: 'Centro Estetico' },
  { value: 'consulting', label: 'Consulenza' },
  { value: 'pet_grooming', label: 'Toelettatura' },
  { value: 'coworking', label: 'Spazi di Coworking' }
];

const TenantSwitcher = ({ sync }) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !category) {
      setError('Compila tutti i campi richiesti.');
      return;
    }
    setCreating(true);
    setError('');
    const { success, error: err } = await sync.createRestaurant(name.trim(), slug.trim(), category);
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
            <option value="" disabled>Seleziona un'attività esistente...</option>
            {sync.restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>Oppure crea una nuova attività:</p>
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome attività" style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug (es. centro-prova)" style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
        
        <select 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
        >
          <option value="" disabled>Seleziona la categoria...</option>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>

        <button type="submit" disabled={creating} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', marginTop: '4px' }}>
          {creating ? 'Creo...' : '+ Crea attività'}
        </button>
        {error && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{error}</span>}
      </form>
    </div>
  );
};

export const Dashboard = ({ sync, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const isSuperAdmin = sync.user?.role === 'super_admin';
  const needsTenantSelection = isSuperAdmin && !sync.restaurantId;

  if (needsTenantSelection) {
    return (
      <div style={{ height: '100%', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '480px' }}>
          <TenantSwitcher sync={sync} />
        </div>
      </div>
    );
  }

  const currentRestaurant = sync.restaurants?.find(r => r.id === sync.restaurantId);
  const restaurantName = currentRestaurant?.name || 'Salone';

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
      
      {/* Sidebar Navigation */}
      <aside style={{ 
        width: '260px', 
        backgroundColor: '#0f172a', 
        color: '#fff', 
        display: 'flex', 
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {/* Brand / Logo Area */}
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            S
          </div>
          <strong style={{ fontSize: '1.25rem', letterSpacing: '-0.5px' }}>Specchietto</strong>
        </div>

        {/* Salon Selector (if super admin) or Name */}
        <div style={{ padding: '0 20px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {isSuperAdmin && sync.restaurantId ? (
            <button 
              onClick={() => sync.switchRestaurant('')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: 'none', color: '#fff', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Gestione</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{restaurantName}</span>
              </div>
              <ChevronDown size={16} color="#94a3b8" />
            </button>
          ) : (
            <div style={{ padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{restaurantName}</span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: activeTab === tab.id ? '600' : '500',
                backgroundColor: activeTab === tab.id ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                color: activeTab === tab.id ? '#60a5fa' : '#94a3b8',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
              onMouseEnter={e => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={e => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* User / Logout */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={onLogout}
            style={{ 
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
              borderRadius: '8px', border: 'none', background: 'transparent', color: '#94a3b8',
              cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            <LogOut size={20} />
            Esci dall'account
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflow: 'auto', padding: '32px 40px', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', height: '100%' }}>
          {activeTab === 'overview' && <OverviewTab sync={sync} />}
          {activeTab === 'agenda' && <AgendaTab sync={sync} />}
          {activeTab === 'clients' && <ClientsTab sync={sync} />}
          {activeTab === 'resources' && <ResourcesTab sync={sync} />}
          {activeTab === 'services' && <ServicesTab sync={sync} />}
          {activeTab === 'marketing' && <MarketingTab sync={sync} />}
          {activeTab === 'settings' && <SettingsTab sync={sync} />}
        </div>
      </main>
      
    </div>
  );
};
