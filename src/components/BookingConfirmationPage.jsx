import { useState, useEffect, useRef } from 'react';
import { Check, Calendar, Clock, Scissors, Loader } from 'lucide-react';
import { getBackendUrl } from '../services/backendUrl';

const backendUrl = getBackendUrl();

const formatFriendlyDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts.map(Number);
  const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const DAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const d = new Date(year, month - 1, day);
  return `${DAYS[d.getDay()]} ${day} ${MONTHS[month - 1]} ${year}`;
};

// Pagina pubblica su cui Stripe reindirizza il cliente dopo aver pagato l'acconto.
// Il webhook Stripe potrebbe impiegare qualche secondo per confermare il pagamento lato server,
// quindi qui facciamo un breve polling prima di mostrare l'esito finale.
export const BookingConfirmationPage = ({ appointmentId }) => {
  const [appointment, setAppointment] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    let timer;

    const poll = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/appointments/${appointmentId}`);
        if (res.status === 404) {
          if (!cancelledRef.current) setNotFound(true);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (cancelledRef.current) return;
          setAppointment(data);
          if (!restaurant) {
            fetch(`${backendUrl}/api/restaurants/${data.restaurant_id}`)
              .then(r => r.ok ? r.json() : null)
              .then(r => { if (r && !cancelledRef.current) setRestaurant(r); })
              .catch(() => {});
          }
          if (data.deposit_paid !== 1 && attempts < 15) {
            timer = setTimeout(() => { if (!cancelledRef.current) setAttempts(a => a + 1); }, 2000);
          }
        }
      } catch (e) { /* riprova al prossimo tentativo */ }
    };

    poll();
    return () => { cancelledRef.current = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, attempts]);

  const brandPrimary = restaurant?.primary_color || '#FF5C82';
  const brandAccent = restaurant?.accent_color || '#FF8C5C';

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Prenotazione non trovata.</p>
      </div>
    );
  }

  const paid = appointment?.deposit_paid === 1;
  const stillWaiting = appointment && !paid && attempts >= 15;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '480px', width: '100%', padding: '40px 32px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px' }}>
        {!appointment && (
          <>
            <Loader size={40} color={brandPrimary} style={{ margin: '0 auto 16px' }} className="animate-spin" />
            <p style={{ color: '#94a3b8' }}>Verifica del pagamento in corso...</p>
          </>
        )}

        {appointment && paid && (
          <>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', background: `linear-gradient(135deg, ${brandPrimary}, ${brandAccent})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: `0 0 30px ${brandPrimary}4d`
            }}>
              <Check size={40} color="#fff" />
            </div>
            <h2 style={{ marginBottom: '12px', fontSize: '1.8rem', fontWeight: '800' }}>Pagamento Confermato!</h2>
            <p style={{ color: '#94a3b8', marginBottom: '32px', fontSize: '1.05rem' }}>
              La tua prenotazione presso {restaurant?.name || 'il salone'} è confermata.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Scissors size={20} color={brandPrimary} />
                <strong>{appointment.service_name}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Calendar size={20} color={brandPrimary} />
                <span>{formatFriendlyDate(appointment.date)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={20} color={brandPrimary} />
                <span>{appointment.time}</span>
              </div>
            </div>
          </>
        )}

        {stillWaiting && (
          <p style={{ color: '#f59e0b', marginTop: '16px', fontSize: '0.9rem' }}>
            Il pagamento risulta ancora in elaborazione. Se hai completato il pagamento, la prenotazione verrà confermata a breve: controlla la tua email, oppure contatta direttamente il salone.
          </p>
        )}
      </div>
    </div>
  );
};
