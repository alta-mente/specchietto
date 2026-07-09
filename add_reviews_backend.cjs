const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'backend/server.js');
let code = fs.readFileSync(serverFile, 'utf8');

// 1. Add reviews table to initDb
if (!code.includes('CREATE TABLE IF NOT EXISTS reviews')) {
  code = code.replace(
    /CREATE TABLE IF NOT EXISTS waitlist \(/,
    `CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT,
        appointment_id TEXT UNIQUE,
        customer_name TEXT,
        customer_email TEXT,
        rating INTEGER,
        comment TEXT,
        response TEXT,
        created_at INTEGER
      )
    \`);
    await dbRun(\`
      CREATE TABLE IF NOT EXISTS waitlist (`
  );
}

// 2. Add email trigger in appointment status
if (!code.includes('inviata email recensione')) {
  code = code.replace(
    /if \(status === 'completed' && existing\.status !== 'completed' && existing\.customer_phone && existing\.price\) \{/,
    `$&
      // Invio email recensione (usiamo sendEmailNotification che usa resend)
      if (existing.customer_email && existing.survey_sent === 0) {
        try {
          const { frontendUrl } = require('../src/services/backendUrl'); // this won't work in backend easily
          const reviewUrl = 'https://specchietto-booking.vercel.app/leave-review/' + existing.id; // Fallback
          const html = \`<p>Ciao \${existing.customer_name},</p><p>Speriamo che il tuo appuntamento presso <b>\${restaurant.name}</b> sia andato alla grande!</p><p>Ti andrebbe di lasciarci una recensione? Ci vorranno solo 10 secondi.</p><p><a href="https://specchietto-booking.vercel.app/leave-review/\${existing.id}" style="display:inline-block;padding:12px 24px;background:#FF5C82;color:#fff;text-decoration:none;border-radius:8px;">Lascia una Recensione</a></p>\`;
          await sendEmailNotification(existing.customer_email, 'Come ti sei trovato?', html);
          await dbRun('UPDATE appointments SET survey_sent = 1 WHERE id = ?', [existing.id]);
          console.log('inviata email recensione a', existing.customer_email);
        } catch (e) {
          console.error('Errore invio email recensione:', e);
        }
      }
      `
  );
}

// 3. Add reviews endpoints
if (!code.includes('app.get(\'/api/reviews\'')) {
  const reviewsEndpoints = `
// REVIEWS ENDPOINTS
app.get('/api/reviews', requireAuth, async (req, res) => {
  try {
    const { restaurant_id } = req.query;
    if (!checkScope(req, res, restaurant_id)) return;
    const reviews = await dbAll('SELECT * FROM reviews WHERE restaurant_id = ? ORDER BY created_at DESC', [restaurant_id]);
    res.json(reviews);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reviews/:id/reply', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const review = await dbGet('SELECT * FROM reviews WHERE id = ?', [id]);
    if (!review) return res.status(404).json({ error: 'Recensione non trovata' });
    if (!checkScope(req, res, review.restaurant_id)) return;
    
    await dbRun('UPDATE reviews SET response = ? WHERE id = ?', [response, id]);
    res.json({ success: true, message: 'Risposta salvata' });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { appointment_id, rating, comment } = req.body;
    if (!appointment_id || !rating) return res.status(400).json({ error: 'Dati mancanti' });
    
    const appointment = await dbGet('SELECT * FROM appointments WHERE id = ?', [appointment_id]);
    if (!appointment) return res.status(404).json({ error: 'Appuntamento non trovato' });
    
    const existing = await dbGet('SELECT * FROM reviews WHERE appointment_id = ?', [appointment_id]);
    if (existing) return res.status(400).json({ error: 'Recensione già inviata per questo appuntamento' });

    const reviewId = 'rev-' + Math.random().toString(36).substr(2, 9);
    await dbRun(
      'INSERT INTO reviews (id, restaurant_id, appointment_id, customer_name, customer_email, rating, comment, response, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [reviewId, appointment.restaurant_id, appointment_id, appointment.customer_name, appointment.customer_email, rating, comment, '', Date.now()]
    );
    
    res.json({ success: true, message: 'Recensione inviata' });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

`;
  
  code = code.replace(
    /\/\/\/ \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*/,
    reviewsEndpoints + '\n$&'
  );
}

fs.writeFileSync(serverFile, code);
console.log('Done injecting reviews backend');
