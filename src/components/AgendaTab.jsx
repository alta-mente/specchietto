import { useState, useEffect } from 'react';

const inputStyle = {
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '0.85rem'
};

const STATUS_LABELS = {
  pending: 'In attesa',
  accepted: 'Confermato',
  arrived: 'Arrivato',
  completed: 'Completato',
  noshow: 'No-show',
  declined: 'Rifiutato',
  cancelled: 'Annullato'
};

const todayIso = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

export const AgendaTab = ({ sync }) => {
  const [resourceId, setResourceId] = useState('');
  const [date, setDate] = useState(todayIso());
  const [serviceId, setServiceId] = useState('');
  const [slots, setSlots] = useState(null);
  const [searching, setSearching] = useState(false);
  const [bookingTime, setBookingTime] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    if (!resourceId && sync.resources.length > 0) setResourceId(sync.resources[0].id);
  }, [sync.resources, resourceId]);

  useEffect(() => {
    if (!serviceId && sync.services.length > 0) setServiceId(sync.services[0].id);
  }, [sync.services, serviceId]);

  const handleSearch = async () => {
    if (!resourceId || !serviceId || !date) return;
    setSearching(true);
    setSlots(null);
    const result = await sync.fetchAvailability(resourceId, date, serviceId);
    setSlots(result);
    setSearching(false);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) return;
    setBookingError('');
    const { success, error } = await sync.createAppointment({
      resourceId, serviceId, customerName: customerName.trim(), customerPhone: customerPhone.trim(), date, time: bookingTime
    });
    if (success) {
      setBookingTime(null);
      setCustomerName('');
      setCustomerPhone('');
      handleSearch();
    } else {
      setBookingError(error || 'Errore durante la prenotazione.');
    }
  };

  const dayAppointments = sync.appointments
    .filter(a => a.resource_id === resourceId && a.date === date)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  return (
    <div style={{ maxWidth: '800px' }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Agenda</h2>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={resourceId} onChange={(e) => setResourceId(e.target.value)} style={inputStyle}>
          {sync.resources.length === 0 && <option value="">Nessun operatore</option>}
          {sync.resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={inputStyle}>
          {sync.services.length === 0 && <option value="">Nessun servizio</option>}
          {sync.services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>)}
        </select>
        <button
          onClick={handleSearch}
          disabled={!resourceId || !serviceId || searching}
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          {searching ? 'Cerco...' : 'Cerca disponibilità'}
        </button>
      </div>

      {slots !== null && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '10px', color: '#475569' }}>
            Slot liberi per {sync.services.find(s => s.id === serviceId)?.name} il {date}
          </div>
          {slots.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Nessuno slot disponibile per questa data.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {slots.map(t => (
                <button
                  key={t}
                  onClick={() => { setBookingTime(t); setBookingError(''); }}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer',
                    border: bookingTime === t ? '2px solid #0f172a' : '1px solid #cbd5e1',
                    backgroundColor: bookingTime === t ? '#0f172a' : '#fff',
                    color: bookingTime === t ? '#fff' : '#0f172a'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {bookingTime && (
            <form onSubmit={handleBook} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem' }}>Prenota le <strong>{bookingTime}</strong> per:</span>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome cliente" style={inputStyle} required />
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Telefono" style={inputStyle} />
              <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
                Conferma prenotazione
              </button>
              {bookingError && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{bookingError}</span>}
            </form>
          )}
        </div>
      )}

      <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Prenotazioni del giorno</h3>
      {dayAppointments.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Nessuna prenotazione per questa data.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dayAppointments.map(a => (
            <div key={a.id} style={{
              backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
              padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'
            }}>
              <div>
                <strong>{a.time}</strong> — {a.customer_name}
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{a.service_name} ({a.duration_minutes} min) • {STATUS_LABELS[a.status] || a.status}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {a.status === 'pending' && (
                  <button onClick={() => sync.updateAppointmentStatus(a.id, 'accepted')} style={{ fontSize: '0.75rem', padding: '5px 10px', borderRadius: '6px', border: '1px solid #3498db', color: '#3498db', background: 'none', cursor: 'pointer' }}>Conferma</button>
                )}
                {a.status === 'accepted' && (
                  <button onClick={() => sync.updateAppointmentStatus(a.id, 'arrived')} style={{ fontSize: '0.75rem', padding: '5px 10px', borderRadius: '6px', border: '1px solid #3498db', color: '#3498db', background: 'none', cursor: 'pointer' }}>Arrivato</button>
                )}
                {a.status === 'arrived' && (
                  <button onClick={() => sync.updateAppointmentStatus(a.id, 'completed')} style={{ fontSize: '0.75rem', padding: '5px 10px', borderRadius: '6px', border: '1px solid #16a34a', color: '#16a34a', background: 'none', cursor: 'pointer' }}>Completa</button>
                )}
                {['pending', 'accepted'].includes(a.status) && (
                  <button onClick={() => sync.updateAppointmentStatus(a.id, 'declined', 'Annullato dal gestionale')} style={{ fontSize: '0.75rem', padding: '5px 10px', borderRadius: '6px', border: '1px solid #ef4444', color: '#ef4444', background: 'none', cursor: 'pointer' }}>Rifiuta</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
