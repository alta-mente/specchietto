import { useMemo } from 'react';
import { Calendar, TrendingUp, Users, Clock, DollarSign } from 'lucide-react';

const STATUS_META = {
  pending: { label: 'In attesa', bg: '#fef3c7', text: '#92400e' },
  accepted: { label: 'Confermato', bg: '#dbeafe', text: '#1e40af' },
  arrived: { label: 'Arrivato', bg: '#ede9fe', text: '#5b21b6' },
  completed: { label: 'Completato', bg: '#d1fae5', text: '#065f46' },
  noshow: { label: 'No-show', bg: '#fee2e2', text: '#991b1b' },
  declined: { label: 'Rifiutato', bg: '#f1f5f9', text: '#64748b' },
  cancelled: { label: 'Annullato', bg: '#f1f5f9', text: '#64748b' }
};

export const OverviewTab = ({ sync }) => {
  const { appointments, services, customers, resources } = sync;

  const stats = useMemo(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const todayStr = new Date(today.getTime() - offset).toISOString().split('T')[0];

    const todayAppointments = appointments.filter(a => a.date === todayStr && a.status !== 'cancelled' && a.status !== 'declined');
    
    let expectedRevenue = 0;
    todayAppointments.forEach(app => {
      const service = services.find(s => s.id === app.service_id);
      if (service) {
        expectedRevenue += Number(service.price) || 0;
      }
    });

    const upcoming = todayAppointments
      .filter(a => a.status === 'pending' || a.status === 'accepted' || a.status === 'arrived')
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, 5); // Show next 5

    return {
      todayAppointmentsCount: todayAppointments.length,
      expectedRevenue,
      totalCustomers: customers.length,
      upcoming,
      todayStr
    };
  }, [appointments, services, customers]);

  const StatCard = ({ title, value, icon, subtitle }) => (
    <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{value}</div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{subtitle}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>Bentornato!</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Ecco un riepilogo della tua giornata: {stats.todayStr}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <StatCard 
          title="Appuntamenti Oggi" 
          value={stats.todayAppointmentsCount} 
          icon={<Calendar size={24} />} 
          subtitle="Esclusi annullati"
        />
        <StatCard 
          title="Incasso Previsto" 
          value={`€${stats.expectedRevenue.toFixed(2)}`} 
          icon={<DollarSign size={24} />} 
          subtitle="In base ai servizi prenotati"
        />
        <StatCard 
          title="Clienti Totali" 
          value={stats.totalCustomers} 
          icon={<Users size={24} />} 
          subtitle="Nel database"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Prossimi Appuntamenti</h3>
            <button style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}>Vedi tutti</button>
          </div>
          
          {stats.upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <Clock size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>Nessun appuntamento imminente per oggi.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.upcoming.map(app => {
                const service = services.find(s => s.id === app.service_id);
                const resource = resources.find(r => r.id === app.resource_id);
                const status = STATUS_META[app.status] || STATUS_META.pending;

                return (
                  <div key={app.id} style={{ display: 'flex', alignItems: 'center', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '12px', gap: '16px' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a', width: '50px' }}>{app.time}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.95rem' }}>{app.customer_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {service?.name || 'Servizio'} • {resource?.name || 'Staff'}
                      </div>
                    </div>
                    <div style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: status.bg, color: status.text }}>
                      {status.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#0f172a' }}>Attività Recenti</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb', marginTop: '6px' }} />
              <div>
                <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>Nuova prenotazione da <strong>Marco R.</strong></div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>10 min fa</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', marginTop: '6px' }} />
              <div>
                <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>App. completato per <strong>Laura B.</strong></div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>45 min fa</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', marginTop: '6px' }} />
              <div>
                <div style={{ fontSize: '0.85rem', color: '#0f172a' }}><strong>Giulia</strong> ha richiesto spostamento</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>2 ore fa</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
