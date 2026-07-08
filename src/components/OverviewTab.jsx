import { useMemo } from 'react';
import { Calendar, Users, Clock, DollarSign, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const STATUS_META = {
  pending: { label: 'In attesa', bg: '#fef3c7', text: '#92400e' },
  accepted: { label: 'Confermato', bg: '#dbeafe', text: '#1e40af' },
  arrived: { label: 'Arrivato', bg: '#ede9fe', text: '#5b21b6' },
  completed: { label: 'Completato', bg: '#d1fae5', text: '#065f46' },
  noshow: { label: 'No-show', bg: '#fee2e2', text: '#991b1b' },
  declined: { label: 'Rifiutato', bg: '#f1f5f9', text: '#64748b' },
  cancelled: { label: 'Annullato', bg: '#f1f5f9', text: '#64748b' }
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export const OverviewTab = ({ sync }) => {
  const { appointments, services, customers, resources } = sync;

  const stats = useMemo(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const todayStr = new Date(today.getTime() - offset).toISOString().split('T')[0];

    const todayAppointments = appointments.filter(a => a.date === todayStr && a.status !== 'cancelled' && a.status !== 'declined');
    const validAppointments = appointments.filter(a => a.status === 'completed' || a.status === 'arrived');
    
    // --- 1. Expected Revenue (Today) ---
    let expectedRevenue = 0;
    todayAppointments.forEach(app => {
      const service = services.find(s => s.id === app.service_id);
      if (service) expectedRevenue += Number(service.price) || 0;
    });

    // --- 2. Revenue by Service (All time valid) ---
    const serviceRevMap = {};
    validAppointments.forEach(app => {
      const srv = services.find(s => s.id === app.service_id);
      const name = srv ? srv.name : app.service_name || 'Altro';
      const price = srv ? Number(srv.price) : Number(app.price) || 0;
      serviceRevMap[name] = (serviceRevMap[name] || 0) + price;
    });
    const revenueByService = Object.entries(serviceRevMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 5); // Top 5

    // --- 3. Staff Performance (Appointments count) ---
    const staffCountMap = {};
    validAppointments.forEach(app => {
      const res = resources.find(r => r.id === app.resource_id);
      const name = res ? res.name : 'Altro';
      staffCountMap[name] = (staffCountMap[name] || 0) + 1;
    });
    const staffPerformance = Object.entries(staffCountMap).map(([name, appts]) => ({ name, appts }));

    // --- 4. Peak Hours Heatmap ---
    const hoursMap = {};
    validAppointments.forEach(app => {
      if (app.time) {
        const hour = app.time.split(':')[0] + ':00';
        hoursMap[hour] = (hoursMap[hour] || 0) + 1;
      }
    });
    const peakHours = Object.entries(hoursMap)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    // --- 5. Customer Retention ---
    let newCustomers = 0;
    let returningCustomers = 0;
    customers.forEach(c => {
      const count = appointments.filter(a => a.customer_phone === c.phone && (a.status === 'completed' || a.status === 'arrived')).length;
      if (count <= 1) newCustomers++;
      else returningCustomers++;
    });

    const upcoming = todayAppointments
      .filter(a => a.status === 'pending' || a.status === 'accepted' || a.status === 'arrived')
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, 5);

    return {
      todayAppointmentsCount: todayAppointments.length,
      expectedRevenue,
      totalCustomers: customers.length,
      upcoming,
      todayStr,
      revenueByService,
      staffPerformance,
      peakHours,
      retention: [
        { name: 'Nuovi (1 App.)', value: newCustomers },
        { name: 'Ricorrenti (2+)', value: returningCustomers }
      ]
    };
  }, [appointments, services, customers, resources]);

  const StatCard = ({ title, value, icon, subtitle }) => (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '500', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{value}</div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px' }}>{subtitle}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>Analytics Dashboard</h2>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>Monitora le performance e i ricavi del tuo salone.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <StatCard title="Appuntamenti Oggi" value={stats.todayAppointmentsCount} icon={<Calendar size={24} />} subtitle="Esclusi annullati" />
        <StatCard title="Incasso Previsto (Oggi)" value={`€${stats.expectedRevenue.toFixed(2)}`} icon={<DollarSign size={24} />} subtitle="Basato sui listini" />
        <StatCard title="Clienti Totali" value={stats.totalCustomers} icon={<Users size={24} />} subtitle="Rubrica" />
        <StatCard title="Tasso di Ritorno" value={stats.retention.reduce((acc, c) => acc + c.value, 0) > 0 ? `${Math.round((stats.retention[1].value / stats.retention.reduce((acc, c) => acc + c.value, 0)) * 100)}%` : '0%'} icon={<Activity size={24} />} subtitle="Clienti fidelizzati" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#0f172a' }}>Ricavi per Servizio (Top 5)</h3>
          {stats.revenueByService.length > 0 ? (
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.revenueByService} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                    {stats.revenueByService.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `€${val}`} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Dati insufficienti</div>
          )}
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#0f172a' }}>Fasce Orarie di Punta</h3>
          {stats.peakHours.length > 0 ? (
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.peakHours}>
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Appuntamenti" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Dati insufficienti</div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#0f172a' }}>Performance Staff (Appuntamenti)</h3>
          {stats.staffPerformance.length > 0 ? (
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.staffPerformance} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                  <XAxis type="number" allowDecimals={false} stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="appts" fill="#10b981" radius={[0, 4, 4, 0]} name="Appuntamenti" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Dati insufficienti</div>
          )}
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Prossimi Appuntamenti</h3>
          </div>
          {stats.upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
              <Clock size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>Nessun appuntamento imminente per oggi.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto' }}>
              {stats.upcoming.map(app => {
                const service = services.find(s => s.id === app.service_id);
                const resource = resources.find(r => r.id === app.resource_id);
                const status = STATUS_META[app.status] || STATUS_META.pending;

                return (
                  <div key={app.id} style={{ display: 'flex', alignItems: 'center', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', gap: '12px' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a', width: '45px', fontSize: '0.9rem' }}>{app.time}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.9rem' }}>{app.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                        {service?.name || 'Servizio'} • {resource?.name || 'Staff'}
                      </div>
                    </div>
                    <div style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '600', backgroundColor: status.bg, color: status.text }}>
                      {status.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
