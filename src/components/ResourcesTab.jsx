import { useState } from 'react';

const DAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

const cardStyle = {
  backgroundColor: '#ffffff', backdropFilter: 'blur(20px)',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '16px'
};

const inputStyle = {
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '0.85rem'
};

const ResourceHoursEditor = ({ resource, sync }) => {
  const [hours, setHours] = useState(() => {
    const base = {};
    DAYS.forEach((_, idx) => { 
      // Try to find if this resource has hours for this day from backend
      const existing = resource.hours?.find(h => h.day_of_week === idx);
      if (existing) {
        base[idx] = { enabled: true, open: existing.open_time, close: existing.close_time };
      } else {
        base[idx] = { enabled: false, open: '09:00', close: '18:00' }; 
      }
    });
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleDay = (idx) => {
    setHours(prev => ({ ...prev, [idx]: { ...prev[idx], enabled: !prev[idx].enabled } }));
  };

  const updateTime = (idx, field, value) => {
    setHours(prev => ({ ...prev, [idx]: { ...prev[idx], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const payload = Object.entries(hours)
      .filter(([, v]) => v.enabled)
      .map(([day, v]) => ({ day_of_week: parseInt(day, 10), open_time: v.open, close_time: v.close }));
    await sync.setResourceHours(resource.id, payload);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px', color: '#475569' }}>Orario settimanale</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {DAYS.map((label, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '110px' }}>
              <input type="checkbox" checked={hours[idx].enabled} onChange={() => toggleDay(idx)} />
              {label}
            </label>
            {hours[idx].enabled && (
              <>
                <input type="time" value={hours[idx].open} onChange={(e) => updateTime(idx, 'open', e.target.value)} style={inputStyle} />
                <span>–</span>
                <input type="time" value={hours[idx].close} onChange={(e) => updateTime(idx, 'close', e.target.value)} style={inputStyle} />
              </>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{ marginTop: '10px', padding: '6px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#ffffff', cursor: 'pointer', fontSize: '0.8rem' }}
      >
        {saving ? 'Salvo...' : saved ? '✓ Salvato' : 'Salva orario'}
      </button>
    </div>
  );
};

const ResourceServicesEditor = ({ resource, sync }) => {
  const [selected, setSelected] = useState(resource.services || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (serviceId) => {
    setSelected(prev => prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await sync.setResourceServices(resource.id, selected);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (sync.services.length === 0) {
    return <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '12px' }}>Aggiungi prima qualche servizio nella tab "Servizi".</p>;
  }

  return (
    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px', color: '#475569' }}>Servizi che può eseguire</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {sync.services.map(s => (
          <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}>
            <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
            {s.name}
          </label>
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{ marginTop: '10px', padding: '6px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#ffffff', cursor: 'pointer', fontSize: '0.8rem' }}
      >
        {saving ? 'Salvo...' : saved ? '✓ Salvato' : 'Salva servizi assegnati'}
      </button>
    </div>
  );
};

export const ResourcesTab = ({ sync }) => {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    await sync.createResource(name.trim());
    setName('');
    setCreating(false);
  };

  return (
    <div style={{ maxWidth: '700px' }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Team</h2>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome operatore (es. Maria)"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button type="submit" disabled={creating} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#ffffff', cursor: 'pointer', fontSize: '0.85rem' }}>
          + Aggiungi
        </button>
      </form>

      {sync.resources.length === 0 && (
        <p style={{ color: '#475569', fontSize: '0.9rem' }}>Nessun operatore ancora. Aggiungine uno per iniziare.</p>
      )}

      {sync.resources.map(resource => (
        <div key={resource.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{resource.name}</strong>
            <button
              onClick={() => sync.deleteResource(resource.id)}
              style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Elimina
            </button>
          </div>
          <ResourceServicesEditor resource={resource} sync={sync} />
          <ResourceHoursEditor resource={resource} sync={sync} />
        </div>
      ))}
    </div>
  );
};
