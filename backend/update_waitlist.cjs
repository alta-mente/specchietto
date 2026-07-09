const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
let code = fs.readFileSync(serverFile, 'utf8');

// 1. Add DB migration
if (!code.includes('ALTER TABLE waitlist ADD COLUMN customer_email TEXT')) {
  code = code.replace(
    /CREATE TABLE IF NOT EXISTS coupons \(/,
    `try { await dbRun("ALTER TABLE waitlist ADD COLUMN customer_email TEXT"); } catch(e) {}\n    await dbRun(\`\n      CREATE TABLE IF NOT EXISTS coupons (`
  );
}

// 2. Update waitlist POST route body
code = code.replace(
  /const { restaurant_id, customer_name, customer_phone, date_requested, time_preference, notes } = req.body;/,
  `const { restaurant_id, customer_name, customer_phone, customer_email, date_requested, time_preference, notes } = req.body;`
);

// 3. Update waitlist INSERT
code = code.replace(
  /INSERT INTO waitlist \(id, restaurant_id, customer_name, customer_phone, date_requested, time_preference, notes, status, timestamp\)\n\s+VALUES \(\?, \?, \?, \?, \?, \?, \?, 'waiting', \?\)/,
  `INSERT INTO waitlist (id, restaurant_id, customer_name, customer_phone, customer_email, date_requested, time_preference, notes, status, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'waiting', ?)`
);
code = code.replace(
  /\[id, restaurant_id, customer_name, customer_phone, date_requested, time_preference \|\| 'any', notes \|\| '', Date\.now\(\)\]/,
  `[id, restaurant_id, customer_name, customer_phone, customer_email || '', date_requested, time_preference || 'any', notes || '', Date.now()]`
);

// 4. Update customer CRM insert
code = code.replace(
  /INSERT OR IGNORE INTO customers \(phone, restaurant_id, name, created_at\)/,
  `INSERT OR IGNORE INTO customers (phone, restaurant_id, name, email, created_at)`
);
code = code.replace(
  /\[customer_phone\.trim\(\), restaurant_id, customer_name\.trim\(\), Date\.now\(\)\]/,
  `[customer_phone.trim(), restaurant_id, customer_name.trim(), (customer_email || '').trim(), Date.now()]`
);

fs.writeFileSync(serverFile, code);
console.log('Done updating server.js for waitlist customer_email');
