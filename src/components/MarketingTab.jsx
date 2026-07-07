import { Megaphone, MessageSquare, Tag, Plus, Mail } from 'lucide-react';

export const MarketingTab = () => {
  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>Marketing</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Fidelizza i tuoi clienti e aumenta le prenotazioni.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
          <Plus size={18} />
          Nuova Campagna
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: '1px solid transparent', transition: 'border 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'} onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <MessageSquare size={28} />
          </div>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 8px 0', color: '#0f172a' }}>Campagne SMS</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Invia comunicazioni rapide ai tuoi clienti per promozioni last-minute.</p>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: '1px solid transparent', transition: 'border 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'} onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Mail size={28} />
          </div>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 8px 0', color: '#0f172a' }}>Campagne Email</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Newsletter mensili, auguri di compleanno e comunicazioni lunghe.</p>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: '1px solid transparent', transition: 'border 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'} onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Tag size={28} />
          </div>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 8px 0', color: '#0f172a' }}>Codici Sconto</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Crea coupon per incentivare la prenotazione online nei periodi calmi.</p>
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Megaphone size={20} /> Attività Recenti
        </h3>
        
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem' }}>Non hai ancora inviato nessuna campagna.</p>
          <button style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'transparent', color: '#0f172a', fontWeight: '500', cursor: 'pointer' }}>
            Esplora i modelli pronti
          </button>
        </div>
      </div>
    </div>
  );
};
