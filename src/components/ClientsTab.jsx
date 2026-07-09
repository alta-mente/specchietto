import { useState } from 'react';
import { Search, UserPlus, Phone, Mail, Calendar, Clock, AlertCircle, X, ChevronRight, Ban } from 'lucide-react';

const inputStyle = {
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '0.9rem',
  width: '100%',
  outline: 'none'
};

const NoShowBadge = ({ count }) => {
  if (!count) return <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>;
  const isHigh = count >= 3;
  return (
    <span style={{
      fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '999px',
      backgroundColor: isHigh ? '#fee2e2' : '#fef3c7', color: isHigh ? '#991b1b' : '#92400e'
    }}>
      {count} no-show
    </span>
  );
};

export const ClientsTab = ({ sync }) => {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    await sync.saveCustomer({ phone: phone.trim(), name: name.trim(), email: email.trim(), notes: '', noShowCount: 0, blocked: false });
    setName(''); setPhone(''); setEmail(''); setCreating(false);
  };

  const toggleBlocked = async (customer) => {
    await sync.saveCustomer({
      ...customer, blocked: !customer.blocked
    });
    setSelectedCustomer(prev => ({ ...prev, blocked: !prev.blocked }));
  };

  const updateNotes = async (customer, notes) => {
    await sync.saveCustomer({ ...customer, notes });
  };

  const filtered = sync.customers.filter(c => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
  });

  // Calculate stats for selected customer
  const customerAppointments = selectedCustomer 
    ? sync.appointments.filter(a => a.customer_phone === selectedCustomer.phone).sort((a,b) => b.timestamp - a.timestamp)
    : [];

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '32px', position: 'relative' }}>
      
      {/* Elenco Clienti */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>Clienti (CRM)</h2>
          <button onClick={() => setCreating(true)} className="glow-button" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} /> Nuovo Cliente
          </button>
        </div>

        {creating && (
          <form onSubmit={handleCreate} style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px', display: 'block' }}>Nome *</label>
              <input value={name} onChange={e=>setName(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px', display: 'block' }}>Telefono *</label>
              <input value={phone} onChange={e=>setPhone(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px', display: 'block' }}>Email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ width: '100%', display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" onClick={() => setCreating(false)} style={{ padding: '10px 20px', border: 'none', background: 'transparent', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>Annulla</button>
              <button type="submit" style={{ padding: '10px 24px', border: 'none', background: '#38bdf8', color: '#fff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Salva</button>
            </div>
          </form>
        )}

        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            placeholder="Cerca per nome, telefono o email..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '48px', fontSize: '1rem' }}
          />
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Nessun cliente trovato.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filtered.map(c => (
                <div 
                  key={c.phone} 
                  onClick={() => setSelectedCustomer(c)}
                  style={{ 
                    padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', transition: 'background-color 0.2s', backgroundColor: selectedCustomer?.phone === c.phone ? '#f0f9ff' : 'transparent'
                  }}
                  onMouseEnter={e => { if (selectedCustomer?.phone !== c.phone) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                  onMouseLeave={e => { if (selectedCustomer?.phone !== c.phone) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#0f172a', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {c.name} {c.blocked && <span style={{ fontSize: '0.7rem', backgroundColor: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>BLOCCATO</span>}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={12} /> {c.phone}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <NoShowBadge count={c.no_show_count} />
                    <ChevronRight size={20} color="#cbd5e1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profilo Cliente (Slide-over) */}
      {selectedCustomer && (
        <div style={{ 
          flex: '0 0 400px', backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', 
          display: 'flex', flexDirection: 'column', overflow: 'hidden', height: 'calc(100vh - 64px)', position: 'sticky', top: '32px'
        }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', color: '#0f172a' }}>{selectedCustomer.name}</h3>
                <div style={{ color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14}/> {selectedCustomer.phone}</div>
              </div>
            </div>
            <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}><X size={24} /></button>
          </div>

          <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Azioni Rapide */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href={`tel:${selectedCustomer.phone}`} style={{ flex: 1, padding: '12px', textAlign: 'center', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '12px', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>Chiama</a>
              <a href={`https://wa.me/${selectedCustomer.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '12px', textAlign: 'center', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '12px', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>WhatsApp</a>
              <button onClick={() => toggleBlocked(selectedCustomer)} style={{ flex: 1, padding: '12px', textAlign: 'center', backgroundColor: selectedCustomer.blocked ? '#fef2f2' : '#fff', color: selectedCustomer.blocked ? '#dc2626' : '#64748b', border: '1px solid ' + (selectedCustomer.blocked ? '#fecaca' : '#e2e8f0'), borderRadius: '12px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>
                {selectedCustomer.blocked ? 'Sblocca' : 'Blocca'}
              </button>
            </div>

            {/* Note Interne */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16}/> Note Private (Es. Formula Colore)</h4>
              <textarea 
                defaultValue={selectedCustomer.notes || ''}
                onBlur={(e) => updateNotes(selectedCustomer, e.target.value)}
                placeholder="Scrivi qui gli appunti per la prossima volta..."
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical', backgroundColor: '#f8fafc' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', display: 'block' }}>Salvataggio automatico quando clicchi fuori dal campo.</span>
            </div>

            {/* Storico Appuntamenti */}
            <div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16}/> Storico Appuntamenti ({customerAppointments.length})</h4>
              {customerAppointments.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Nessun appuntamento registrato.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {customerAppointments.map(a => (
                    <div key={a.id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: a.status === 'noshow' ? '#fef2f2' : '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ color: '#0f172a' }}>{a.service_name}</strong>
                        <span style={{ fontWeight: 'bold', color: '#0f172a' }}>€{a.price}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', color: '#64748b', fontSize: '0.85rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12}/> {new Date(a.date).toLocaleDateString('it-IT')}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> {a.time}</span>
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        {a.status === 'completed' && <span style={{ fontSize: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>Completato</span>}
                        {a.status === 'noshow' && <span style={{ fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>No-Show</span>}
                        {a.status === 'accepted' && <span style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>In programma</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
