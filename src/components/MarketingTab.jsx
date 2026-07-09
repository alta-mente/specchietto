import { useState } from 'react';
import { Tag, Plus, Trash2, Gift } from 'lucide-react';

export const MarketingTab = ({ sync }) => {
  const { coupons, createCoupon, deleteCoupon } = sync;
  
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!code || !value) return;
    setSaving(true);
    await createCoupon(code, type, value);
    setCode('');
    setValue('');
    setShowForm(false);
    setSaving(false);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>Marketing & Promozioni</h2>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>Gestisci i codici sconto per i tuoi clienti.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
          >
            <Plus size={18} />
            Nuovo Sconto
          </button>
        )}
      </div>

      {showForm && (
        <div className="admin-card" style={{ padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '1.1rem' }}>Crea Codice Sconto</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>Codice Promozionale</label>
              <input 
                type="text" 
                value={code} 
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="es. ESTATE20" 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem' }}
                required
              />
            </div>
            <div style={{ flex: '0 1 150px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>Tipo Sconto</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem', backgroundColor: '#fff' }}
              >
                <option value="percentage">Percentuale (%)</option>
                <option value="fixed">Fisso (€)</option>
              </select>
            </div>
            <div style={{ flex: '0 1 120px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>Valore</label>
              <input 
                type="number" 
                min="1"
                step="0.1"
                value={value} 
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === 'percentage' ? '20' : '15'} 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem' }}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'transparent', color: '#475569', cursor: 'pointer', fontWeight: '500' }}>
                Annulla
              </button>
              <button type="submit" disabled={saving} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>
                {saving ? 'Salvataggio...' : 'Salva Sconto'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={20} color="#2563eb" /> Codici Sconto Attivi
        </h3>
        
        {(!coupons || coupons.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
            <Gift size={40} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
            <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem' }}>Non hai ancora creato nessun codice sconto.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {coupons.map(coupon => (
              <div key={coupon.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #f1f5f9', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '8px 12px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '8px', fontWeight: '800', letterSpacing: '1px' }}>
                    {coupon.code}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>
                      Sconto di {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `€${coupon.discount_value}`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      Creato il {new Date(coupon.created_at).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if(confirm('Sei sicuro di voler eliminare questo codice sconto?')) {
                      deleteCoupon(coupon.id);
                    }
                  }}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Elimina"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-card" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '1.1rem' }}>Programma Fedeltà</h3>
        <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '20px' }}>Premi i tuoi clienti più affezionati con punti e sconti.</p>
        
        <form onSubmit={async (e) => {
          e.preventDefault();
          const r = sync.restaurant || {};
          const loyaltyEnabled = e.target.loyalty_enabled.checked;
          const pointsPerEuro = parseInt(e.target.loyalty_points_per_euro.value, 10);
          const threshold = parseInt(e.target.loyalty_reward_threshold.value, 10);
          const reward = parseFloat(e.target.loyalty_reward_value.value);
          await sync.updateRestaurantLoyalty(loyaltyEnabled, pointsPerEuro, threshold, reward);
          alert('Impostazioni fedeltà salvate!');
        }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}>
            <input type="checkbox" name="loyalty_enabled" defaultChecked={sync.restaurant?.loyalty_enabled === 1} style={{ width: '18px', height: '18px' }} />
            Attiva Programma Fedeltà
          </label>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>Punti per ogni Euro speso</label>
              <input type="number" name="loyalty_points_per_euro" min="1" defaultValue={sync.restaurant?.loyalty_points_per_euro || 1} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>Soglia Premio (Punti)</label>
              <input type="number" name="loyalty_reward_threshold" min="10" defaultValue={sync.restaurant?.loyalty_reward_threshold || 500} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>Valore Sconto (€)</label>
              <input type="number" name="loyalty_reward_value" min="1" step="0.5" defaultValue={sync.restaurant?.loyalty_reward_value || 10} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
            </div>
          </div>
          
          <button type="submit" style={{ alignSelf: 'flex-start', padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
            Salva Impostazioni
          </button>
        </form>
      </div>

      <div className="admin-card" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '1.1rem' }}>Social & Link in Bio</h3>
        <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '20px' }}>Copia questi link per aggiungerli ai tuoi social. Il sistema traccerà automaticamente le prenotazioni!</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {['Instagram', 'Facebook', 'TikTok'].map(social => {
            const baseUrl = window.location.origin;
            const slug = sync.restaurant?.slug || sync.restaurant?.id;
            const link = `${baseUrl}/prenota/${slug}?source=${social.toLowerCase()}`;
            return (
              <div key={social} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>Link per {social}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{link}</span>
                </div>
                <button onClick={() => {
                  navigator.clipboard.writeText(link);
                  alert('Link copiato!');
                }} style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                  Copia
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="admin-card" style={{ padding: '24px', backgroundColor: '#fafafa', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔒 Pagamenti & Protezione No-Show (Stripe)
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '20px' }}>Proteggi il tuo tempo richiedendo la carta di credito a garanzia o un deposito anticipato.</p>
        
        <form onSubmit={async (e) => {
          e.preventDefault();
          const enabled = e.target.stripe_enabled.checked;
          const type = e.target.stripe_type.value;
          const amount = e.target.stripe_amount.value;
          
          await sync.saveSettings({
            stripe_enabled: enabled ? '1' : '0',
            stripe_type: type,
            stripe_amount: amount
          });
          alert('Impostazioni Stripe salvate!');
        }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}>
            <input type="checkbox" name="stripe_enabled" defaultChecked={sync.settings?.stripe_enabled === '1'} style={{ width: '18px', height: '18px' }} />
            Attiva Acquisizione Carta (Stripe)
          </label>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>Tipo di Protezione</label>
              <select name="stripe_type" defaultValue={sync.settings?.stripe_type || 'fee'} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <option value="fee">Solo Penale (Blocco Carta)</option>
                <option value="deposit">Deposito Anticipato (Acconto)</option>
              </select>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>Importo (€ o %)</label>
              <input type="number" name="stripe_amount" min="1" step="1" defaultValue={sync.settings?.stripe_amount || 15} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
            </div>
          </div>
          
          <button type="submit" style={{ alignSelf: 'flex-start', padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6366f1', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
            Salva Impostazioni Stripe
          </button>
        </form>
      </div>
    </div>
  );
};
