import { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { storageService } from '../services/storageService';
import { getBackendUrl } from '../services/backendUrl';

// Ridimensiona e comprime un'immagine caricata dall'utente in un JPEG data URL,
// così da tenere piccolo il payload salvato lato backend.
const resizeImageToJpegDataUrl = (file, maxDim = 320, quality = 0.85) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Errore durante la lettura del file.'));
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => reject(new Error('File immagine non valido.'));
    img.onload = () => {
      let { width, height } = img;
      if (width > height) {
        if (width > maxDim) { height = Math.round(height * (maxDim / width)); width = maxDim; }
      } else if (height > maxDim) {
        width = Math.round(width * (maxDim / height)); height = maxDim;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

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
  const [error, setError] = useState('');

  const toggleDay = (idx) => {
    setHours(prev => ({ ...prev, [idx]: { ...prev[idx], enabled: !prev[idx].enabled } }));
  };

  const updateTime = (idx, field, value) => {
    setHours(prev => ({ ...prev, [idx]: { ...prev[idx], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    const payload = Object.entries(hours)
      .filter(([, v]) => v.enabled)
      .map(([day, v]) => ({ day_of_week: parseInt(day, 10), open_time: v.open, close_time: v.close }));
    const ok = await sync.setResourceHours(resource.id, payload);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } else {
      setError('Errore nel salvataggio dell\'orario.');
    }
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
      {error && <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#ef4444' }}>{error}</div>}
    </div>
  );
};

const ResourceServicesEditor = ({ resource, sync }) => {
  const [selected, setSelected] = useState(resource.services || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const toggle = (serviceId) => {
    setSelected(prev => prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    const ok = await sync.setResourceServices(resource.id, selected);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } else {
      setError('Errore nel salvataggio dei servizi assegnati.');
    }
  };

  if ((sync.services || []).length === 0) {
    return <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Crea prima dei servizi per assegnarli a questa risorsa.</div>;
  }

  return (
    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px', color: '#475569' }}>Servizi eseguibili ({selected.length})</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
        {(sync.services || []).map(s => (
          <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', backgroundColor: selected.includes(s.id) ? '#f8fafc' : 'transparent', border: selected.includes(s.id) ? '1px solid #cbd5e1' : '1px solid transparent' }}>
            <input
              type="checkbox"
              checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
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
      {error && <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#ef4444' }}>{error}</div>}
    </div>
  );
};

export 
const ResourceAuthModal = ({ resource, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const backendUrl = getBackendUrl();
      const token = storageService.getItem('auth_token_admin');
      const res = await fetch(`${backendUrl}/api/resources/${resource.id}/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Accesso creato! Il dipendente può ora usare queste credenziali per accedere.');
      setTimeout(onClose, 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90vw' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Crea Accesso per {resource.name}</h3>
        {success ? (
          <div style={{ color: '#10b981', fontWeight: 'bold' }}>{success}</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Crea un account per questo dipendente. Potrà fare login per vedere solo il suo calendario.</p>
            <input type="email" placeholder="Email (es. mario@salone.it)" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="Password temporanea" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
            {error && <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'transparent' }}>Annulla</button>
              <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#38bdf8', color: '#fff', fontWeight: 'bold' }}>{loading ? 'Salvataggio...' : 'Crea'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const ResourceAvatar = ({ resource, sync }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permette di riselezionare lo stesso file
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Seleziona un\'immagine (jpg/png).');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const dataUrl = await resizeImageToJpegDataUrl(file);
      const ok = await sync.updateResource(resource.id, { photo_url: dataUrl });
      if (!ok) setError('Errore nel salvataggio dell\'avatar.');
    } catch (err) {
      setError(err.message || 'Errore durante il caricamento.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }}>
      <div
        onClick={() => inputRef.current?.click()}
        title="Cambia foto"
        style={{
          width: '40px', height: '40px', borderRadius: '50%',
          backgroundColor: resource.color || '#e2e8f0',
          backgroundImage: resource.photo_url ? `url(${resource.photo_url})` : 'none',
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 'bold', cursor: 'pointer', overflow: 'hidden'
        }}
      >
        {!resource.photo_url && (resource.name || '?').charAt(0).toUpperCase()}
        {uploading && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
            <span style={{ fontSize: '0.5rem', color: '#fff' }}>...</span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title="Cambia foto"
        style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#0f172a', border: '2px solid #fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
      >
        <Camera size={10} />
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleFile} style={{ display: 'none' }} />
      {error && <div style={{ position: 'absolute', top: '46px', left: 0, fontSize: '0.65rem', color: '#ef4444', width: '150px', lineHeight: 1.3 }}>{error}</div>}
    </div>
  );
};

export const ResourcesTab = ({ sync }) => {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [authResource, setAuthResource] = useState(null);

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

      {(sync.resources || []).length === 0 && (
        <p style={{ color: '#475569', fontSize: '0.9rem' }}>Nessuna risorsa ancora. Aggiungi il tuo team o le postazioni.</p>
      )}

      {(sync.resources || []).map(resource => (
        <div key={resource.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ResourceAvatar resource={resource} sync={sync} />
              <div>
                <strong style={{ fontSize: '1.1rem' }}>{resource.name}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setAuthResource(resource)} style={{ border: 'none', background: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.8rem' }}>Crea Accesso</button>
              <button
                onClick={async () => {
                  if (!window.confirm(`Eliminare ${resource.name} dal team? L'azione non è reversibile.`)) return;
                  const ok = await sync.deleteResource(resource.id);
                  if (!ok) window.alert('Errore durante l\'eliminazione. Riprova.');
                }}
                style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Elimina
              </button>
            </div>
          </div>
          {authResource?.id === resource.id && <ResourceAuthModal resource={resource} onClose={() => setAuthResource(null)} />}
          <ResourceServicesEditor resource={resource} sync={sync} />
          <ResourceHoursEditor resource={resource} sync={sync} />
        </div>
      ))}
    </div>
  );
};
