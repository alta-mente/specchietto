import { useState, useMemo, useEffect } from 'react';
import { Bell, Calendar as CalendarIcon, User, CheckCircle, XCircle } from 'lucide-react';

const STATUS_META = {
  pending: { label: 'Da confermare', color: '#f59e0b', bg: '#fef3c7' },
  accepted: { label: 'Confermato', color: '#10b981', bg: '#d1fae5' },
  arrived: { label: 'Arrivato', color: '#8b5cf6', bg: '#ede9fe' }
};

export const MobileApp = ({ sync, onLogout }) => {
  const [activeTab, setActiveTab] = useState('requests');

  // Auto-refresh periodic for mobile if push notifications aren't there
  useEffect(() => {
    const interval = setInterval(() => {
      sync.refreshAppointments();
    }, 15000);
    return () => clearInterval(interval);
  }, [sync]);

  const { appointments, services, resources } = sync;

  const todayStr = useMemo(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  }, []);

  const pendingRequests = useMemo(() => {
    return appointments.filter(a => a.status === 'pending').sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date);
      if (dateDiff !== 0) return dateDiff;
      return a.time.localeCompare(b.time);
    });
  }, [appointments]);

  const todayAppointments = useMemo(() => {
    return appointments.filter(a => a.date === todayStr && (a.status === 'accepted' || a.status === 'arrived')).sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, todayStr]);

  const handleAction = async (id, status) => {
    await sync.updateAppointmentStatus(id, status);
  };

  const currentRestaurant = sync.restaurants?.find(r => r.id === sync.restaurantId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ padding: '20px 20px 16px 20px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
          {activeTab === 'requests' && 'Nuove Richieste'}
          {activeTab === 'today' && 'Appuntamenti di Oggi'}
          {activeTab === 'profile' && 'Profilo Salone'}
        </h1>
        {activeTab === 'requests' && pendingRequests.length > 0 && (
          <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>
            {pendingRequests.length}
          </span>
        )}
      </header>

      {/* CONTENT AREA */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '80px' }}>
        
        {/* TAB: REQUESTS */}
        {activeTab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <Bell size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '1.1rem' }}>Nessuna nuova richiesta in attesa.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Rilassati, ti avviseremo appena prenota qualcuno!</p>
              </div>
            ) : (
              pendingRequests.map(app => {
                const service = services.find(s => s.id === app.service_id);
                const resource = resources.find(r => r.id === app.resource_id);
                return (
                  <div key={app.id} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{app.customer_name}</div>
                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{app.customer_phone}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#2563eb' }}>{app.date.split('-').reverse().join('/')}</div>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>{app.time}</div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontSize: '0.9rem' }}><strong style={{ color: '#334155' }}>Servizio:</strong> {service?.name || '-'}</div>
                      <div style={{ fontSize: '0.9rem' }}><strong style={{ color: '#334155' }}>Staff:</strong> {resource?.name || '-'}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <button 
                        onClick={() => handleAction(app.id, 'declined')}
                        style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#ef4444', fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                      >
                        <XCircle size={20} /> Rifiuta
                      </button>
                      <button 
                        onClick={() => handleAction(app.id, 'accepted')}
                        style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                      >
                        <CheckCircle size={20} /> Accetta
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB: TODAY */}
        {activeTab === 'today' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {todayAppointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <CalendarIcon size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '1.1rem' }}>L'agenda di oggi è vuota.</p>
              </div>
            ) : (
              todayAppointments.map(app => {
                const service = services.find(s => s.id === app.service_id);
                const resource = resources.find(r => r.id === app.resource_id);
                const meta = STATUS_META[app.status];

                return (
                  <div key={app.id} style={{ display: 'flex', backgroundColor: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', gap: '16px', alignItems: 'center' }}>
                    <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0f172a', width: '56px', textAlign: 'center' }}>
                      {app.time}
                    </div>
                    <div style={{ flex: 1, borderLeft: '2px solid #f1f5f9', paddingLeft: '16px' }}>
                      <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#0f172a' }}>{app.customer_name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>{service?.name || '-'} • {resource?.name || '-'}</div>
                    </div>
                    {app.status === 'accepted' && (
                      <button 
                        onClick={() => handleAction(app.id, 'arrived')}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #10b981', backgroundColor: '#d1fae5', color: '#065f46', fontWeight: '700', fontSize: '0.8rem' }}
                      >
                        È qui
                      </button>
                    )}
                    {app.status === 'arrived' && (
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: meta.color, backgroundColor: meta.bg, padding: '4px 8px', borderRadius: '8px' }}>
                        In salone
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB: PROFILE */}
        {activeTab === 'profile' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px' }}>
              S
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '0 0 4px 0' }}>{currentRestaurant?.name || 'Salone'}</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 32px 0' }}>Admin: {sync.user?.email}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={onLogout}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #ef4444', backgroundColor: '#fef2f2', color: '#ef4444', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}
              >
                Esci dall'Account
              </button>
            </div>
          </div>
        )}

      </main>

      {/* BOTTOM NAVIGATION */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {[
          { id: 'requests', label: 'Richieste', icon: Bell, badge: pendingRequests.length },
          { id: 'today', label: 'Oggi', icon: CalendarIcon },
          { id: 'profile', label: 'Profilo', icon: User }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '12px 0', border: 'none', background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative', cursor: 'pointer',
              color: activeTab === tab.id ? '#2563eb' : '#94a3b8'
            }}
          >
            <div style={{ position: 'relative' }}>
              <tab.icon size={24} />
              {tab.badge > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-8px', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                  {tab.badge}
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: activeTab === tab.id ? '700' : '500' }}>{tab.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
};
