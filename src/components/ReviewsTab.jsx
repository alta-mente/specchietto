import { useState, useEffect } from 'react';
import { Star, MessageSquare, Reply } from 'lucide-react';

export const ReviewsTab = ({ sync }) => {
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (sync.refreshReviews) sync.refreshReviews();
  }, [sync.restaurantId]);

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    await sync.replyReview(id, replyText.trim());
    setReplyId(null);
    setReplyText('');
  };

  const reviews = sync.reviews || [];
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px', color: '#0f172a' }}>Recensioni</h2>
          <p style={{ color: '#64748b' }}>Gestisci la reputazione del tuo salone.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#fff', padding: '16px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Voto Medio</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a' }}>{averageRating}</div>
          </div>
          <Star size={40} fill="#f59e0b" color="#f59e0b" />
        </div>
      </div>

      {reviews.length === 0 ? (
        <div style={{ backgroundColor: '#fff', padding: '64px 32px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <MessageSquare size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#334155', marginBottom: '8px' }}>Nessuna recensione ancora.</h3>
          <p style={{ color: '#64748b' }}>I clienti riceveranno un'email per lasciare una recensione quando l'appuntamento verrà segnato come "completato".</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews.map(r => (
            <div key={r.id} style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#0f172a', marginBottom: '4px' }}>{r.customer_name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    {new Date(r.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={20} fill={star <= r.rating ? "#f59e0b" : "transparent"} color={star <= r.rating ? "#f59e0b" : "#cbd5e1"} />
                  ))}
                </div>
              </div>
              <p style={{ color: '#334155', lineHeight: '1.6', fontSize: '1rem', marginTop: 0 }}>
                {r.comment || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Nessun commento scritto.</span>}
              </p>

              {r.response ? (
                <div style={{ marginTop: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #38bdf8' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>La tua risposta</div>
                  <p style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>{r.response}</p>
                </div>
              ) : (
                <div style={{ marginTop: '16px' }}>
                  {replyId === r.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Scrivi la tua risposta pubblica..."
                        rows={3}
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => setReplyId(null)} style={{ padding: '8px 16px', border: 'none', background: 'transparent', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>Annulla</button>
                        <button onClick={() => handleReply(r.id)} style={{ padding: '8px 16px', border: 'none', background: '#38bdf8', color: '#fff', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Invia Risposta</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setReplyId(r.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#38bdf8', fontWeight: '600', cursor: 'pointer', padding: 0 }}>
                      <Reply size={16} /> Rispondi
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
