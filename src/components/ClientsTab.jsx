import { useState } from 'react';

const inputStyle = {
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '0.85rem'
};

const NoShowBadge = ({ count }) => {
  if (!count) return <span style={{ color: '#475569', fontSize: '0.8rem' }}>—</span>;
  const isHigh = count >= 3;
  return (
    <span style={{
      fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '999px',
      backgroundColor: isHigh ? '#fee2e2' : '#fef3c7', color: isHigh ? '#991b1b' : '#92400e'
    }}>
      {count} no-show
    </span>
  );
};

export const ClientsTab = ({ sync }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setCreating(true);
    await sync.saveCustomer({ phone: phone.trim(), name: name.trim(), email: email.trim(), notes: '', noShowCount: 0, blocked: false });
    setName('');
    setPhone('');
    setEmail('');
    setCreating(false);
  };

  const toggleBlocked = async (customer) => {
    await sync.saveCustomer({
      phone: customer.phone, name: customer.name, email: customer.email,
      notes: customer.notes, noShowCount: customer.no_show_count, blocked: !customer.blocked
    });
  };

  const filtered = sync.customers.filter(c => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ maxWidth: '760px' }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Clienti</h2>
      <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '16px' }}>
        Si popola da sola con chi prenota un appuntamento. Puoi anche aggiungere un cliente a mano qui sotto.
      </p>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome cliente" style={{ ...inputStyle, flex: '1 1 160px' }} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefono" style={{ ...inputStyle, flex: '1 1 130px' }} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (facoltativa)" style={{ ...inputStyle, flex: '1 1 160px' }} />
        <button type="submit" disabled={creating} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#FF5C82', color: '#0f172a', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
          + Aggiungi
        </button>
      </form>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cerca per nome, telefono o email..."
        style={{ ...inputStyle, width: '100%', marginBottom: '16px' }}
      />

      {filtered.length === 0 ? (
        <p style={{ color: '#475569', fontSize: '0.9rem' }}>
          {sync.customers.length === 0 ? 'Nessun cliente ancora. Arriveranno automaticamente con le prime prenotazioni.' : 'Nessun cliente corrisponde alla ricerca.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(c => {
            const r = sync.restaurant || {};
            const loyaltyEnabled = r.loyalty_enabled === 1;
            const points = c.loyalty_points || 0;
            const threshold = r.loyalty_reward_threshold || 500;
            const canRedeem = loyaltyEnabled && points >= threshold;

            return (
              <div key={c.phone} style={{
                backgroundColor: '#ffffff', backdropFilter: 'blur(20px)', border: '1px solid #e2e8f0', borderRadius: '10px',
                padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                opacity: c.blocked ? 0.6 : 1, flexWrap: 'wrap'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>{c.name}</strong>
                    {c.blocked ? <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#991b1b', backgroundColor: '#fee2e2', padding: '2px 8px', borderRadius: '999px' }}>Bloccato</span> : null}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                    {c.phone}{c.email ? ` • ${c.email}` : ''}
                  </div>
                  {loyaltyEnabled && (
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#0f172a', marginTop: '4px' }}>
                      Punti Fedeltà: <span style={{ color: canRedeem ? '#16a34a' : 'inherit' }}>{points}</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {canRedeem && (
                    <button
                      onClick={async () => {
                        if (window.confirm(`Vuoi usare ${threshold} punti per uno sconto di €${r.loyalty_reward_value}?`)) {
                          await sync.redeemPoints(c.phone, threshold);
                        }
                      }}
                      style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '5px 10px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.4)' }}
                    >
                      🎁 Riscatta Premio
                    </button>
                  )}
                  <NoShowBadge count={c.no_show_count} />
                  <button
                    onClick={() => toggleBlocked(c)}
                    style={{ fontSize: '0.75rem', padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'none', color: '#334155', cursor: 'pointer' }}
                  >
                    {c.blocked ? 'Sblocca' : 'Blocca'}
                  </button>
                  <button
                    onClick={() => sync.deleteCustomer(c.phone)}
                    style={{ fontSize: '0.75rem', padding: '5px 10px', borderRadius: '6px', border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
                  >
                    Elimina
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
