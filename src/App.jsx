import './App.css';
import { useSpecchiettoSync } from './hooks/useSpecchiettoSync';
import { LoginPortal } from './components/LoginPortal';
import { Dashboard } from './components/Dashboard';
import { BookingPage } from './components/BookingPage';
import { ReviewPage } from './components/ReviewPage';
import { LandingPage } from './components/LandingPage';
import { MobileApp } from './components/MobileApp';
import { Capacitor } from '@capacitor/core';

const getView = () => {
  const hash = window.location.hash;
  if (hash.startsWith('#/prenota')) {
    const query = hash.split('?')[1] || '';
    const params = new URLSearchParams(query);
    return { view: 'booking', businessSlug: params.get('business') || 'salone-prova' };
  }
  if (hash.startsWith('#/leave-review/')) {
    const appointmentId = hash.split('#/leave-review/')[1];
    return { view: 'review', appointmentId };
  }
  if (hash.startsWith('#/admin')) return { view: 'admin' };
  return { view: 'landing' };
};

function App() {
  // L'app nativa (Android/iOS via Capacitor) è uso esclusivo dello staff del salone:
  // niente landing page marketing né flussi cliente (prenotazione/recensione), che restano
  // solo sul sito web. All'avvio va sempre alla vista gestionale (login o dashboard se già loggati).
  const { view, businessSlug } = Capacitor.isNativePlatform() ? { view: 'admin' } : getView();

  if (view === 'booking') {
    return (
      <div className="app-container">
        <BookingPage businessSlug={businessSlug} />
      </div>
    );
  }

  if (view === 'review') {
    return (
      <div className="app-container">
        <ReviewPage appointmentId={getView().appointmentId} />
      </div>
    );
  }

  if (view === 'admin') {
    return <AdminApp />;
  }

  return (
    <div className="app-container">
      <LandingPage onOpenLogin={() => { window.location.hash = '#/admin'; window.location.reload(); }} />
    </div>
  );
}

const AdminApp = () => {
  const sync = useSpecchiettoSync();
  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="app-container" style={{ height: '100vh' }}>
      {!sync.token ? (
        <LoginPortal onLogin={sync.login} onBack={() => { window.location.hash = ''; window.location.reload(); }} />
      ) : (
        isNative ? <MobileApp sync={sync} onLogout={sync.logout} /> : <Dashboard sync={sync} onLogout={sync.logout} />
      )}
    </div>
  );
};

export default App;
