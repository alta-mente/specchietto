import { useState, useMemo, useEffect, useRef } from 'react';
import { X, Euro, CreditCard, Wallet, Link as LinkIcon, Plus, Trash2, CheckCircle, Copy } from 'lucide-react';
import { getBackendUrl } from '../services/backendUrl';

export const CheckoutModal = ({ appointment, sync, onClose }) => {
  const [items, setItems] = useState([{ desc: appointment.service_name, price: Number(appointment.price) }]);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [waitingPayment, setWaitingPayment] = useState(false);
  const pollRef = useRef(null);

  const depositAlready = (appointment.deposit_amount > 0 && appointment.deposit_paid === 1) ? Number(appointment.deposit_amount) : 0;

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
  const total = Math.max(0, subtotal - discountValue - depositAlready);

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

  // Mentre siamo in attesa del pagamento tramite link Stripe, controlla periodicamente
  // se il webhook ha già segnato l'appuntamento come "completed" (pagato).
  useEffect(() => {
    if (!waitingPayment) return;
    const backendUrl = getBackendUrl();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${backendUrl}/api/appointments/${appointment.id}`);
        if (res.ok) {
          const apt = await res.json();
          if (apt.status === 'completed') {
            clearInterval(pollRef.current);
            await sync.refreshAppointments();
            await sync.refreshTransactions();
            setWaitingPayment(false);
            setSuccess(true);
            setTimeout(onClose, 2000);
          }
        }
      } catch (e) { /* riprova al prossimo giro */ }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [waitingPayment, appointment.id, sync, onClose]);

  const handleCheckout = async () => {
    setProcessing(true);
    setError('');

    if (paymentMethod === 'stripe_link') {
      try {
        const url = await sync.createStripePaymentLink(appointment.id, total, items, discountCode);
        setPaymentLink(url);
        setWaitingPayment(true);
        setProcessing(false);
      } catch (e) {
        setProcessing(false);
        setError(e?.message || 'Errore nella creazione del link di pagamento. Riprova.');
      }
      return;
    }

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

  if (waitingPayment) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px', textAlign: 'center', maxWidth: '440px', width: '100%' }}>
          <LinkIcon size={48} color="#38bdf8" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ color: '#0f172a', margin: '0 0 8px 0' }}>In attesa del pagamento</h2>
          <p style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: '0.9rem' }}>Invia questo link al cliente (SMS, WhatsApp, email). Questa finestra si chiuderà da sola non appena il pagamento sarà confermato.</p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <input readOnly value={paymentLink} style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', color: '#334155' }} onFocus={e => e.target.select()} />
            <button onClick={() => { navigator.clipboard.writeText(paymentLink); }} title="Copia link" style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Copy size={16} />
            </button>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '20px' }}>⏳ In attesa di conferma...</div>
          <button onClick={() => { setWaitingPayment(false); setPaymentLink(''); }} style={{ padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'transparent', color: '#64748b', cursor: 'pointer' }}>Annulla</button>
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

          {depositAlready > 0 && (
            <div style={{ marginBottom: '24px', padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.85rem', fontWeight: '600', display: 'flex', justifyContent: 'space-between' }}>
              <span>Acconto già pagato online</span>
              <span>-€{depositAlready.toFixed(2)}</span>
            </div>
          )}

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
              <button onClick={() => setPaymentMethod('stripe_link')} style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: '12px', border: paymentMethod === 'stripe_link' ? '2px solid #38bdf8' : '1px solid #e2e8f0', backgroundColor: paymentMethod === 'stripe_link' ? '#f0f9ff' : '#fff', color: paymentMethod === 'stripe_link' ? '#0369a1' : '#64748b', cursor: 'pointer' }}>
                <LinkIcon size={24} />
                <span style={{ fontWeight: '600' }}>Link Pagamento</span>
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
              <Euro size={20} /> {processing ? 'Elaborazione...' : (paymentMethod === 'stripe_link' ? 'Genera Link di Pagamento' : 'Conferma e Incassa')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
