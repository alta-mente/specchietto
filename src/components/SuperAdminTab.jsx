import { useState, useEffect } from 'react';
import { ShieldAlert, Users, TrendingUp } from 'lucide-react';

export const SuperAdminTab = ({ sync }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await sync.fetchSuperAdminRestaurants();
      setRestaurants(data);
      setLoading(false);
    };
    load();
  }, [sync]);

  const handlePlanChange = async (id, newPlan) => {
    const success = await sync.updateRestaurantPlan(id, newPlan);
    if (success) {
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, plan: newPlan } : r));
      if (sync.restaurantId === id) {
        // Force refresh current user's restaurant list to see the update immediately
        sync.refreshRestaurantsList();
      }
    } else {
      alert("Errore nell'aggiornamento del piano.");
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Caricamento dashboard SaaS...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <ShieldAlert size={28} color="#6366f1" />
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>Gestione SaaS & Piani</h2>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>Dashboard Super Admin per gestire gli abbonamenti dei saloni clienti.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="admin-card" style={{ padding: '20px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>Totale Saloni</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{restaurants.length}</div>
        </div>
        <div className="admin-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>Piano Pro/Premium</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>
            {restaurants.filter(r => r.plan === 'pro' || r.plan === 'premium').length}
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Salone</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Admin Email</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Iscrizione</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Stato</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Piano Abbonamento</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '16px', fontWeight: '600' }}>
                  {r.name}
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}>/{r.slug}</div>
                </td>
                <td style={{ padding: '16px', color: '#475569' }}>{r.admin_email || '—'}</td>
                <td style={{ padding: '16px', color: '#475569' }}>
                  {new Date(r.created_at).toLocaleDateString('it-IT')}
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600',
                    backgroundColor: r.active ? '#d1fae5' : '#fee2e2', 
                    color: r.active ? '#065f46' : '#991b1b' 
                  }}>
                    {r.active ? 'Attivo' : 'Sospeso'}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <select 
                    value={r.plan || 'starter'}
                    onChange={(e) => handlePlanChange(r.id, e.target.value)}
                    style={{ 
                      padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', 
                      backgroundColor: r.plan === 'premium' ? '#fef3c7' : r.plan === 'pro' ? '#e0e7ff' : '#f1f5f9',
                      fontWeight: '600', cursor: 'pointer'
                    }}
                  >
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                </td>
              </tr>
            ))}
            {restaurants.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  Nessun salone trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
