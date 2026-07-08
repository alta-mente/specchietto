import { useState, useEffect, useMemo, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { getBackendUrl } from '../services/backendUrl';
import { Sparkles, ArrowRight, Check, Calendar, Clock, User, Scissors } from 'lucide-react';

const backendUrl = getBackendUrl();

const STEPS = [
  { id: 'service', label: 'Servizio' },
  { id: 'resource', label: 'Operatore' },
  { id: 'addon', label: 'Potenzia' },
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

export const BookingPage = ({ businessSlug }) => {
  const [restaurant, setRestaurant] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [services, setServices] = useState([]);

  // Estrai brand dinamico (fallback a default)
  const brandPrimary = restaurant?.primary_color || '#FF5C82';
  const brandAccent = restaurant?.accent_color || '#a855f7';
  const brandLogo = restaurant?.logo;

  const ProgressHeader = ({ currentStepId, businessName }) => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStepId);
    return (
      <div style={{
        padding: '40px 24px 20px',
        background: 'rgba(10, 10, 16, 0.7)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        {brandLogo ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <img src={brandLogo} alt={businessName} style={{ maxHeight: '48px', objectFit: 'contain' }} />
          </div>
        ) : (
          <div style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '24px', color: '#fff', textAlign: 'center', letterSpacing: '-0.5px' }}>
            {businessName || 'Prenota un appuntamento'}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', maxWidth: '600px', margin: '0 auto' }}>
          {STEPS.map((step, idx) => (
            <div key={step.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '100%', height: '4px', borderRadius: '2px', marginBottom: '8px',
                background: idx <= currentIndex ? `linear-gradient(90deg, ${brandPrimary}, ${brandAccent})` : 'rgba(255,255,255,0.1)',
                boxShadow: idx === currentIndex ? `0 0 10px ${brandPrimary}80` : 'none',
                transition: 'all 0.3s ease'
              }} />
              <div style={{ fontSize: '0.75rem', color: idx <= currentIndex ? '#fff' : '#94a3b8', fontWeight: idx === currentIndex ? '700' : '500', transition: 'color 0.3s ease' }}>
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const [step, setStep] = useState('service');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedAddon, setSelectedAddon] = useState(null);
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
    services.filter(s => s.is_addon !== 1).forEach(s => {
      const cat = s.category || 'Altri servizi';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return groups;
  }, [services]);

  const addons = useMemo(() => services.filter(s => s.is_addon === 1), [services]);

  const handleSelectService = async (service) => {
    setSelectedService(service);
    setSelectedAddon(null);
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
    if (addons.length > 0) {
      setStep('addon');
    } else {
      setStep('datetime');
    }
  };

  const loadSlots = useCallback(async () => {
    if (!selectedService) return;
    setLoadingSlots(true);
    setSelectedTime(null);
    const targets = anyPreference ? eligibleResources : [selectedResource];
    const results = await Promise.all(targets.map(async (r) => {
      const res = await fetch(`${backendUrl}/api/resources/${r.id}/availability?date=${date}&service_id=${selectedService.id}${selectedAddon ? `&addon_id=${selectedAddon.id}` : ''}`);
      const data = await res.json();
      return { resourceId: r.id, slots: data.slots || [] };
    }));
    const map = {};
    results.forEach(({ resourceId, slots }) => {
      slots.forEach(t => { if (!map[t]) map[t] = resourceId; });
    });
    setSlotMap(map);
    setLoadingSlots(false);
  }, [selectedService, selectedAddon, selectedResource, anyPreference, eligibleResources, date]);

  useEffect(() => {
    if (step === 'datetime') loadSlots();
  }, [step, loadSlots]);

  const searchParams = new URLSearchParams(window.location.search);
  const source = searchParams.get('source') || 'direct';

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
        addon_id: selectedAddon?.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        date,
        time: selectedTime,
        notes: notes.trim(),
        source
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

  const inputStyle = { 
    padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)', 
    backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '1rem', 
    fontFamily: 'inherit', outline: 'none', width: '100%', transition: 'border-color 0.3s' 
  };

  if (notFound) {
    return <div style={{ minHeight: '100vh', backgroundColor: 'var(--ink)', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Salone non trovato.</div>;
  }
  if (!restaurant) {
    return <div style={{ minHeight: '100vh', backgroundColor: 'var(--ink)', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Caricamento...</div>;
  }

  if (confirmedAppointment) {
    return (
      <div style={{ backgroundColor: 'var(--ink)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="glass-card animate-fade-up" style={{ maxWidth: '480px', width: '100%', padding: '40px 32px', textAlign: 'center' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', background: `linear-gradient(135deg, ${brandPrimary}, ${brandAccent})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: `0 0 30px ${brandPrimary}4d`
          }}>
            <Check size={40} color="#fff" />
          </div>
          <h2 style={{ marginBottom: '12px', fontSize: '1.8rem', fontWeight: '800' }}>Richiesta Inviata!</h2>
          <p style={{ color: '#94a3b8', marginBottom: '32px', fontSize: '1.1rem' }}>
            Riceverai una conferma da {restaurant.name} a breve.
          </p>
          
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '24px', textAlign: 'left', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Scissors size={20} color={brandPrimary} />
              <div>
                <strong style={{ fontSize: '1.1rem', display: 'block' }}>{selectedService.name} {selectedAddon ? `+ ${selectedAddon.name}` : ''}</strong>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{selectedService.duration_minutes + (selectedAddon?.duration_minutes || 0)} min</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Calendar size={20} color={brandPrimary} />
              <div>
                <span style={{ display: 'block' }}>{formatFriendlyDate(date)}</span>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{selectedTime}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <User size={20} color={brandPrimary} />
              <span style={{ color: '#94a3b8' }}>Prenotato per: {customerName}</span>
            </div>
          </div>
          
          <button onClick={() => window.location.reload()} className="glow-button" style={{ width: '100%', padding: '16px', fontSize: '1.05rem', background: `linear-gradient(135deg, ${brandPrimary}, ${brandAccent})`, boxShadow: `0 0 20px ${brandPrimary}66` }}>
            Prenota un altro appuntamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--ink)', minHeight: '100vh', color: '#fff' }}>
      
      {/* Background blobs for premium feel */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '60vw', height: '60vw', background: `radial-gradient(circle, ${brandPrimary}33 0%, transparent 60%)`, filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', animation: 'blobScale 15s infinite ease-in-out' }}></div>
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', background: `radial-gradient(circle, ${brandAccent}33 0%, transparent 60%)`, filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', animation: 'blobScale 12s infinite ease-in-out reverse' }}></div>

      <ProgressHeader currentStepId={step} businessName={restaurant.name} />

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px', position: 'relative', zIndex: 10 }}>
        {step === 'service' && (
          <div className="animate-fade-up">
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '24px', letterSpacing: '-0.5px' }}>Scegli il servizio</h2>
            {services.length === 0 && <p style={{ color: '#94a3b8' }}>Nessun servizio disponibile al momento.</p>}
            {Object.entries(servicesByCategory).map(([category, list]) => (
              <div key={category} style={{ marginBottom: '32px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>{category}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {list.map(s => (
                    <div key={s.id} onClick={() => handleSelectService(s)} className="glass-card" style={{ padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '4px' }}>{s.name}</div>
                        <div style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} /> {s.duration_minutes} min
                        </div>
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '1.2rem', color: brandPrimary }}>€{s.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 'resource' && (
          <div className="animate-fade-up">
            <button onClick={() => setStep('service')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '24px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ← Cambia servizio
            </button>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '24px', letterSpacing: '-0.5px' }}>Con chi vuoi prenotare?</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div onClick={() => handleSelectResource(null)} className="glass-card" style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>✨</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '2px' }}>Nessuna preferenza</div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Il primo operatore disponibile</div>
                </div>
              </div>
              
              {eligibleResources.map(r => (
                <div key={r.id} onClick={() => handleSelectResource(r)} className="glass-card" style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `linear-gradient(135deg, ${brandPrimary}, ${brandAccent})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: '800' }}>
                    {initials(r.name)}
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{r.name}</div>
                </div>
              ))}
              {eligibleResources.length === 0 && <p style={{ color: '#94a3b8' }}>Nessun operatore disponibile per questo servizio.</p>}
            </div>
          </div>
        )}

        {step === 'addon' && (
          <div className="animate-fade-up">
            <button onClick={() => setStep('resource')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '24px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ← Indietro
            </button>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>Potenzia il tuo trattamento</h2>
            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Completa il tuo appuntamento aggiungendo un servizio extra.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {addons.map(a => (
                <div key={a.id} onClick={() => { setSelectedAddon(a); setStep('datetime'); }} className="glass-card" style={{ padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: selectedAddon?.id === a.id ? `1px solid ${brandPrimary}` : '1px solid var(--glass-border)' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '4px' }}>{a.name}</div>
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} /> +{a.duration_minutes} min
                    </div>
                  </div>
                  <div style={{ fontWeight: '800', fontSize: '1.2rem', color: brandPrimary }}>+€{a.price}</div>
                </div>
              ))}
            </div>
            
            <button onClick={() => { setSelectedAddon(null); setStep('datetime'); }} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}>
              No grazie, procedi
            </button>
          </div>
        )}

        {step === 'datetime' && (
          <div className="animate-fade-up">
            <button onClick={() => setStep(addons.length > 0 ? 'addon' : 'resource')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '24px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ← Indietro
            </button>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '24px', letterSpacing: '-0.5px' }}>Scegli data e ora</h2>
            
            <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
              <input type="date" min={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            </div>

            {loadingSlots ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ animation: 'float 2s infinite ease-in-out' }}>Cerco disponibilità...</div>
              </div>
            ) : sortedTimes.length === 0 ? (
              <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                Nessuno slot disponibile per questa data. Prova un altro giorno.
              </div>
            ) : (
              Object.entries(grouped).map(([label, times]) => times.length > 0 && (
                <div key={label} style={{ marginBottom: '32px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>{label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {times.map(t => (
                      <button
                        key={t}
                        onClick={() => { setSelectedTime(t); setStep('details'); }}
                        style={{
                          padding: '12px 24px', borderRadius: '12px', fontSize: '1.05rem', cursor: 'pointer',
                          border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: '600',
                          transition: 'all 0.2s', backdropFilter: 'blur(10px)'
                        }}
                        onMouseEnter={(e) => { 
                          e.currentTarget.style.background = `linear-gradient(135deg, ${brandPrimary}, ${brandAccent})`; 
                          e.currentTarget.style.borderColor = 'transparent';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => { 
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; 
                          e.currentTarget.style.borderColor = 'var(--glass-border)';
                          e.currentTarget.style.transform = 'translateY(0)';
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
          <div className="animate-fade-up">
            <button onClick={() => setStep('datetime')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '24px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ← Cambia data/ora
            </button>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '24px', letterSpacing: '-0.5px' }}>Conferma dati</h2>

            <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Sparkles size={20} color={brandPrimary} />
                <strong style={{ fontSize: '1.1rem' }}>{selectedService.name}</strong>
              </div>
              <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '32px' }}>
                <span>{formatFriendlyDate(date)} alle {selectedTime}</span>
                {!anyPreference && selectedResource && <span>Operatore: {selectedResource.name}</span>}
              </div>
            </div>

            <form onSubmit={handleSubmit} autoComplete="on" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" name="name" autoComplete="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome e cognome *" required style={inputStyle} />
              <input type="tel" name="tel" autoComplete="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Telefono *" required style={inputStyle} />
              <input type="email" name="email" autoComplete="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email (facoltativa)" style={inputStyle} />
              <textarea name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note (facoltative)" rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
              
              <button type="submit" disabled={submitting} className="glow-button" style={{ padding: '18px', fontSize: '1.1rem', marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: `linear-gradient(135deg, ${brandPrimary}, ${brandAccent})`, boxShadow: `0 0 20px ${brandPrimary}66` }}>
                {submitting ? 'Elaborazione...' : 'Conferma prenotazione'} <ArrowRight size={20} />
              </button>
              {submitError && <div style={{ color: '#ef4444', textAlign: 'center', marginTop: '8px' }}>{submitError}</div>}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
