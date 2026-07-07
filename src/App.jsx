import './App.css';
import { useSpecchiettoSync } from './hooks/useSpecchiettoSync';
import { LoginPortal } from './components/LoginPortal';
import { Dashboard } from './components/Dashboard';

function App() {
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
}

export default App;
