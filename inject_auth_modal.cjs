const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/ResourcesTab.jsx');
let code = fs.readFileSync(file, 'utf8');

// 1. Add storageService import if needed
if (!code.includes("import { storageService }")) {
  code = code.replace(/import React, { useState } from 'react';/, "import React, { useState } from 'react';\nimport { storageService } from '../services/api';");
}

// 2. Add ResourceAuthModal component before ResourcesTab
if (!code.includes('ResourceAuthModal =')) {
  const modalCode = `
const ResourceAuthModal = ({ resource, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const { backendUrl } = require('../services/backendUrl');
      const res = await fetch(\`\${backendUrl}/api/resources/\${resource.id}/user\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${storageService.getToken()}\`
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Accesso creato! Il dipendente può ora usare queste credenziali per accedere.');
      setTimeout(onClose, 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90vw' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Crea Accesso per {resource.name}</h3>
        {success ? (
          <div style={{ color: '#10b981', fontWeight: 'bold' }}>{success}</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Crea un account per questo dipendente. Potrà fare login per vedere solo il suo calendario.</p>
            <input type="email" placeholder="Email (es. mario@salone.it)" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="Password temporanea" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
            {error && <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'transparent' }}>Annulla</button>
              <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#38bdf8', color: '#fff', fontWeight: 'bold' }}>{loading ? 'Salvataggio...' : 'Crea'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

`;
  code = code.replace(/const ResourcesTab = \(\{ sync \}\) => \{/, modalCode + '$&');
}

// 3. Add authResource state
if (!code.includes('authResource')) {
  code = code.replace(
    /const \[newName, setNewName\] = useState\(''\);/,
    `$&
  const [authResource, setAuthResource] = useState(null);`
  );
}

// 4. Render modal and button
if (!code.includes('setAuthResource(resource)')) {
  // Add button next to delete
  code = code.replace(
    /<button\s+onClick=\{\(\) => sync\.deleteResource\(resource\.id\)\}/g,
    `<button onClick={() => setAuthResource(resource)} style={{ border: 'none', background: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.8rem', marginRight: '16px' }}>Crea Accesso App</button>
              $&`
  );

  // Render modal
  code = code.replace(
    /<\/div>\s*<ResourceServicesEditor/,
    `</div>
          {authResource?.id === resource.id && <ResourceAuthModal resource={resource} onClose={() => setAuthResource(null)} />}
          <ResourceServicesEditor`
  );
}

fs.writeFileSync(file, code);
console.log('Done injecting UI to ResourcesTab.jsx');
