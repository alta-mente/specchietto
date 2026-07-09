import { useState, useMemo } from 'react';
import { X, Euro, CreditCard, Wallet, Plus, Trash2, CheckCircle } from 'lucide-react';

export const CheckoutModal = ({ appointment, sync, onClose }) => {
  const [items, setItems] = useState([{ desc: appointment.service_name, price: Number(appointment.price) }]);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const discountValue = useMemo(() => {
    if (!discountCode || !sync.coupons) return 0;
    const codeObj = sync.coupons.find(c => c.code.toLowerCase() === discountCode.toLowerCase());
    if (!codeObj) return 0;
    
    const subtotal = items.reduce((acc, i) => acc + i.price, 0);
    if (codeObj.type === 'percentage') {
      return (subtotal * codeObj.value) / 100;
    }
    return codeObj.value;
  }, [discountCode, items, sync.coupons]);

  const subtotal = items.reduce((acc, i) => acc + i.price, 0);
  const total = Math.max(0, subtotal - discountValue);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemDesc || !newItemPrice) return;
    setItems([...items, { desc: newItemDesc, price: Number(newItemPrice) }]);
    setNewItemDesc('');
    setNewItemPrice('');
  };

  const handleRemoveItem = (index) => {
    if (index === 0) return; // Cannot remove base service
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCheckout = async () => {
    setProcessing(true);
    setError('');
    try {
      await sync.checkoutAppointment(appointment.id, total, paymentMethod, items, discountCode);
      setProcessing(false);
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (e) {
      setProcessing(false);
      setError(e?.message || 'Errore durante il salvataggio del pagamento. Riprova.');
    }
  };

  if (success) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
          <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ color: '#0f172a', margin: '0 0 8px 0' }}>Pagamento Completato</h2>
          <p style={{ color: '#64748b', margin: 0 }}>L'appuntamento è stato chiuso e incassato.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', width: '500px', maxWidth: '95vw', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>Cassa</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{appointment.customer_name} • {appointment.service_name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {/* Items */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', color: '#0f172a', margin: '0 0 12px 0' }}>Voci Scontrino</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#334155', fontWeight: '500' }}>{it.desc}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: '700', color: '#0f172a' }}>€{it.price.toFixed(2)}</span>
                    {idx > 0 && <button onClick={() => handleRemoveItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0 }}><Trash2 size={16} /></button>}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input value={newItemDesc} onChange={e=>setNewItemDesc(e.target.value)} placeholder="Prodotto extra (es. Shampoo)" style={{ flex: 2, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
              <input value={newItemPrice} onChange={e=>setNewItemPrice(e.target.value)} type="number" step="0.01" placeholder="€0.00" style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
              <button type="submit" style={{ padding: '10px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#334155' }}><Plus size={20} /></button>
            </form>
          </div>

          {/* Discount */}
          <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ color: '#475569', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Codice Sconto:</label>
            <input value={discountCode} onChange={e=>setDiscountCode(e.target.value)} placeholder="Es. PROMO20" style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', textTransform: 'uppercase' }} />
            {discountValue > 0 && <span style={{ color: '#10b981', fontWeight: 'bold' }}>-€{discountValue.toFixed(2)}</span>}
          </div>

          {/* Payment Method */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', color: '#0f172a', margin: '0 0 12px 0' }}>Metodo di Pagamento</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setPaymentMethod('card')} style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: '12px', border: paymentMethod === 'card' ? '2px solid #38bdf8' : '1px solid #e2e8f0', backgroundColor: paymentMethod === 'card' ? '#f0f9ff' : '#fff', color: paymentMethod === 'card' ? '#0369a1' : '#64748b', cursor: 'pointer' }}>
                <CreditCard size={24} />
                <span style={{ fontWeight: '600' }}>Carta / POS</span>
              </button>
              <button onClick={() => setPaymentMethod('cash')} style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: '12px', border: paymentMethod === 'cash' ? '2px solid #38bdf8' : '1px solid #e2e8f0', backgroundColor: paymentMethod === 'cash' ? '#f0f9ff' : '#fff', color: paymentMethod === 'cash' ? '#0369a1' : '#64748b', cursor: 'pointer' }}>
                <Wallet size={24} />
                <span style={{ fontWeight: '600' }}>Contanti</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          {error && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', fontWeight: '600' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Totale da Pagare</div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a' }}>€{total.toFixed(2)}</div>
            </div>
            <button disabled={processing} onClick={handleCheckout} style={{ padding: '16px 32px', backgroundColor: '#38bdf8', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px 0 rgba(56,189,248,0.39)' }}>
              <Euro size={20} /> {processing ? 'Elaborazione...' : 'Conferma e Incassa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
