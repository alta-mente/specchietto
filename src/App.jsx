import './App.css';
import { useSpecchiettoSync } from './hooks/useSpecchiettoSync';
import { LoginPortal } from './components/LoginPortal';
import { Dashboard } from './components/Dashboard';
import { BookingPage } from './components/BookingPage';

const getBookingSlugFromHash = () => {
  const hash = window.location.hash;
  if (!hash.startsWith('#/prenota')) return null;
  const query = hash.split('?')[1] || '';
  const params = new URLSearchParams(query);
  return params.get('business') || 'salone-prova';
};

function App() {
  const bookingSlug = getBookingSlugFromHash();

  if (bookingSlug) {
    return (
      <div className="app-container" style={{ height: '100vh', overflow: 'auto' }}>
        <BookingPage businessSlug={bookingSlug} />
      </div>
    );
  }

  return <AdminApp />;
}

const AdminApp = () => {
  const sync = useSpecchiettoSync();

  return (
    <div className="app-container" style={{ height: '100vh' }}>
      {!sync.token ? (
        <LoginPortal onLogin={sync.login} />
      ) : (
        <Dashboard sync={sync} onLogout={sync.logout} />
      )}
    </div>
  );
};

export default App;
