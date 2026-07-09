import { useState } from 'react';
import { Star, CheckCircle, ArrowRight } from 'lucide-react';
import { getBackendUrl } from '../services/backendUrl';

export const ReviewPage = ({ appointmentId }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError('Seleziona almeno una stella per continuare.');
      return;
    }
    setSubmitting(true);
    setError('');
    
    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appointmentId, rating, comment })
      });
      let data = {};
      try { data = await res.json(); } catch (parseErr) {
        throw new Error('Il server non ha risposto correttamente. Riprova tra poco.');
      }
      if (!res.ok) throw new Error(data.error || 'Errore durante l\'invio della recensione.');
      setSubmitted(true);
    } catch(err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '48px', borderRadius: '24px', textAlign: 'center', maxWidth: '400px', width: '100%', border: '1px solid #334155' }}>
          <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '12px' }}>Grazie!</h2>
          <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>Abbiamo ricevuto la tua recensione. Il tuo feedback è molto prezioso per noi!</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
      
      <div style={{ marginBottom: '48px', marginTop: '24px' }}>
        <img src="/specchietto-logo-bianco.svg" alt="Specchietto" style={{ height: '36px' }} />
      </div>

      <div style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '24px', maxWidth: '450px', width: '100%', border: '1px solid #334155' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '8px', textAlign: 'center' }}>Come ti sei trovato?</h1>
        <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '32px' }}>Lascia una recensione per il tuo ultimo appuntamento.</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <Star 
                  size={48} 
                  fill={(hoverRating || rating) >= star ? "#f59e0b" : "transparent"} 
                  color={(hoverRating || rating) >= star ? "#f59e0b" : "#475569"} 
                  style={{ transition: 'all 0.2s' }}
                />
              </button>
            ))}
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.95rem' }}>Hai qualche nota o suggerimento? (facoltativo)</label>
            <textarea 
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Scrivi qui..."
              rows={4}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '1rem', resize: 'vertical' }}
            />
          </div>

          {error && <div style={{ color: '#ef4444', textAlign: 'center' }}>{error}</div>}

          <button 
            type="submit" 
            disabled={submitting}
            style={{ 
              padding: '16px', borderRadius: '12px', border: 'none', 
              background: 'linear-gradient(135deg, #FF5C82, #FF8C5C)', color: '#fff', 
              fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
            }}
          >
            {submitting ? 'Invio in corso...' : 'Invia Recensione'} <ArrowRight size={20} />
          </button>
        </form>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '32px 16px', opacity: 0.6, marginTop: 'auto' }}>
        <a href="https://altamente.it" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span style={{ color: '#94a3b8' }}>Gestito da</span>
          <img src="/specchietto-logo-bianco.svg" alt="Specchietto" style={{ height: '20px', width: 'auto' }} />
          <span style={{ color: '#94a3b8', margin: '0 4px' }}>|</span>
          <span style={{ fontWeight: '600' }}>altamente.it</span>
        </a>
      </div>
    </div>
  );
};
