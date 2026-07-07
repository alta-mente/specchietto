import { useState } from 'react';

const inputStyle = {
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '0.85rem'
};

export const ServicesTab = ({ sync }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('30');
  const [price, setPrice] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !duration) return;
    setCreating(true);
    await sync.createService(name.trim(), category.trim(), parseInt(duration, 10), parseFloat(price || '0'));
    setName('');
    setCategory('');
    setDuration('30');
    setPrice('');
    setCreating(false);
  };

  return (
    <div style={{ maxWidth: '700px' }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Servizi</h2>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome servizio (es. Taglio e Piega)" style={{ ...inputStyle, flex: '2 1 200px' }} />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoria (es. Capelli)" style={{ ...inputStyle, flex: '1 1 120px' }} />
        <input type="number" min="5" step="5" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Durata (min)" style={{ ...inputStyle, width: '110px' }} />
        <input type="number" min="0" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Prezzo (€)" style={{ ...inputStyle, width: '100px' }} />
        <button type="submit" disabled={creating} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
          + Aggiungi
        </button>
      </form>

      {sync.services.length === 0 && (
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Nessun servizio ancora. Aggiungine uno per iniziare.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sync.services.map(s => (
          <div key={s.id} style={{
            backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
            padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <strong>{s.name}</strong>
              {s.category && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>{s.category}</span>}
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                {s.duration_minutes} min • €{s.price}
              </div>
            </div>
            <button onClick={() => sync.deleteService(s.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>
              Elimina
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
