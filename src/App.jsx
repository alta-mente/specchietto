import './App.css';
import { useSpecchiettoSync } from './hooks/useSpecchiettoSync';
import { LoginPortal } from './components/LoginPortal';
import { Dashboard } from './components/Dashboard';
import { BookingPage } from './components/BookingPage';
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
  if (hash.startsWith('#/admin')) return { view: 'admin' };
  return { view: 'landing' };
};

function App() {
  const { view, businessSlug } = getView();

  if (view === 'booking') {
    return (
      <div className="app-container" style={{ height: '100vh', overflow: 'auto' }}>
        <BookingPage businessSlug={businessSlug} />
      </div>
    );
  }

  if (view === 'admin') {
    return <AdminApp />;
  }

  return (
    <div className="app-container" style={{ height: '100vh', overflow: 'auto' }}>
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
