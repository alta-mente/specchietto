import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Users, Bell, Plus, Clock } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';

// Fresha-style pastel colors for appointment statuses
const STATUS_META = {
  pending: { label: 'In attesa', bg: '#fef08a', border: '#eab308', text: '#854d0e' },
  accepted: { label: 'Confermato', bg: '#bae6fd', border: '#38bdf8', text: '#075985' },
  arrived: { label: 'Arrivato', bg: '#e9d5ff', border: '#c084fc', text: '#581c87' },
  completed: { label: 'Completato', bg: '#bbf7d0', border: '#4ade80', text: '#14532d' },
  noshow: { label: 'No-show', bg: '#fecaca', border: '#f87171', text: '#7f1d1d' },
  declined: { label: 'Rifiutato', bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
  cancelled: { label: 'Annullato', bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' }
};

const AVATAR_COLORS = ['#f87171', '#60a5fa', '#a78bfa', '#2dd4bf', '#fb923c', '#f472b6', '#4ade80'];
const CLOSED_LIKE = ['declined', 'cancelled'];
const PX_PER_MIN = 1.6; // Slightly taller for better readability
const SNAP_MINUTES = 15;
const DEFAULT_START = 8 * 60; // 08:00
const DEFAULT_END = 20 * 60; // 20:00
const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const MONTH_SHORT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const MONTH_NAMES = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

const todayIso = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

const dateToIso = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseTimeToMinutes = (t) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const formatMinutesToTime = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(Math.round(mins) % 60).padStart(2, '0')}`;

const initials = (name) => (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

const formatFriendlyDate = (dateStr) => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts.map(Number);
  const DAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const d = new Date(year, month - 1, day);
  return `${DAYS[d.getDay()]} ${day} ${MONTH_NAMES[month - 1]} ${year}`;
};

const formatShortDate = (dateStr) => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts.map(Number);
  const d = new Date(year, month - 1, day);
  return `${WEEKDAY_SHORT[d.getDay()].toLowerCase()} ${day} ${MONTH_SHORT[month - 1].toLowerCase()}`;
};

const shiftDate = (dateStr, deltaDays) => {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return dateToIso(d);
};

const getWeekDates = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    dates.push(dateToIso(dd));
  }
  return dates;
};

// --- MODALS ---

const AppointmentDetailPanel = ({ appointment, resource, sync, onClose }) => {
  const meta = STATUS_META[appointment.status] || STATUS_META.pending;
  const [busy, setBusy] = useState(false);

  const runAction = async (status, reason) => {
    setBusy(true);
    await sync.updateAppointmentStatus(appointment.id, status, reason);
    setBusy(false);
    onClose();
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', width: '400px', maxWidth: '90vw',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {appointment.customer_name}
              {appointment.has_guarantee === 1 && <span title="Carta a garanzia / Deposito pagato" style={{ fontSize: '1rem' }}>💳</span>}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '2px' }}>{appointment.customer_phone}</div>
          </div>
          <span style={{
            fontSize: '0.75rem', fontWeight: '700', padding: '6px 12px', borderRadius: '999px',
            backgroundColor: meta.bg, color: meta.text, border: `1px solid ${meta.border}`
          }}>
            {meta.label}
          </span>
        </div>

        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: '8px', fontSize: '1rem', color: '#0f172a' }}><strong>{appointment.service_name}</strong> ({appointment.duration_minutes} min)</div>
          <div style={{ marginBottom: '8px', color: '#475569', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} /> {formatFriendlyDate(appointment.date)} alle {appointment.time}
          </div>
          <div style={{ color: '#475569', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} /> con {resource?.name || '—'}
          </div>
          {appointment.notes && <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', color: '#475569', fontSize: '0.9rem', fontStyle: 'italic' }}>"{appointment.notes}"</div>}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {appointment.status === 'pending' && (
            <button disabled={busy} onClick={() => runAction('accepted')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#38bdf8', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }}>Conferma</button>
          )}
          {appointment.status === 'accepted' && (
            <button disabled={busy} onClick={() => runAction('arrived')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#c084fc', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }}>Segna arrivato</button>
          )}
          {['arrived', 'completed'].includes(appointment.status) && !sync.transactions?.some(t => t.appointment_id === appointment.id) && (
            <button onClick={() => { onClose(); sync.onOpenCheckout(appointment); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#4ade80', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }}>Incassa</button>
          )}
          {sync.transactions?.some(t => t.appointment_id === appointment.id) && (
            <div style={{ flexBasis: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: '#166534', textAlign: 'center', fontWeight: '700', fontSize: '0.9rem' }}>✅ Pagato</div>
          )}
          
          {(appointment.status === 'accepted' || appointment.status === 'pending') && appointment.customer_phone && (
            <button onClick={() => {
              const text = encodeURIComponent(`Ciao ${appointment.customer_name},\nti ricordiamo il tuo appuntamento per "${appointment.service_name}" il ${formatFriendlyDate(appointment.date)} alle ${appointment.time}.\nA presto!`);
              window.open(`https://wa.me/${appointment.customer_phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
            }} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#25D366', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              WhatsApp
            </button>
          )}

          {['pending', 'accepted'].includes(appointment.status) && (
            <div style={{ flexBasis: '100%', display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button disabled={busy} onClick={() => {
                if (appointment.has_guarantee === 1) {
                  if (confirm(`Questo appuntamento è protetto da Stripe.\nVuoi addebitare la penale / trattenere il deposito di ${sync.settings?.stripe_amount || 15}€ sulla carta del cliente?`)) {
                    alert('Simulazione addebito Stripe effettuata con successo.');
                  }
                }
                runAction('noshow');
              }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #f87171', background: '#fff', color: '#f87171', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>No-show</button>
              <button disabled={busy} onClick={() => runAction('declined', 'Annullato dal gestionale')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>Rifiuta</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NewAppointmentModal = ({ draft, sync, onClose, onResourceChange }) => {
  const [resourceId, setResourceId] = useState(draft.resourceId || sync.resources[0]?.id || '');
  const [serviceId, setServiceId] = useState(sync.services[0]?.id || '');
  const [date, setDate] = useState(draft.date);
  const [time, setTime] = useState(draft.time || '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleResourceChange = (id) => {
    setResourceId(id);
    onResourceChange?.(id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resourceId || !serviceId || !time || !customerName.trim()) return;
    setSubmitting(true);
    setError('');
    const { success, error: err } = await sync.createAppointment({
      resourceId, serviceId, customerName: customerName.trim(), customerPhone: customerPhone.trim(), date, time
    });
    setSubmitting(false);
    if (success) onClose();
    else setError(err || 'Errore durante la prenotazione.');
  };

  const inputStyle = { padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', width: '100%', outline: 'none' };
  const fieldLabelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '6px' };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
    }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} style={{
        backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', width: '420px', maxWidth: '90vw',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '16px'
      }}>
        <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Nuovo Appuntamento</div>

        <div>
          <label style={fieldLabelStyle}>Operatore</label>
          <select value={resourceId} onChange={(e) => handleResourceChange(e.target.value)} style={inputStyle}>
            {sync.resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        
        <div>
          <label style={fieldLabelStyle}>Servizio</label>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={inputStyle}>
            {sync.services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={fieldLabelStyle}>Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={fieldLabelStyle}>Ora</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required style={inputStyle} />
          </div>
        </div>
        
        <div>
          <label style={fieldLabelStyle}>Cliente</label>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome e Cognome" required style={inputStyle} />
        </div>
        
        <div>
          <label style={fieldLabelStyle}>Telefono (Opzionale per Promemoria)</label>
          <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+39 333..." style={inputStyle} />
        </div>

        {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', padding: '8px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>{error}</div>}
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}>
            Annulla
          </button>
          <button type="submit" disabled={submitting} style={{ flex: 2, padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' }}>
            {submitting ? 'Salvataggio...' : 'Conferma Prenotazione'}
          </button>
        </div>
      </form>
    </div>
  );
};

const WaitlistModal = ({ sync, date, onClose }) => {
  const waitlistItems = sync.waitlist?.filter(w => w.date_requested === date && w.status === 'waiting') || [];

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', width: '400px', maxWidth: '90vw',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', maxHeight: '80vh', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} color="#eab308" /> Lista d'Attesa
          </h3>
          <span style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>
            {waitlistItems.length} richieste
          </span>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {waitlistItems.map(w => (
            <div key={w.id} style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: '#0f172a' }}>{w.customer_name}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px', marginTop: '4px' }}>Preferenza Orario: <strong>{w.time_preference}</strong></div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => {
                  const text = encodeURIComponent(`Ciao ${w.customer_name},\nsi è liberato un posto per oggi ${formatFriendlyDate(w.date_requested)}!\nVuoi prenotarlo?`);
                  window.open(`https://wa.me/${w.customer_phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
                }} style={{ flex: 1, padding: '8px', border: 'none', backgroundColor: '#25D366', color: '#fff', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '700', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                  Avvisa
                </button>
                <button onClick={() => sync.updateWaitlistStatus(w.id, 'notified')} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}>
                  Rimuovi
                </button>
              </div>
            </div>
          ))}
          {waitlistItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <Bell size={40} style={{ margin: '0 auto 16px auto', opacity: 0.2 }} />
              <p style={{ margin: 0 }}>Nessuna richiesta in coda per oggi.</p>
            </div>
          )}
        </div>

        <button onClick={onClose} style={{ marginTop: '20px', width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600' }}>
          Chiudi
        </button>
      </div>
    </div>
  );
};


// --- MAIN AGENDA COMPONENT ---

export const AgendaTab = ({ sync }) => {
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week'
  const [date, setDate] = useState(todayIso());
  const [selectedOperatorId, setSelectedOperatorId] = useState(''); // '' = tutti
  const [resourceHours, setResourceHours] = useState({});
  
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [newApptDraft, setNewApptDraft] = useState(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [lastResourceId, setLastResourceId] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (sync.resources.length === 0) return;
    (async () => {
      const entries = await Promise.all(sync.resources.map(async (r) => {
        const res = await fetch(`${sync.backendUrl}/api/resources/${r.id}/hours`);
        const data = res.ok ? await res.json() : [];
        return [r.id, data];
      }));
      setResourceHours(Object.fromEntries(entries));
    })();
  }, [sync.resources, sync.backendUrl]);

  const getRangeForDay = (resourceIds, dow) => {
    let ranges = [];
    resourceIds.forEach(rid => {
      const hours = (resourceHours[rid] || []).filter(h => h.day_of_week === dow);
      if (hours.length > 0) {
        ranges.push({
          open: Math.min(...hours.map(h => parseTimeToMinutes(h.open_time))),
          close: Math.max(...hours.map(h => parseTimeToMinutes(h.close_time)))
        });
      }
    });
    if (ranges.length === 0) return null;
    return { open: Math.min(...ranges.map(r => r.open)), close: Math.max(...ranges.map(r => r.close)) };
  };

  const columns = useMemo(() => {
    if (viewMode === 'day') {
      const dow = new Date(`${date}T12:00:00`).getDay();
      const operators = selectedOperatorId ? sync.resources.filter(r => r.id === selectedOperatorId) : sync.resources;
      
      return operators.map((r, idx) => {
        const appts = sync.appointments.filter(a => a.resource_id === r.id && a.date === date);
        return {
          key: r.id,
          date,
          avatarUrl: r.photo_url || null,
          avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          avatarLabel: initials(r.name),
          headerMain: r.name,
          headerSub: `${appts.filter(a => !CLOSED_LIKE.includes(a.status)).length} appuntamenti`,
          range: getRangeForDay([r.id], dow),
          appointments: appts,
          defaultResourceId: r.id
        };
      });
    }

    // Vista settimana
    const operators = selectedOperatorId ? sync.resources.filter(r => r.id === selectedOperatorId) : sync.resources;
    const operatorIds = operators.map(r => r.id);
    return getWeekDates(date).map((d) => {
      const dow = new Date(`${d}T12:00:00`).getDay();
      const appts = sync.appointments.filter(a => operatorIds.includes(a.resource_id) && a.date === d);
      return {
        key: d,
        date: d,
        avatarUrl: null,
        avatarColor: null,
        avatarLabel: null,
        headerMain: `${WEEKDAY_SHORT[dow]} ${d.split('-')[2]}`,
        headerSub: d === todayIso() ? 'Oggi' : MONTH_SHORT[parseInt(d.split('-')[1]) - 1],
        range: getRangeForDay(operatorIds, dow),
        appointments: appts,
        defaultResourceId: operators[0]?.id || ''
      };
    });
  }, [viewMode, date, selectedOperatorId, sync.resources, sync.appointments, resourceHours]);

  const { axisStart, axisEnd } = useMemo(() => {
    const opens = columns.map(c => c.range).filter(Boolean).map(r => r.open);
    const closes = columns.map(c => c.range).filter(Boolean).map(r => r.close);
    if (opens.length === 0) return { axisStart: DEFAULT_START, axisEnd: DEFAULT_END };
    const minOpen = Math.min(...opens) - 60; // 1 hour padding top
    const maxClose = Math.max(...closes) + 60; // 1 hour padding bottom
    return { axisStart: minOpen < 0 ? 0 : minOpen, axisEnd: maxClose > 1440 ? 1440 : maxClose };
  }, [columns]);

  const timelineHeight = (axisEnd - axisStart) * PX_PER_MIN;

  const hourMarks = useMemo(() => {
    const marks = [];
    const first = Math.ceil(axisStart / 60) * 60;
    for (let m = first; m <= axisEnd; m += 60) marks.push(m);
    return marks;
  }, [axisStart, axisEnd]);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const handleColumnClick = (column, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let minutes = axisStart + (e.clientY - rect.top) / PX_PER_MIN;
    minutes = Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
    minutes = Math.max(axisStart, Math.min(axisEnd - SNAP_MINUTES, minutes));
    setLastResourceId(column.defaultResourceId);
    setNewApptDraft({ resourceId: column.defaultResourceId, date: column.date, time: formatMinutesToTime(minutes) });
  };

  const headerRangeLabel = viewMode === 'day'
    ? formatShortDate(date)
    : (() => {
        const dates = getWeekDates(date);
        return `${formatShortDate(dates[0])} – ${formatShortDate(dates[6])}`;
      })();
      
  const waitlistCount = sync.waitlist?.filter(w => w.date_requested === date && w.status === 'waiting').length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', animation: 'fadeIn 0.3s ease' }}>
      
      {/* FRESHA-STYLE TOP TOOLBAR */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '16px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0',
        borderRadius: '16px 16px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          <button onClick={() => setDate(todayIso())} style={{ 
            padding: '8px 16px', borderRadius: '99px', border: '1px solid #e2e8f0', 
            backgroundColor: date === todayIso() ? '#f8fafc' : '#fff', 
            color: '#0f172a', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' 
          }}>
            Oggi
          </button>

          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: '99px', border: '1px solid #e2e8f0', padding: '4px' }}>
            <button onClick={() => setDate(d => shiftDate(d, viewMode === 'week' ? -7 : -1))} style={{ background: 'none', border: 'none', padding: '4px 8px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a', minWidth: '120px', textAlign: 'center' }}>
              {headerRangeLabel}
            </span>
            <button onClick={() => setDate(d => shiftDate(d, viewMode === 'week' ? 7 : 1))} style={{ background: 'none', border: 'none', padding: '4px 8px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={18} />
            </button>
          </div>
          
          {sync.resources.length > 0 && (
            <select
              value={selectedOperatorId}
              onChange={(e) => setSelectedOperatorId(e.target.value)}
              style={{ padding: '8px 16px', borderRadius: '99px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', backgroundColor: '#fff', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">Tutti i membri del team</option>
              {sync.resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '99px', overflow: 'hidden', backgroundColor: '#f8fafc', padding: '2px' }}>
            <button onClick={() => setViewMode('day')} style={{ padding: '6px 16px', border: 'none', borderRadius: '99px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', backgroundColor: viewMode === 'day' ? '#fff' : 'transparent', color: viewMode === 'day' ? '#0f172a' : '#64748b', boxShadow: viewMode === 'day' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              Giorno
            </button>
            <button onClick={() => setViewMode('week')} style={{ padding: '6px 16px', border: 'none', borderRadius: '99px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', backgroundColor: viewMode === 'week' ? '#fff' : 'transparent', color: viewMode === 'week' ? '#0f172a' : '#64748b', boxShadow: viewMode === 'week' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              Settimana
            </button>
          </div>

          <button onClick={() => setShowWaitlist(true)} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '99px', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#0f172a', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
            <Bell size={16} /> Lista d'Attesa
            {waitlistCount > 0 && (
              <span style={{ backgroundColor: '#ef4444', color: '#fff', borderRadius: '99px', padding: '2px 8px', fontSize: '0.75rem' }}>{waitlistCount}</span>
            )}
          </button>

          <button
            onClick={() => setNewApptDraft({ resourceId: lastResourceId || sync.resources[0]?.id || '', date, time: formatMinutesToTime(Math.max(DEFAULT_START, axisStart)) })}
            disabled={sync.resources.length === 0 || sync.services.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '99px', border: 'none', backgroundColor: '#0f172a', color: '#ffffff', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }}
          >
            <Plus size={18} /> Aggiungi
          </button>
        </div>
      </div>

      {/* TIMELINE GRID */}
      <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 16px 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {sync.resources.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center', color: '#64748b' }}>Aggiungi prima un membro del team nella sezione "Team".</div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', display: 'flex' }}>
            
            {/* TIME AXIS */}
            <div style={{ width: '60px', flexShrink: 0, borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', position: 'sticky', left: 0, zIndex: 10 }}>
              <div style={{ height: '70px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }} /> {/* Header spacer */}
              <div style={{ position: 'relative', height: timelineHeight }}>
                {hourMarks.map(m => (
                  <div key={m} style={{ position: 'absolute', top: (m - axisStart) * PX_PER_MIN - 9, right: '12px', fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>
                    {formatMinutesToTime(m)}
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMNS */}
            <div style={{ display: 'flex', flex: 1, minWidth: 'min-content' }}>
              {columns.map((col, idx) => {
                const isToday = col.date === todayIso();
                return (
                  <div key={col.key} style={{ minWidth: '220px', flex: 1, borderRight: idx < columns.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                    
                    {/* COLUMN HEADER */}
                    <div style={{
                      height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '0 16px',
                      borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 5,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}>
                      {col.avatarUrl ? (
                        <img src={col.avatarUrl} alt="" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : col.avatarColor ? (
                        <div style={{
                          width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                          backgroundColor: `${col.avatarColor}20`, color: col.avatarColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '800'
                        }}>
                          {col.avatarLabel}
                        </div>
                      ) : null}
                      <div style={{ textAlign: col.avatarColor ? 'left' : 'center' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: viewMode === 'week' && isToday ? '#2563eb' : '#0f172a' }}>{col.headerMain}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>{col.headerSub}</div>
                      </div>
                    </div>

                    {/* COLUMN TIMELINE */}
                    <div
                      onClick={(e) => handleColumnClick(col, e)}
                      style={{
                        position: 'relative', height: timelineHeight, cursor: 'pointer',
                        backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${PX_PER_MIN * 60 - 1}px, #e2e8f0 ${PX_PER_MIN * 60 - 1}px, #e2e8f0 ${PX_PER_MIN * 60}px)`
                      }}
                    >
                      {/* UNAVAILABLE ZONES (Gray background) */}
                      {!col.range && (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 10px, #f8fafc 10px, #f8fafc 20px)' }} />
                      )}
                      {col.range && col.range.open > axisStart && (
                        <div style={{ position: 'absolute', top: 0, height: (col.range.open - axisStart) * PX_PER_MIN, left: 0, right: 0, backgroundColor: '#f1f5f9' }} />
                      )}
                      {col.range && col.range.close < axisEnd && (
                        <div style={{ position: 'absolute', top: (col.range.close - axisStart) * PX_PER_MIN, bottom: 0, left: 0, right: 0, backgroundColor: '#f1f5f9' }} />
                      )}

                      {/* CURRENT TIME LINE */}
                      {isToday && nowMinutes >= axisStart && nowMinutes <= axisEnd && (
                        <div style={{ position: 'absolute', top: (nowMinutes - axisStart) * PX_PER_MIN, left: 0, right: 0, height: '2px', backgroundColor: '#ef4444', zIndex: 4 }}>
                          <div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                        </div>
                      )}

                      {/* APPOINTMENT BLOCKS */}
                      {col.appointments.map(a => {
                        const startMin = parseTimeToMinutes(a.time);
                        const meta = STATUS_META[a.status] || STATUS_META.pending;
                        const isClosedLike = CLOSED_LIKE.includes(a.status) || a.status === 'noshow';
                        return (
                          <div
                            key={a.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedAppt(a); }}
                            style={{
                              position: 'absolute',
                              top: (startMin - axisStart) * PX_PER_MIN,
                              height: Math.max(26, (a.duration_minutes || 30) * PX_PER_MIN - 1),
                              left: 4, right: 4,
                              backgroundColor: meta.bg, 
                              border: `1px solid ${meta.border}`, 
                              borderLeft: `4px solid ${meta.border}`, 
                              borderRadius: '8px',
                              padding: '4px 10px', cursor: 'pointer', overflow: 'hidden',
                              opacity: isClosedLike ? 0.6 : 1, zIndex: 3,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                              transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                              display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.08)' }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)' }}
                          >
                            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: meta.text, whiteSpace: 'nowrap', textDecoration: isClosedLike ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>{a.time} - {a.customer_name}</span>
                              {a.has_guarantee === 1 && <span style={{ fontSize: '0.75rem' }}>💳</span>}
                            </div>
                            {(a.duration_minutes || 30) >= 30 && (
                              <div style={{ fontSize: '0.75rem', color: meta.text, opacity: 0.9, whiteSpace: 'nowrap', marginTop: '2px', fontWeight: '500' }}>
                                {a.service_name}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedAppt && (
        <AppointmentDetailPanel
          appointment={selectedAppt}
          resource={sync.resources.find(r => r.id === selectedAppt.resource_id)}
          sync={sync}
          onClose={() => setSelectedAppt(null)}
        />
      )}

      {sync.checkoutAppointmentState && (
        <CheckoutModal 
          appointment={sync.checkoutAppointmentState} 
          sync={sync} 
          onClose={() => sync.onOpenCheckout(null)} 
        />
      )}

      {newApptDraft && (
        <NewAppointmentModal draft={newApptDraft} sync={sync} onClose={() => setNewApptDraft(null)} onResourceChange={setLastResourceId} />
      )}

      {showWaitlist && (
        <WaitlistModal sync={sync} date={date} onClose={() => setShowWaitlist(false)} />
      )}

    </div>
  );
};
