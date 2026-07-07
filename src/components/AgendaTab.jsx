import { useState, useEffect, useMemo } from 'react';

const STATUS_META = {
  pending: { label: 'In attesa', bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  accepted: { label: 'Confermato', bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  arrived: { label: 'Arrivato', bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' },
  completed: { label: 'Completato', bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  noshow: { label: 'No-show', bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  declined: { label: 'Rifiutato', bg: '#f1f5f9', border: '#94a3b8', text: '#64748b' },
  cancelled: { label: 'Annullato', bg: '#f1f5f9', border: '#94a3b8', text: '#64748b' }
};

const AVATAR_COLORS = ['#0f172a', '#2563eb', '#7c3aed', '#0891b2', '#c2410c', '#be123c', '#15803d'];
const CLOSED_LIKE = ['declined', 'cancelled'];
const PX_PER_MIN = 1.5;
const SNAP_MINUTES = 15;
const DEFAULT_START = 9 * 60;
const DEFAULT_END = 19 * 60;

const todayIso = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
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
  const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const DAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const d = new Date(year, month - 1, day);
  return `${DAYS[d.getDay()]} ${day} ${MONTHS[month - 1]} ${year}`;
};

const shiftDate = (dateStr, deltaDays) => {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + deltaDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

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
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.35)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: '#fff', borderRadius: '16px', padding: '24px', width: '360px', maxWidth: '90vw',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{appointment.customer_name}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{appointment.customer_phone}</div>
          </div>
          <span style={{
            fontSize: '0.7rem', fontWeight: '700', padding: '4px 10px', borderRadius: '999px',
            backgroundColor: meta.bg, color: meta.text
          }}>
            {meta.label}
          </span>
        </div>

        <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '18px', fontSize: '0.85rem' }}>
          <div style={{ marginBottom: '6px' }}><strong>{appointment.service_name}</strong> ({appointment.duration_minutes} min)</div>
          <div style={{ marginBottom: '6px' }}>{formatFriendlyDate(appointment.date)} alle {appointment.time}</div>
          <div style={{ color: '#64748b' }}>con {resource?.name || '—'}</div>
          {appointment.notes && <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', color: '#64748b' }}>"{appointment.notes}"</div>}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {appointment.status === 'pending' && (
            <button disabled={busy} onClick={() => runAction('accepted')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Conferma</button>
          )}
          {appointment.status === 'accepted' && (
            <button disabled={busy} onClick={() => runAction('arrived')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#8b5cf6', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Segna arrivato</button>
          )}
          {appointment.status === 'arrived' && (
            <button disabled={busy} onClick={() => runAction('completed')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Completa</button>
          )}
          {['pending', 'accepted'].includes(appointment.status) && (
            <>
              <button disabled={busy} onClick={() => runAction('noshow')} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #ef4444', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>No-show</button>
              <button disabled={busy} onClick={() => runAction('declined', 'Annullato dal gestionale')} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #ef4444', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>Rifiuta</button>
            </>
          )}
        </div>
        <button onClick={onClose} style={{ marginTop: '14px', width: '100%', padding: '8px', borderRadius: '10px', border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>Chiudi</button>
      </div>
    </div>
  );
};

const NewAppointmentModal = ({ draft, sync, date, onClose }) => {
  const [resourceId, setResourceId] = useState(draft.resourceId || sync.resources[0]?.id || '');
  const [serviceId, setServiceId] = useState(sync.services[0]?.id || '');
  const [time, setTime] = useState(draft.time || '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const inputStyle = { padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '100%' };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.35)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
    }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} style={{
        backgroundColor: '#fff', borderRadius: '16px', padding: '24px', width: '380px', maxWidth: '90vw',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '12px'
      }}>
        <div style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '4px' }}>Nuovo appuntamento</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>{formatFriendlyDate(date)}</div>

        <select value={resourceId} onChange={(e) => setResourceId(e.target.value)} style={inputStyle}>
          {sync.resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={inputStyle}>
          {sync.services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>)}
        </select>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required style={inputStyle} />
        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome cliente" required style={inputStyle} />
        <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Telefono" style={inputStyle} />

        <button type="submit" disabled={submitting} style={{ padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
          {submitting ? 'Salvo...' : 'Crea appuntamento'}
        </button>
        {error && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{error}</span>}
        <button type="button" onClick={onClose} style={{ padding: '4px', borderRadius: '10px', border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>Annulla</button>
      </form>
    </div>
  );
};

export const AgendaTab = ({ sync }) => {
  const [date, setDate] = useState(todayIso());
  const [resourceHours, setResourceHours] = useState({});
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [newApptDraft, setNewApptDraft] = useState(null);
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

  const dayOfWeek = useMemo(() => new Date(`${date}T12:00:00`).getDay(), [date]);

  const resourceRanges = useMemo(() => {
    const ranges = {};
    sync.resources.forEach(r => {
      const hours = (resourceHours[r.id] || []).filter(h => h.day_of_week === dayOfWeek);
      ranges[r.id] = hours.length === 0 ? null : {
        open: Math.min(...hours.map(h => parseTimeToMinutes(h.open_time))),
        close: Math.max(...hours.map(h => parseTimeToMinutes(h.close_time)))
      };
    });
    return ranges;
  }, [sync.resources, resourceHours, dayOfWeek]);

  const { axisStart, axisEnd } = useMemo(() => {
    const opens = Object.values(resourceRanges).filter(Boolean).map(r => r.open);
    const closes = Object.values(resourceRanges).filter(Boolean).map(r => r.close);
    if (opens.length === 0) return { axisStart: DEFAULT_START, axisEnd: DEFAULT_END };
    return { axisStart: Math.min(...opens), axisEnd: Math.max(...closes) };
  }, [resourceRanges]);

  const timelineHeight = (axisEnd - axisStart) * PX_PER_MIN;

  const hourMarks = useMemo(() => {
    const marks = [];
    const first = Math.ceil(axisStart / 60) * 60;
    for (let m = first; m <= axisEnd; m += 60) marks.push(m);
    return marks;
  }, [axisStart, axisEnd]);

  const appointmentsByResource = useMemo(() => {
    const map = {};
    sync.resources.forEach(r => { map[r.id] = []; });
    sync.appointments.filter(a => a.date === date).forEach(a => {
      if (!map[a.resource_id]) map[a.resource_id] = [];
      map[a.resource_id].push(a);
    });
    return map;
  }, [sync.appointments, sync.resources, date]);

  const isToday = date === todayIso();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const handleColumnClick = (resourceId, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let minutes = axisStart + (e.clientY - rect.top) / PX_PER_MIN;
    minutes = Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
    minutes = Math.max(axisStart, Math.min(axisEnd - SNAP_MINUTES, minutes));
    setNewApptDraft({ resourceId, time: formatMinutesToTime(minutes) });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setDate(d => shiftDate(d, -1))} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>←</button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
          <button onClick={() => setDate(d => shiftDate(d, 1))} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>→</button>
          {!isToday && (
            <button onClick={() => setDate(todayIso())} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Oggi</button>
          )}
          <strong style={{ marginLeft: '4px', fontSize: '0.95rem' }}>{formatFriendlyDate(date)}</strong>
        </div>
        <button
          onClick={() => setNewApptDraft({ resourceId: sync.resources[0]?.id || '', time: formatMinutesToTime(axisStart) })}
          disabled={sync.resources.length === 0 || sync.services.length === 0}
          style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
        >
          + Nuovo appuntamento
        </button>
      </div>

      {sync.resources.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>Aggiungi prima un operatore nella tab "Operatori".</p>
      ) : (
        <div style={{ display: 'flex', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', display: 'flex', width: '100%' }}>
            <div style={{ width: '52px', flexShrink: 0, borderRight: '1px solid #f1f5f9' }}>
              <div style={{ height: '58px', borderBottom: '2px solid #e2e8f0' }} />
              <div style={{ position: 'relative', height: timelineHeight }}>
                {hourMarks.map(m => (
                  <div key={m} style={{ position: 'absolute', top: (m - axisStart) * PX_PER_MIN - 7, right: '8px', fontSize: '0.7rem', color: '#94a3b8' }}>
                    {formatMinutesToTime(m)}
                  </div>
                ))}
              </div>
            </div>

            {sync.resources.map((r, idx) => {
              const range = resourceRanges[r.id];
              const dayAppts = (appointmentsByResource[r.id] || []).filter(a => !CLOSED_LIKE.includes(a.status));
              return (
                <div key={r.id} style={{ minWidth: '210px', flex: 1, borderRight: idx < sync.resources.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{
                    height: '58px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                      backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700'
                    }}>
                      {initials(r.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{r.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{dayAppts.length} appuntament{dayAppts.length === 1 ? 'o' : 'i'}</div>
                    </div>
                  </div>

                  <div
                    onClick={(e) => handleColumnClick(r.id, e)}
                    style={{
                      position: 'relative', height: timelineHeight, cursor: 'pointer',
                      backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${PX_PER_MIN * 60 - 1}px, #f8fafc ${PX_PER_MIN * 60 - 1}px, #f8fafc ${PX_PER_MIN * 60}px)`
                    }}
                  >
                    {!range && (
                      <div style={{
                        position: 'absolute', inset: 0, backgroundColor: '#f8fafc',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#cbd5e1', fontSize: '0.8rem', fontWeight: '600'
                      }}>
                        Chiuso
                      </div>
                    )}
                    {range && range.open > axisStart && (
                      <div style={{ position: 'absolute', top: 0, height: (range.open - axisStart) * PX_PER_MIN, left: 0, right: 0, backgroundColor: 'rgba(148,163,184,0.08)' }} />
                    )}
                    {range && range.close < axisEnd && (
                      <div style={{ position: 'absolute', top: (range.close - axisStart) * PX_PER_MIN, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(148,163,184,0.08)' }} />
                    )}

                    {isToday && nowMinutes >= axisStart && nowMinutes <= axisEnd && (
                      <div style={{ position: 'absolute', top: (nowMinutes - axisStart) * PX_PER_MIN, left: 0, right: 0, height: '2px', backgroundColor: '#ef4444', zIndex: 3 }}>
                        <div style={{ position: 'absolute', left: '-3px', top: '-3px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                      </div>
                    )}

                    {(appointmentsByResource[r.id] || []).map(a => {
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
                            height: Math.max(22, (a.duration_minutes || 30) * PX_PER_MIN - 2),
                            left: 4, right: 4,
                            backgroundColor: meta.bg, borderLeft: `3px solid ${meta.border}`, borderRadius: '6px',
                            padding: '3px 8px', cursor: 'pointer', overflow: 'hidden',
                            opacity: isClosedLike ? 0.55 : 1, zIndex: 2,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                          }}
                        >
                          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: meta.text, whiteSpace: 'nowrap', textDecoration: isClosedLike ? 'line-through' : 'none' }}>
                            {a.time} · {a.customer_name}
                          </div>
                          <div style={{ fontSize: '0.66rem', color: meta.text, opacity: 0.85, whiteSpace: 'nowrap' }}>{a.service_name}</div>
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

      {selectedAppt && (
        <AppointmentDetailPanel
          appointment={selectedAppt}
          resource={sync.resources.find(r => r.id === selectedAppt.resource_id)}
          sync={sync}
          onClose={() => setSelectedAppt(null)}
        />
      )}

      {newApptDraft && (
        <NewAppointmentModal draft={newApptDraft} sync={sync} date={date} onClose={() => setNewApptDraft(null)} />
      )}
    </div>
  );
};
