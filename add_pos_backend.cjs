const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'backend/server.js');
let code = fs.readFileSync(serverFile, 'utf8');

// 1. Add transactions table to initDb
if (!code.includes('CREATE TABLE IF NOT EXISTS transactions')) {
  code = code.replace(
    /CREATE TABLE IF NOT EXISTS reviews \(/,
    `CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT,
        appointment_id TEXT UNIQUE,
        customer_name TEXT,
        customer_phone TEXT,
        total_amount REAL,
        payment_method TEXT,
        items TEXT,
        discount_code TEXT,
        timestamp INTEGER
      )
    \`);
    await dbRun(\`
      CREATE TABLE IF NOT EXISTS reviews (`
  );
}

// 2. Add POS endpoints
if (!code.includes('app.get(\'/api/transactions\'')) {
  const posEndpoints = `
// TRANSACTIONS / POS ENDPOINTS
app.get('/api/transactions', requireAuth, async (req, res) => {
  try {
    const { restaurant_id } = req.query;
    if (!checkScope(req, res, restaurant_id)) return;
    const transactions = await dbAll('SELECT * FROM transactions WHERE restaurant_id = ? ORDER BY timestamp DESC', [restaurant_id]);
    res.json(transactions);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', requireAuth, async (req, res) => {
  try {
    const { restaurant_id, appointment_id, total_amount, payment_method, items, discount_code } = req.body;
    if (!checkScope(req, res, restaurant_id)) return;
    
    const existing = await dbGet('SELECT * FROM appointments WHERE id = ?', [appointment_id]);
    if (!existing) return res.status(404).json({ error: 'Appuntamento non trovato' });

    const transId = 'txn-' + Math.random().toString(36).substr(2, 9);
    await dbRun(
      'INSERT INTO transactions (id, restaurant_id, appointment_id, customer_name, customer_phone, total_amount, payment_method, items, discount_code, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [transId, restaurant_id, appointment_id, existing.customer_name, existing.customer_phone, total_amount, payment_method, JSON.stringify(items), discount_code, Date.now()]
    );
    
    // Update appointment status to completed and trigger the loyalty/email logic
    await dbRun('UPDATE appointments SET status = ? WHERE id = ?', ['completed', appointment_id]);
    
    // Incrementa punti fedeltà
    if (existing.customer_phone) {
      const restaurant = await dbGet('SELECT * FROM restaurants WHERE id = ?', [restaurant_id]);
      if (restaurant && restaurant.loyalty_enabled === 1) {
        const points = Math.floor(total_amount * (restaurant.loyalty_points_per_euro || 1));
        if (points > 0) {
          await dbRun(
            'UPDATE customers SET loyalty_points = loyalty_points + ? WHERE phone = ? AND restaurant_id = ?',
            [points, existing.customer_phone, restaurant_id]
          );
        }
      }
    }
    
    // Invio email recensione (usiamo sendEmailNotification che usa resend)
    if (existing.customer_email && existing.survey_sent === 0) {
      try {
        const html = \`<p>Ciao \${existing.customer_name},</p><p>Speriamo che il tuo appuntamento sia andato alla grande!</p><p>Ti andrebbe di lasciarci una recensione? Ci vorranno solo 10 secondi.</p><p><a href="https://specchietto-booking.vercel.app/leave-review/\${existing.id}" style="display:inline-block;padding:12px 24px;background:#FF5C82;color:#fff;text-decoration:none;border-radius:8px;">Lascia una Recensione</a></p>\`;
        await sendEmailNotification(existing.customer_email, 'Come ti sei trovato?', html);
        await dbRun('UPDATE appointments SET survey_sent = 1 WHERE id = ?', [existing.id]);
      } catch (e) {
        console.error('Errore invio email recensione:', e);
      }
    }
    
    const updated = await dbGet('SELECT * FROM appointments WHERE id = ?', [appointment_id]);
    io.to(restaurant_id).emit('appointmentUpdated', updated);
    
    const newTx = await dbGet('SELECT * FROM transactions WHERE id = ?', [transId]);
    res.json({ success: true, transaction: newTx, appointment: updated });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

`;
  
  code = code.replace(
    /\/\/\/ \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*/,
    posEndpoints + '\n$&'
  );
}

fs.writeFileSync(serverFile, code);
console.log('Done injecting POS backend');
