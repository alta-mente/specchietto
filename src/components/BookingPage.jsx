import { useState, useEffect, useMemo, useCallback } from 'react';
import { storageService } from '../services/storageService';

const backendUrl = 'http://localhost:3001';

const STEPS = [
  { id: 'service', label: 'Servizio' },
  { id: 'resource', label: 'Operatore' },
  { id: 'datetime', label: 'Data e ora' },
  { id: 'details', label: 'I tuoi dati' }
];

const todayIso = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

const formatFriendlyDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts.map(Number);
  const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const DAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const d = new Date(year, month - 1, day);
  return `${DAYS[d.getDay()]} ${day} ${MONTHS[month - 1]} ${year}`;
};

const initials = (name) => (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

const ProgressHeader = ({ currentStepId, businessName }) => {
  const currentIndex = STEPS.findIndex(s => s.id === currentStepId);
  return (
    <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
      <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px' }}>{businessName || 'Prenota un appuntamento'}</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {STEPS.map((step, idx) => (
          <div key={step.id} style={{ flex: 1 }}>
            <div style={{
              height: '4px', borderRadius: '2px', marginBottom: '6px',
              backgroundColor: idx <= currentIndex ? '#0f172a' : '#e2e8f0'
            }} />
            <div style={{ fontSize: '0.72rem', color: idx <= currentIndex ? '#0f172a' : '#94a3b8', fontWeight: idx === currentIndex ? '700' : '500' }}>
              {idx + 1}. {step.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const BookingPage = ({ businessSlug }) => {
  const [restaurant, setRestaurant] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [services, setServices] = useState([]);

  const [step, setStep] = useState('service');
  const [selectedService, setSelectedService] = useState(null);
  const [eligibleResources, setEligibleResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null); // null id = "nessuna preferenza"
  const [anyPreference, setAnyPreference] = useState(false);

  const [date, setDate] = useState(todayIso());
  const [slotMap, setSlotMap] = useState({}); // { time: resourceId }
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);

  const [customerName, setCustomerName] = useState(() => storageService.getItem('customer_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => storageService.getItem('customer_phone') || '');
  const [customerEmail, setCustomerEmail] = useState(() => storageService.getItem('customer_email') || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`${backendUrl}/api/restaurants/${businessSlug}`);
      if (!res.ok) { setNotFound(true); return; }
      const data = await res.json();
      setRestaurant(data);
      const svcRes = await fetch(`${backendUrl}/api/services?restaurant_id=${data.id}`);
      const svcData = await svcRes.json();
      setServices(svcData.filter(s => s.active !== 0));
    })();
  }, [businessSlug]);

  const servicesByCategory = useMemo(() => {
    const groups = {};
    services.forEach(s => {
      const cat = s.category || 'Altri servizi';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return groups;
  }, [services]);

  const handleSelectService = async (service) => {
    setSelectedService(service);
    setAnyPreference(false);
    setSelectedResource(null);
    const res = await fetch(`${backendUrl}/api/services/${service.id}/resources`);
    const data = await res.json();
    setEligibleResources(data);
    setStep('resource');
  };

  const handleSelectResource = (resource) => {
    setSelectedResource(resource);
    setAnyPreference(!resource);
    setStep('datetime');
  };

  const loadSlots = useCallback(async () => {
    if (!selectedService) return;
    setLoadingSlots(true);
    setSelectedTime(null);
    const targets = anyPreference ? eligibleResources : [selectedResource];
    const results = await Promise.all(targets.map(async (r) => {
      const res = await fetch(`${backendUrl}/api/resources/${r.id}/availability?date=${date}&service_id=${selectedService.id}`);
      const data = await res.json();
      return { resourceId: r.id, slots: data.slots || [] };
    }));
    const map = {};
    results.forEach(({ resourceId, slots }) => {
      slots.forEach(t => { if (!map[t]) map[t] = resourceId; });
    });
    setSlotMap(map);
    setLoadingSlots(false);
  }, [selectedService, selectedResource, anyPreference, eligibleResources, date]);

  useEffect(() => {
    if (step === 'datetime') loadSlots();
  }, [step, loadSlots]);

  const sortedTimes = Object.keys(slotMap).sort();
  const grouped = {
    Mattina: sortedTimes.filter(t => t < '13:00'),
    Pomeriggio: sortedTimes.filter(t => t >= '13:00' && t < '18:00'),
    Sera: sortedTimes.filter(t => t >= '18:00')
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    const resourceId = anyPreference ? slotMap[selectedTime] : selectedResource.id;
    const res = await fetch(`${backendUrl}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_id: restaurant.id,
        resource_id: resourceId,
        service_id: selectedService.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        date,
        time: selectedTime,
        notes: notes.trim()
      })
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setSubmitError(data.error || 'Errore durante la prenotazione. Riprova.');
      return;
    }
    storageService.setItem('customer_name', customerName.trim());
    storageService.setItem('customer_phone', customerPhone.trim());
    storageService.setItem('customer_email', customerEmail.trim());
    setConfirmedAppointment(data);
  };

  const inputStyle = { padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%' };
  const cardStyle = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'border-color 0.15s' };

  if (notFound) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Salone non trovato.</div>;
  }
  if (!restaurant) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Caricamento...</div>;
  }

  if (confirmedAppointment) {
    return (
      <div style={{ maxWidth: '480px', margin: '60px auto', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✓</div>
        <h2 style={{ marginBottom: '8px' }}>Richiesta inviata!</h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>
          Riceverai una conferma da {restaurant.name} a breve.
        </p>
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'left', fontSize: '0.9rem' }}>
          <div style={{ marginBottom: '8px' }}><strong>{selectedService.name}</strong> ({selectedService.duration_minutes} min)</div>
          <div style={{ marginBottom: '8px' }}>{formatFriendlyDate(date)} alle {selectedTime}</div>
          <div style={{ color: '#64748b' }}>Prenotato per: {customerName}</div>
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: '24px', padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer' }}
        >
          Prenota un altro appuntamento
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', minHeight: '100%', backgroundColor: '#f8fafc' }}>
      <ProgressHeader currentStepId={step} businessName={restaurant.name} />

      <div style={{ padding: '24px' }}>
        {step === 'service' && (
          <div>
            {services.length === 0 && <p style={{ color: '#94a3b8' }}>Nessun servizio disponibile al momento.</p>}
            {Object.entries(servicesByCategory).map(([category, list]) => (
              <div key={category} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{category}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {list.map(s => (
                    <div key={s.id} onClick={() => handleSelectService(s)} style={cardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '600' }}>{s.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.duration_minutes} min</div>
                        </div>
                        <div style={{ fontWeight: '700' }}>€{s.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 'resource' && (
          <div>
            <button onClick={() => setStep('service')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '16px', fontSize: '0.85rem' }}>← Cambia servizio</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div onClick={() => handleSelectResource(null)} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>✨</div>
                <div>
                  <div style={{ fontWeight: '600' }}>Nessuna preferenza</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Il primo operatore disponibile</div>
                </div>
              </div>
              {eligibleResources.map(r => (
                <div key={r.id} onClick={() => handleSelectResource(r)} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '700' }}>{initials(r.name)}</div>
                  <div style={{ fontWeight: '600' }}>{r.name}</div>
                </div>
              ))}
              {eligibleResources.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Nessun operatore disponibile per questo servizio al momento.</p>}
            </div>
          </div>
        )}

        {step === 'datetime' && (
          <div>
            <button onClick={() => setStep('resource')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '16px', fontSize: '0.85rem' }}>← Cambia operatore</button>
            <input type="date" min={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }} />

            {loadingSlots ? (
              <p style={{ color: '#94a3b8' }}>Cerco disponibilità...</p>
            ) : sortedTimes.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>Nessuno slot disponibile per questa data. Prova un altro giorno.</p>
            ) : (
              Object.entries(grouped).map(([label, times]) => times.length > 0 && (
                <div key={label} style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>{label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {times.map(t => (
                      <button
                        key={t}
                        onClick={() => { setSelectedTime(t); setStep('details'); }}
                        style={{
                          padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer',
                          border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#0f172a'
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {step === 'details' && (
          <div>
            <button onClick={() => setStep('datetime')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '16px', fontSize: '0.85rem' }}>← Cambia data/ora</button>

            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <strong>{selectedService.name}</strong> · {formatFriendlyDate(date)} alle {selectedTime}
              {!anyPreference && selectedResource && <div style={{ color: '#64748b', marginTop: '4px' }}>con {selectedResource.name}</div>}
            </div>

            <form onSubmit={handleSubmit} autoComplete="on" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" name="name" autoComplete="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome e cognome *" required style={inputStyle} />
              <input type="tel" name="tel" autoComplete="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Telefono *" required style={inputStyle} />
              <input type="email" name="email" autoComplete="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email (facoltativa)" style={inputStyle} />
              <textarea name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note (facoltative)" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              <button type="submit" disabled={submitting} style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>
                {submitting ? 'Invio...' : 'Conferma prenotazione'}
              </button>
              {submitError && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{submitError}</span>}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
