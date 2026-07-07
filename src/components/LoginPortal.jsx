import { useState } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Capacitor } from '@capacitor/core';

export const LoginPortal = ({ onLogin = () => {}, restaurantInfo = null, onBack = null }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [view, setView] = useState('login'); // 'login' | 'forgot'
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  const [ipInput, setIpInput] = useState(() => storageService.getItem('backend_ip') || '');
  const [currentIp, setCurrentIp] = useState(() => storageService.getItem('backend_ip') || '');

  const handleSaveIp = () => {
    if (ipInput.trim()) {
      storageService.setItem('backend_ip', ipInput.trim());
      setCurrentIp(ipInput.trim());
      window.location.reload();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Inserisci email e password per continuare.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await onLogin(email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Credenziali non valide. Riprova.');
      }
    } catch (err) {
      setErrorMessage('Si è verificato un errore di connessione col server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const backendUrlActive = storageService.getItem('backend_ip') || 'http://localhost:3001';
      const res = await fetch(`${backendUrlActive}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: forgotEmail })
      });
      if (res.ok) {
        setIsSubmitted(true);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Errore nella richiesta di recupero. Riprova.');
      }
    } catch (err) {
      setErrorMessage('Si è verificato un errore di connessione col server.');
    } finally {
      setIsLoading(false);
    }
  };

  const accentColor = restaurantInfo?.accent_color || '#FF5C82';

  return (
    <div className="login-wrapper" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%',
      width: '100%',
      background: 'radial-gradient(circle at 20% 20%, #23233a 0%, #14141c 55%, #0b0b10 100%)',
      fontFamily: "'DM Sans', sans-serif",
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <style>{`
        .login-wrapper * {
          box-sizing: border-box;
          transition: background-color 0.2s, border-color 0.2s, color 0.2s;
        }
        .login-card {
          width: 420px;
          max-width: 100%;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.45);
          padding: 40px 30px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .login-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
        }
        .login-logo {
          height: 54px;
          object-fit: contain;
          margin-bottom: 8px;
        }
        .login-title {
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 700;
          color: #f5f5f7;
          margin: 0;
        }
        .login-subtitle {
          font-size: 0.85rem;
          color: #9a97a8;
          margin: 0;
          line-height: 1.4;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: #8b889a;
          letter-spacing: 0.5px;
        }
        .input-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          color: #6f6c80;
        }
        .login-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(255, 255, 255, 0.03);
          color: #f1f0f4;
          font-size: 0.9rem;
          outline: none;
          height: 44px;
        }
        .login-input:focus {
          border-color: ${accentColor};
          box-shadow: 0 0 0 3px ${accentColor}22;
        }
        .error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          line-height: 1.4;
        }
        .btn-login {
          background-color: ${accentColor};
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 46px;
          box-shadow: 0 8px 20px ${accentColor}40;
        }
        .btn-login:hover:not(:disabled) {
          filter: brightness(1.08);
        }
        .btn-login:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .demo-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 16px;
          margin-top: 8px;
        }
        .demo-title {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          color: #6f6c80;
          letter-spacing: 0.5px;
          text-align: center;
        }
        .demo-btn {
          background: transparent;
          border: 1px dashed rgba(255, 255, 255, 0.15);
          color: #9a97a8;
          padding: 6px 4px;
          border-radius: 6px;
          font-size: 0.68rem;
          font-weight: 500;
          cursor: pointer;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .demo-btn:hover {
          background-color: rgba(255, 255, 255, 0.04);
          border-color: ${accentColor};
          color: #fff;
        }
      `}</style>

      <div className="login-card">
        <div className="login-header">
          <img
            className="login-logo"
            src={restaurantInfo?.logo || "/icon.svg"}
            alt={restaurantInfo?.name || "Specchietto logo"}
            style={{ filter: 'brightness(0) invert(1)' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/icon.svg';
            }}
          />
          <h1 className="login-title">
            {restaurantInfo?.name || 'Specchietto'}
            <span style={{ fontWeight: '300', color: '#c9c7d3', marginLeft: '4px' }}>Admin</span>
          </h1>
          <p className="login-subtitle">
            Accedi per gestire gli appuntamenti, i servizi e le impostazioni del tuo salone.
          </p>
        </div>

        {errorMessage && (
          <div className="error-banner">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {view === 'login' ? (
          <>
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Professionale</label>
                <div className="input-container">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    className="login-input"
                    placeholder="es: admin@ilmiosalone.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-container">
                  <Lock size={16} className="input-icon" />
                  <input
                    type="password"
                    className="login-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
                <button
                  type="button"
                  onClick={() => { setView('forgot'); setIsSubmitted(false); setErrorMessage(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9a97a8',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  Password dimenticata?
                </button>
              </div>

              <button type="submit" className="btn-login" disabled={isLoading}>
                {isLoading ? 'Connessione in corso...' : 'Accedi al Pannello'}
                {!isLoading && <ArrowRight size={16} />}
              </button>
              {onBack && (
                <button
                  type="button"
                  className="demo-btn"
                  style={{ width: '100%', padding: '10px', marginTop: '8px' }}
                  onClick={onBack}
                  disabled={isLoading}
                >
                  Torna alla Landing Page
                </button>
              )}
            </form>
          </>
        ) : (
          /* FORGOT PASSWORD VIEW */
          isSubmitted ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', padding: '10px 0' }}>
              <p style={{ fontSize: '0.85rem', color: '#f1f0f4', lineHeight: '1.6', margin: 0 }}>
                Se l'indirizzo email inserito esiste nei nostri sistemi, riceverai a breve un'email contenente il link di reimpostazione della password (valido per 1 ora).
              </p>
              <button
                type="button"
                className="btn-login"
                style={{ width: '100%' }}
                onClick={() => { setView('login'); setIsSubmitted(false); setErrorMessage(''); }}
              >
                Torna al Login
              </button>
            </div>
          ) : (
            <form className="login-form" onSubmit={handleForgotPasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Inserisci la tua email</label>
                <div className="input-container">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    className="login-input"
                    placeholder="es: admin@ilmiosalone.it"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-login" disabled={isLoading}>
                {isLoading ? 'Invio in corso...' : 'Invia Link di Recupero'}
                {!isLoading && <ArrowRight size={16} />}
              </button>

              <button
                type="button"
                className="demo-btn"
                style={{ width: '100%', padding: '10px', marginTop: '10px' }}
                onClick={() => { setView('login'); setErrorMessage(''); }}
                disabled={isLoading}
              >
                Torna al Login
              </button>
            </form>
          )
        )}

        {isNative && (
          <div className="demo-section">
            <div className="demo-title" style={{ marginBottom: '8px' }}>IP Server Backend (Mac/PC)</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="es: 192.168.1.15"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  color: '#f1f0f4',
                  fontSize: '0.8rem',
                  outline: 'none',
                  fontFamily: 'monospace'
                }}
              />
              <button
                type="button"
                onClick={handleSaveIp}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: accentColor,
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif"
                }}
              >
                Salva
              </button>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#6f6c80', marginTop: '4px', textAlign: 'center' }}>
              IP Attivo: <span style={{ color: accentColor, fontFamily: 'monospace', fontWeight: 'bold' }}>{currentIp || '192.168.1.100'}</span> (Porta :3001)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
