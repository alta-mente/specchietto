const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
let code = fs.readFileSync(serverFile, 'utf8');

// 1. Database schema
if (!code.includes('ALTER TABLE resources ADD COLUMN user_id TEXT')) {
  code = code.replace(
    /CREATE TABLE IF NOT EXISTS services \(/,
    `try { await dbRun("ALTER TABLE resources ADD COLUMN user_id TEXT"); } catch(e) {}\n    await dbRun(\`\n      CREATE TABLE IF NOT EXISTS services (`
  );
}

// 2. Login modification
if (!code.includes('userResponse.resource_id = resource.id')) {
  code = code.replace(
    /res\.json\(userResponse\);/,
    `if (user.role === 'staff') {
        const resource = await dbGet('SELECT id FROM resources WHERE user_id = ?', [user.id]);
        if (resource) userResponse.resource_id = resource.id;
      }
      res.json(userResponse);`
  );
}

// 3. New endpoint for staff credentials
if (!code.includes('app.post(\'/api/resources/:id/user\'')) {
  code = code.replace(
    /app\.delete\('\/api\/resources\/:id', requireAuth, async \(req, res\) => \{[\s\S]*?\}\);/,
    `$&

// Crea credenziali di accesso per un dipendente (staff)
app.post('/api/resources/:id/user', requireAuth, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e password richiesti' });
    
    const resource = await dbGet('SELECT * FROM resources WHERE id = ?', [req.params.id]);
    if (!resource) return res.status(404).json({ error: 'Risorsa non trovata' });

    const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) return res.status(400).json({ error: 'Email già in uso da un altro account' });

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    const userId = 'usr-' + Math.random().toString(36).substr(2, 9);
    
    await dbRun(
      'INSERT INTO users (id, restaurant_id, email, password_hash, salt, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, resource.restaurant_id, email, hash, salt, 'staff', Date.now()]
    );
    
    await dbRun('UPDATE resources SET user_id = ? WHERE id = ?', [userId, resource.id]);
    
    res.json({ success: true, message: 'Accesso creato con successo' });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});`
  );
}

fs.writeFileSync(serverFile, code);
console.log('Done injecting staff auth logic to server.js');
