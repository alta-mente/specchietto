const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/Dashboard.jsx');
let code = fs.readFileSync(file, 'utf8');

// 1. Add io import
if (!code.includes("import { io }")) {
  code = code.replace(/import React, { useState } from 'react';/, "import React, { useState, useEffect } from 'react';\nimport { io } from 'socket.io-client';\nimport { getBackendUrl } from '../services/backendUrl';");
}

// 2. Add toast state and useEffect
if (!code.includes("const [toast, setToast]")) {
  code = code.replace(
    /const needsTenantSelection = isSuperAdmin && !sync.restaurantId;/,
    `$&
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!sync.restaurantId) return;
    const socket = io(getBackendUrl());
    
    socket.on('connect', () => {
      socket.emit('joinRestaurant', sync.restaurantId);
    });

    socket.on('appointmentCreated', (appointment) => {
      if (sync.user?.role === 'staff' && sync.user.resource_id && appointment.resource_id !== sync.user.resource_id) return;
      
      setToast(\`Nuovo appuntamento da \${appointment.customer_name} (\${appointment.service_name})\`);
      if (sync.refreshAppointments) sync.refreshAppointments();
      
      setTimeout(() => setToast(null), 5000);
    });

    return () => socket.disconnect();
  }, [sync.restaurantId, sync.user]);`
  );
}

// 3. Render toast UI
if (!code.includes("toast && (")) {
  code = code.replace(
    /<\/div>\s*$/m,
    `
      {toast && (
        <div className="animate-fade-up" style={{
          position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#10b981', color: '#fff',
          padding: '16px 24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
          display: 'flex', alignItems: 'center', gap: '12px', zIndex: 9999, fontWeight: '600'
        }}>
          <span>🔔</span> {toast}
        </div>
      )}
    </div>`
  );
}

fs.writeFileSync(file, code);
console.log('Done injecting notifications to Dashboard');
