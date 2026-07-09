import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import admin from 'firebase-admin';
import { config } from 'dotenv';
import { Resend } from 'resend';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env regardless of the process's cwd
config({ path: join(__dirname, '.env') });

// Firebase Admin SDK dynamic initialization (checks both env variable and local folder/repository root for Render)
const firebaseKeyPathInBackend = join(__dirname, 'firebase-service-account.json');
const firebaseKeyPathInRoot = join(__dirname, '..', 'firebase-service-account.json');

let firebaseKeyPath = firebaseKeyPathInBackend;
if (!existsSync(firebaseKeyPath) && existsSync(firebaseKeyPathInRoot)) {
  firebaseKeyPath = firebaseKeyPathInRoot;
}

let firebaseInitialized = false;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    console.log('🔥 Firebase Admin SDK inizializzato con successo tramite variabile d\'ambiente.');
  } catch (err) {
    console.error('⚠️ Errore durante l\'inizializzazione di Firebase Admin tramite variabile d\'ambiente:', err);
  }
} else if (existsSync(firebaseKeyPath)) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseKeyPath)
    });
    firebaseInitialized = true;
    console.log('🔥 Firebase Admin SDK inizializzato con successo da file.');
  } catch (err) {
    console.error('⚠️ Errore durante l\'inizializzazione di Firebase Admin da file:', err);
  }
} else {
  console.log('ℹ️ File firebase-service-account.json e variabile FIREBASE_SERVICE_ACCOUNT non trovati. Le notifiche push non saranno inviate (modalità simulata).');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' })); // alzato per permettere upload avatar come base64

// PORT settings
const PORT = process.env.PORT || 3001;

// Database connection configuration (Hybrid: Turso Cloud / SQLite Local)
const useTurso = !!process.env.TURSO_DATABASE_URL;
let libsqlClient = null;
let sqliteDb = null;

if (useTurso) {
  console.log('☁️ Connessione al database cloud Turso in corso...');
  libsqlClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
} else {
  const dbPath = process.env.DATABASE_URL || join(__dirname, 'orders.db');
  console.log('💾 Connessione al database SQLite locale in:', dbPath);
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Errore durante la connessione al database SQLite locale:', err);
    } else {
      console.log('Database SQLite locale connesso correttamente.');
    }
  });
}

// Unified Promise Wrappers (handles both standard sqlite3 and libsql client)
const dbRun = async (query, params = []) => {
  if (useTurso) {
    return await libsqlClient.execute({ sql: query, args: params });
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(query, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }
};

const dbAll = async (query, params = []) => {
  if (useTurso) {
    const res = await libsqlClient.execute({ sql: query, args: params });
    return res.rows.map(row => {
      const plain = {};
      res.columns.forEach((col, idx) => {
        plain[col] = row[col] !== undefined ? row[col] : row[idx];
      });
      return plain;
    });
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

const dbGet = async (query, params = []) => {
  if (useTurso) {
    const res = await libsqlClient.execute({ sql: query, args: params });
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    const plain = {};
    res.columns.forEach((col, idx) => {
      plain[col] = row[col] !== undefined ? row[col] : row[idx];
    });
    return plain;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

// Password Hashing & Verification Utilities
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
};

const verifyPassword = (password, salt, hash) => {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

// Initialize Database schema and seed initial data
const initDb = async () => {
  try {
    // 1. Create restaurants table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id TEXT PRIMARY KEY,
        name TEXT,
        slug TEXT UNIQUE,
        logo TEXT,
        primary_color TEXT,
        accent_color TEXT,
        loyalty_enabled INTEGER DEFAULT 0,
        loyalty_points_per_euro INTEGER DEFAULT 1,
        loyalty_reward_threshold INTEGER DEFAULT 500,
        loyalty_reward_value REAL DEFAULT 10.0,
        active INTEGER DEFAULT 1,
        plan TEXT DEFAULT 'starter',
        created_at INTEGER
      )
    `);

    // Add active column to restaurants in case of migration
    try {
      await dbRun(`ALTER TABLE restaurants ADD COLUMN active INTEGER DEFAULT 1`);
    } catch (err) {
      // Column already exists
    }

    // 3. Recreate settings and devices tables to support composite primary keys
    const settingsColumns = await dbAll("PRAGMA table_info(settings)");
    const hasRestaurantIdSettings = settingsColumns.some(c => c.name === 'restaurant_id');
    if (settingsColumns.length > 0 && !hasRestaurantIdSettings) {
      console.log('Migrazione settings: droppo la vecchia tabella singola...');
      await dbRun(`DROP TABLE settings`);
    }

    await dbRun(`
      CREATE TABLE IF NOT EXISTS settings (
        restaurant_id TEXT,
        key TEXT,
        value TEXT,
        PRIMARY KEY (restaurant_id, key)
      )
    `);

    const devicesColumns = await dbAll("PRAGMA table_info(devices)");
    const hasRestaurantIdDevices = devicesColumns.some(c => c.name === 'restaurant_id');
    if (devicesColumns.length > 0 && !hasRestaurantIdDevices) {
      console.log('Migrazione devices: droppo la vecchia tabella singola...');
      await dbRun(`DROP TABLE devices`);
    }

    await dbRun(`
      CREATE TABLE IF NOT EXISTS devices (
        token TEXT,
        restaurant_id TEXT,
        timestamp INTEGER,
        PRIMARY KEY (token, restaurant_id)
      )
    `);

    // Create customers table for CRM profiling
    await dbRun(`
      CREATE TABLE IF NOT EXISTS customers (
        phone TEXT,
        restaurant_id TEXT,
        name TEXT,
        email TEXT,
        notes TEXT,
        no_show_count INTEGER DEFAULT 0,
        blocked INTEGER DEFAULT 0,
        loyalty_points INTEGER DEFAULT 0,
        created_at INTEGER,
        PRIMARY KEY (phone, restaurant_id)
      )
    `);

    // Create surveys table for reputation funnel
    await dbRun(`
      CREATE TABLE IF NOT EXISTS surveys (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT,
        order_id TEXT UNIQUE,
        customer_name TEXT,
        customer_email TEXT,
        rating_food INTEGER,
        rating_service INTEGER,
        rating_atmosphere INTEGER,
        average_rating REAL,
        comment TEXT,
        request_callback INTEGER DEFAULT 0,
        resolved INTEGER DEFAULT 0,
        created_at INTEGER
      )
    `);

    // Migrate surveys to add review_email_sent column
    try {
      await dbRun(`ALTER TABLE surveys ADD COLUMN review_email_sent INTEGER DEFAULT 0`);
    } catch (err) {
      // Column already exists
    }

    // Create whatsapp_logs table for simulated message dispatch
    await dbRun(`
      CREATE TABLE IF NOT EXISTS whatsapp_logs (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT,
        phone TEXT,
        message TEXT,
        status TEXT,
        timestamp INTEGER
      )
    `);

    // 8. Create users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT,
        email TEXT UNIQUE,
        password_hash TEXT,
        salt TEXT,
        role TEXT,
        created_at INTEGER
      )
    `);

    // Add reset_token columns to users if they don't exist
    try {
      await dbRun('ALTER TABLE users ADD COLUMN reset_token TEXT');
    } catch (e) {}
    try {
      await dbRun('ALTER TABLE users ADD COLUMN reset_token_expires INTEGER');
    } catch (e) {}

    // 9. Create sessions table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT,
        restaurant_id TEXT,
        role TEXT,
        expires_at INTEGER
      )
    `);

    // 9.5. Create leads table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        restaurant_name TEXT,
        name TEXT,
        email TEXT,
        phone TEXT,
        timestamp INTEGER
      )
    `);

    // 10. Create resources table (operatori/postazioni prenotabili)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT,
        name TEXT,
        type TEXT DEFAULT 'operator',
        photo_url TEXT,
        color TEXT,
        active INTEGER DEFAULT 1,
        created_at INTEGER
      )
    `);

    // 11. Create services table (servizi con durata, sostituisce il menu piatti)
    try { await dbRun("ALTER TABLE resources ADD COLUMN user_id TEXT"); } catch(e) {}

    await dbRun(`
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT,
        category TEXT,
        name TEXT,
        description TEXT,
        price REAL,
        duration_minutes INTEGER,
        is_addon INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at INTEGER
      )
    `);

    // 12. Create resource_services table (quali servizi puo' eseguire ogni operatore)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS resource_services (
        resource_id TEXT,
        service_id TEXT,
        PRIMARY KEY (resource_id, service_id)
      )
    `);

    // 13. Create resource_hours table (orario settimanale ricorrente per operatore)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS resource_hours (
        id TEXT PRIMARY KEY,
        resource_id TEXT,
        day_of_week INTEGER,
        open_time TEXT,
        close_time TEXT
      )
    `);

    // 14. Create resource_exceptions table (ferie, chiusure straordinarie, orari speciali)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS resource_exceptions (
        id TEXT PRIMARY KEY,
        resource_id TEXT,
        date TEXT,
        closed INTEGER DEFAULT 1,
        open_time TEXT,
        close_time TEXT
      )
    `);

    // 15. Create appointments table (sostituisce orders per il caso d'uso appuntamenti)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT,
        resource_id TEXT,
        service_id TEXT,
        service_name TEXT,
        duration_minutes INTEGER,
        price REAL,
        customer_name TEXT,
        customer_phone TEXT,
        customer_email TEXT,
        date TEXT,
        time TEXT,
        notes TEXT,
        status TEXT,
        reason TEXT,
        survey_sent INTEGER DEFAULT 0,
        source TEXT DEFAULT 'direct',
        has_guarantee INTEGER DEFAULT 0,
        timestamp INTEGER
      )
    `);

    // Migrations for appointments table
    try {
      await dbRun(`ALTER TABLE appointments ADD COLUMN reminder_sent INTEGER DEFAULT 0`);
    } catch (e) { /* column exists */ }
    
    try {
      await dbRun(`ALTER TABLE appointments ADD COLUMN review_sent INTEGER DEFAULT 0`);
    } catch (e) { /* column exists */ }

    await dbRun(`
      CREATE TABLE IF NOT EXISTS transactions (
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
    `);
    await dbRun(`
      CREATE TABLE IF NOT EXISTS reviews (
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
    `);
    await dbRun(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT,
        customer_name TEXT,
        customer_phone TEXT,
        date_requested TEXT,
        time_preference TEXT,
        notes TEXT,
        status TEXT DEFAULT 'waiting',
        timestamp INTEGER
      )
    `);

    try { await dbRun("ALTER TABLE waitlist ADD COLUMN customer_email TEXT"); } catch(e) {}
    
    await dbRun(`
      CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT,
        code TEXT,
        discount_type TEXT,
        discount_value REAL,
        active INTEGER DEFAULT 1,
        created_at INTEGER
      )
    `);

    // Seed default users if empty
    const usersCount = await dbGet('SELECT COUNT(*) as count FROM users');
    if (usersCount.count === 0) {
      console.log('Tabella users vuota. Creo gli utenti amministrativi di default...');
      const DEFAULT_USERS = [
        { id: 'usr-1', restaurant_id: null, email: 'superadmin@specchietto.app', password: 'changeme123', role: 'super_admin' }
      ];

      for (const u of DEFAULT_USERS) {
        const { salt, hash } = hashPassword(u.password);
        await dbRun(`
          INSERT INTO users (id, restaurant_id, email, password_hash, salt, role, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [u.id, u.restaurant_id, u.email, hash, salt, u.role, Date.now()]);
      }
      console.log('Seeding utenti completato.');
    }

  } catch (err) {
    console.error('Errore durante l\'inizializzazione del database:', err);
  }
};
initDb();

// Configurazione Resend per le notifiche email
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM = process.env.RESEND_FROM || process.env.RESEND_FROM || 'onboarding@resend.dev';

let resendClient = null;

if (RESEND_API_KEY) {
  resendClient = new Resend(RESEND_API_KEY);
  console.log('✉️ Servizio email configurato con successo tramite Resend API.');
} else {
  console.log('ℹ️ RESEND_API_KEY non configurata. Le notifiche email saranno simulate.');
}

// Helper to extract dynamic frontend origin from request headers with safe fallbacks
const getOrigin = (req) => {
  if (!req) return 'https://specchietto.vercel.app';
  
  const origin = req.headers.origin || '';
  const referer = req.get('referer') || '';

  const isLocalDev = (str) => {
    return str.includes('localhost:5173') || str.includes('127.0.0.1:5173') || str.includes('localhost:3000');
  };

  if (isLocalDev(origin)) {
    return origin;
  }
  if (isLocalDev(referer)) {
    try {
      return new URL(referer).origin;
    } catch (e) {}
  }

  return 'https://specchietto.vercel.app';
};

// HTML Email Template Builder Helper
const buildHtmlEmail = (title, subtitle, contentHtml, ctaText = null, ctaUrl = null, footerText = null, restaurant = null) => {
  let logoUrl = 'https://specchietto.vercel.app/icon.png';
  let titleText = 'Specchietto';
  let primaryColor = '#FF9000'; // Default orange
  let accentColor = '#e67e22';

  if (restaurant) {
    titleText = restaurant.name;
    if (restaurant.logo) {
      logoUrl = restaurant.logo.startsWith('http') 
        ? restaurant.logo 
        : `https://specchietto.vercel.app${restaurant.logo}`;
    }
    if (restaurant.primary_color) {
      primaryColor = restaurant.primary_color;
    }
    if (restaurant.accent_color) {
      accentColor = restaurant.accent_color;
    }
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f6f9fc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #e6ebf1;
    }
    .email-header {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      padding: 32px;
      text-align: center;
      border-bottom: 1px solid #e2e8f0;
    }
    .email-logo {
      height: 48px;
      margin-bottom: 12px;
    }
    .email-header h1 {
      color: #0f172a;
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .email-header p {
      color: #64748b;
      margin: 4px 0 0 0;
      font-size: 14px;
    }
    .email-body {
      padding: 40px 32px;
      color: #334155;
      line-height: 1.6;
    }
    .email-body h2 {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
      border-bottom: 2px solid ${primaryColor}1a;
      padding-bottom: 8px;
    }
    .info-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .info-item {
      margin-bottom: 12px;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dashed #e2e8f0;
      padding-bottom: 8px;
    }
    .info-item:last-child {
      margin-bottom: 0;
      border-bottom: none;
      padding-bottom: 0;
    }
    .info-label {
      font-weight: 600;
      color: #64748b;
    }
    .info-value {
      color: #0f172a;
      text-align: right;
    }
    .dish-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }
    .dish-table th {
      text-align: left;
      padding: 10px;
      background-color: #f1f5f9;
      color: #475569;
      font-weight: 600;
    }
    .dish-table td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    .dish-total {
      text-align: right;
      font-weight: 700;
      font-size: 16px;
      color: ${primaryColor};
      margin-top: 16px;
    }
    .btn-cta-wrapper {
      text-align: center;
      margin: 24px 0;
    }
    .btn-cta {
      display: inline-block;
      background: linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 15px;
      text-align: center;
      box-shadow: 0 4px 10px ${primaryColor}33;
    }
    .email-footer {
      background-color: #f8fafc;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e6ebf1;
      font-size: 12px;
      color: #64748b;
    }
    .email-footer a {
      color: ${primaryColor};
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <img src="${logoUrl}" alt="${titleText} logo" class="email-logo" style="max-height: 48px; width: auto; object-fit: contain;">
      <h1>${titleText}</h1>
      <p>${subtitle}</p>
    </div>
    <div class="email-body">
      ${contentHtml}
      
      ${ctaText && ctaUrl ? `
        <div class="btn-cta-wrapper">
          <a href="${ctaUrl}" class="btn-cta">${ctaText}</a>
        </div>
      ` : ''}
    </div>
    <div class="email-footer">
      ${footerText ? `<p>${footerText}</p>` : ''}
      <p>&copy; ${new Date().getFullYear()} ${titleText}. Tutti i diritti riservati.<br>
      Piattaforma Gestione Appuntamenti • <a href="https://specchietto.vercel.app">specchietto.vercel.app</a></p>
    </div>
  </div>
</body>
</html>
  `;
};

const formatFriendlyDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const MONTHS = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];
  
  const DAYS = [
    'Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'
  ];
  
  const d = new Date(year, monthIdx, day);
  const dayOfWeek = DAYS[d.getDay()];
  const monthName = MONTHS[monthIdx];
  
  if (dayOfWeek && monthName) {
    return `${dayOfWeek} ${day} ${monthName} ${year}`;
  }
  return dateStr;
};

// Helper to send email alert to Super Admin on new restaurant registration
const sendSuperAdminRestaurantAlert = async (newRestaurant, adminEmail, adminPassword) => {
  const adminRecipient = 'arocchi@gmail.com';
  
  const subject = `[SaaS Platform] Nuovo ristorante registrato: ${newRestaurant.name}`;
  const body = `Un nuovo ristorante si è registrato sulla piattaforma SaaS.

Dettagli del Locale:
- ID Ristorante: ${newRestaurant.id}
- Nome Locale: ${newRestaurant.name}
- Slug: ${newRestaurant.slug}
- Colore Primario: ${newRestaurant.primary_color}
- Colore Accento: ${newRestaurant.accent_color}
- Data Registrazione: ${new Date(newRestaurant.created_at).toLocaleString('it-IT')}

L'account amministrativo di default creato per il gestore è:
- Email Amministratore: ${adminEmail}
- Password Temporanea: ${adminPassword}

Il locale è stato inizializzato con i parametri e i piatti di cortesia di default.`;

  const contentHtml = `
    <h2>Dettagli Locale Registrato</h2>
    <div class="info-card">
      <div class="info-item">
        <span class="info-label">ID Ristorante:</span>
        <span class="info-value">${newRestaurant.id}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Nome Ristorante:</span>
        <span class="info-value">${newRestaurant.name}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Slug (Sottodominio):</span>
        <span class="info-value" style="font-weight: bold; color: #ff9000;">${newRestaurant.slug}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Colore Primario:</span>
        <span class="info-value" style="color: ${newRestaurant.primary_color}; font-weight: bold;">${newRestaurant.primary_color}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Colore Accento:</span>
        <span class="info-value" style="color: ${newRestaurant.accent_color}; font-weight: bold;">${newRestaurant.accent_color}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Data Registrazione:</span>
        <span class="info-value">${new Date(newRestaurant.created_at).toLocaleString('it-IT')}</span>
      </div>
    </div>

    <h2>Credenziali Amministratore Locale</h2>
    <div class="info-card" style="background-color: #ecfdf5; border: 1px solid #a7f3d0;">
      <div class="info-item">
        <span class="info-label" style="color: #047857;">Email Amministratore:</span>
        <span class="info-value" style="color: #064e3b; font-weight: bold;">${adminEmail}</span>
      </div>
      <div class="info-item">
        <span class="info-label" style="color: #047857;">Password Provvisoria:</span>
        <span class="info-value" style="color: #064e3b; font-weight: bold;">${adminPassword}</span>
      </div>
    </div>
    <p>Il locale è stato correttamente inizializzato con le impostazioni operative e il catalogo piatti di default.</p>
  `;

  const htmlBody = buildHtmlEmail(
    `Nuovo Locale Registrato`,
    `Registrazione tenant sulla piattaforma SaaS`,
    contentHtml,
    "Accedi alla Console SuperAdmin",
    "https://specchietto.vercel.app",
    null,
    newRestaurant
  );

  if (!resendClient) {
    console.log(`✉️ [Email SuperAdmin Simulata] Nuovo ristorante registrato: ${newRestaurant.name} (Email: ${adminEmail} / Pass: ${adminPassword})`);
    return;
  }

  try {
    let fromEmail = 'noreply@specchietto.app';
    if (RESEND_FROM) {
      const match = RESEND_FROM.match(/<([^>]+)>/);
      if (match && match[1]) {
        fromEmail = match[1];
      }
    }
    await resendClient.emails.send({
      from: `"SaaS Platform" <${fromEmail}>`,
      to: adminRecipient,
      subject: subject,
      text: body,
      html: htmlBody
    });
    console.log(`✉️ Notifica email inviata con successo al Super Admin: ${adminRecipient}`);
  } catch (err) {
    console.error('❌ Errore notifica email al Super Admin:', err);
  }
};

// TODO: non ancora richiamata da nessuna route — va agganciata al completamento
// di un appuntamento, quando definiremo il modello resources/services/appointments.
// Helper to send customer satisfaction survey email
const sendSurveyEmail = async (order, req = null) => {
  if (!order || !order.email || order.email.includes('walk-in') || order.email === 'Walk-in' || !order.email.includes('@')) {
    return;
  }
  const restId = order.restaurant_id || 'rest-1';
  let restaurantName = 'Specchietto';
  let restaurant = null;

  try {
    restaurant = await dbGet("SELECT name, logo, primary_color, accent_color FROM restaurants WHERE id = ?", [restId]);
    if (restaurant && restaurant.name) {
      restaurantName = restaurant.name;
    }
  } catch (err) {
    console.error("Errore nel recupero del ristorante per email sondaggio:", err);
  }

  const frontendUrl = process.env.FRONTEND_URL || getOrigin(req);

  const surveyUrl = `${frontendUrl}/#/survey?id=${order.id}`;

  const subject = `Com'è andata la tua esperienza da ${restaurantName}? 🍽️`;
  const body = `Ciao ${order.name},
grazie per essere stato nostro ospite da ${restaurantName}!

Ci piacerebbe molto sapere com'è andata la tua esperienza. Bastano solo 30 secondi del tuo tempo per aiutarci a migliorare.

Lascia la tua valutazione direttamente da questi link:
- 5 stelle (Eccellente): ${surveyUrl}&rating=5
- 4 stelle (Buono): ${surveyUrl}&rating=4
- 3 stelle (Sufficiente): ${surveyUrl}&rating=3
- 2 stelle (Insufficiente): ${surveyUrl}&rating=2
- 1 stella (Pessimo): ${surveyUrl}&rating=1

O scrivi una recensione completa:
${surveyUrl}

Un cordiale saluto,
Lo staff di ${restaurantName}`;

  const contentHtml = `
    <p>Ciao <strong>${order.name}</strong>,</p>
    <p>grazie per essere stato nostro ospite da <strong>${restaurantName}</strong>!</p>
    <p>Ci piacerebbe moltissimo sapere com'è andata la tua esperienza. Il tuo parere è prezioso e ci aiuta a offrirti un servizio sempre migliore.</p>
    
    <div style="background-color: #f7fafc; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center; border: 1px solid #edf2f7;">
      <p style="margin-top: 0; margin-bottom: 15px; font-weight: 600; color: #2d3748; font-size: 1.1rem;">Come valuteresti la tua esperienza?</p>
      
      <!-- Interactive Stars Row -->
      <div style="margin: 20px 0;">
        <a href="${surveyUrl}&rating=1" style="text-decoration: none; display: inline-block; margin: 0 4px;" title="Pessimo">
          <span style="font-size: 2.5rem; color: #ffb007; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">★</span>
        </a>
        <a href="${surveyUrl}&rating=2" style="text-decoration: none; display: inline-block; margin: 0 4px;" title="Insufficiente">
          <span style="font-size: 2.5rem; color: #ffb007; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">★</span>
        </a>
        <a href="${surveyUrl}&rating=3" style="text-decoration: none; display: inline-block; margin: 0 4px;" title="Sufficiente">
          <span style="font-size: 2.5rem; color: #ffb007; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">★</span>
        </a>
        <a href="${surveyUrl}&rating=4" style="text-decoration: none; display: inline-block; margin: 0 4px;" title="Buono">
          <span style="font-size: 2.5rem; color: #ffb007; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">★</span>
        </a>
        <a href="${surveyUrl}&rating=5" style="text-decoration: none; display: inline-block; margin: 0 4px;" title="Eccellente">
          <span style="font-size: 2.5rem; color: #ffb007; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">★</span>
        </a>
      </div>
      
      <p style="font-size: 0.85rem; color: #718096; margin-top: 5px; margin-bottom: 20px;">Clicca su una stella per iniziare il sondaggio rapido (30 secondi)</p>
      
      <div style="margin-top: 15px;">
        <a href="${surveyUrl}" class="email-cta" style="background-color: ${restaurant?.primary_color || '#ff9000'}; border-color: ${restaurant?.primary_color || '#ff9000'}; font-weight: bold; padding: 12px 28px; border-radius: 6px; color: #ffffff; text-decoration: none; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Scrivi una Recensione Dettagliata</a>
      </div>
    </div>
    
    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
    <p style="font-size: 0.8rem; color: #718096; text-align: center;">Se il pulsante non funziona, puoi copiare e incollare il seguente link nel tuo browser: <br/> <a href="${surveyUrl}" style="color: ${restaurant?.primary_color || '#ff9000'}; text-decoration: underline;">${surveyUrl}</a></p>
  `;

  const htmlBody = buildHtmlEmail(
    `Com'è andata da ${restaurantName}?`,
    `Il tuo parere è prezioso per noi`,
    contentHtml,
    null,
    null,
    `Ricevi questa email perché hai effettuato una prenotazione presso ${restaurantName}.`,
    restaurant
  );

  if (!resendClient) {
    console.log(`✉️ [Email Sondaggio Simulata] Inviata a ${order.email} per ordine ${order.id}. URL: ${surveyUrl}`);
    io.to(restId).emit('syncLog', {
      timestamp: Date.now(),
      type: 'info',
      message: `✉️ [Email Sondaggio Simulata] Inviata a ${order.email} (Link: /#/survey?id=${order.id})`
    });
    // Mark as sent
    try {
      await dbRun("UPDATE orders SET survey_sent = 1 WHERE id = ?", [order.id]);
    } catch (e) {
      console.error("Errore aggiornamento survey_sent:", e);
    }
    return;
  }

  try {
    let fromEmail = 'noreply@specchietto.app';
    if (RESEND_FROM) {
      const match = RESEND_FROM.match(/<([^>]+)>/);
      if (match && match[1]) {
        fromEmail = match[1];
      }
    }
    await resendClient.emails.send({
      from: `"${restaurantName}" <${fromEmail}>`,
      to: order.email,
      subject: subject,
      text: body,
      html: htmlBody
    });
    console.log(`✉️ Notifica email sondaggio inviata con successo a: ${order.email}`);
    io.to(restId).emit('syncLog', {
      timestamp: Date.now(),
      type: 'info',
      message: `✉️ Email sondaggio inviata con successo a: ${order.email}`
    });
    
    // Mark as sent
    try {
      await dbRun("UPDATE orders SET survey_sent = 1 WHERE id = ?", [order.id]);
    } catch (e) {
      console.error("Errore aggiornamento survey_sent:", e);
    }
  } catch (err) {
    console.error('❌ Errore notifica email sondaggio:', err);
  }
};

// Helper to send customer public review follow-up email
const sendFollowUpReviewEmail = async (survey) => {
  const restId = survey.restaurant_id || 'rest-1';
  let restaurantName = 'Specchietto';
  let restaurant = null;
  let googleReviewLink = '';
  let tripadvisorReviewLink = '';

  try {
    restaurant = await dbGet("SELECT name, logo, primary_color, accent_color FROM restaurants WHERE id = ?", [restId]);
    if (restaurant && restaurant.name) {
      restaurantName = restaurant.name;
    }
    
    // Get Google & TripAdvisor links from settings
    const settingsRows = await dbAll("SELECT key, value FROM settings WHERE restaurant_id = ?", [restId]);
    const settingsMap = {};
    settingsRows.forEach(row => {
      settingsMap[row.key] = row.value;
    });
    googleReviewLink = settingsMap['google_review_link'] || '';
    tripadvisorReviewLink = settingsMap['tripadvisor_review_link'] || '';
  } catch (err) {
    console.error("Errore nel recupero dati per email follow-up:", err);
  }

  // If both links are empty, skip sending the follow-up
  if (!googleReviewLink && !tripadvisorReviewLink) {
    console.log(`ℹ️ [Follow-up Recensione] Saltato per ristorante ${restId} perché non ha link configurati.`);
    return;
  }

  const subject = `Ci aiuti con una recensione su Google o TripAdvisor? ⭐`;
  const bodyText = `Ciao ${survey.customer_name},
grazie ancora per aver dedicato del tempo a lasciarci la tua valutazione positiva su ${restaurantName}!

Se ti va, ti andrebbe di condividere la tua esperienza anche con altri clienti? Bastano pochissimi secondi per copiare e incollare la tua recensione sui nostri canali ufficiali.

${googleReviewLink ? `Recensisci su Google: ${googleReviewLink}\n` : ''}${tripadvisorReviewLink ? `Recensisci su TripAdvisor: ${tripadvisorReviewLink}\n` : ''}
${survey.comment ? `Ecco il testo che avevi scritto, pronto da copiare:
"${survey.comment}"` : ''}

Grazie di cuore per il tuo prezioso supporto!
Lo staff di ${restaurantName}`;

  let contentHtml = `
    <p>Ciao <strong>${survey.customer_name}</strong>,</p>
    <p>grazie ancora per aver dedicato del tempo a lasciarci la tua valutazione positiva su <strong>${restaurantName}</strong>!</p>
    <p>Il tuo giudizio entusiasta ci rende molto felici. Se ti va, ti andrebbe di condividere la tua esperienza anche con altri clienti?</p>
    <p>Bastano pochissimi secondi per copiare e incollare la tua recensione sui nostri canali ufficiali:</p>
    
    <div style="margin: 30px 0; text-align: center;">
  `;

  if (googleReviewLink) {
    contentHtml += `
      <a href="${googleReviewLink}" style="background-color: #4285F4; font-weight: bold; padding: 12px 24px; border-radius: 6px; color: #ffffff; text-decoration: none; display: inline-block; margin: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        Recensisci su Google ⭐
      </a>
    `;
  }

  if (tripadvisorReviewLink) {
    contentHtml += `
      <a href="${tripadvisorReviewLink}" style="background-color: #34E0A1; font-weight: bold; padding: 12px 24px; border-radius: 6px; color: #ffffff; text-decoration: none; display: inline-block; margin: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        Recensisci su TripAdvisor 🦉
      </a>
    `;
  }

  contentHtml += `</div>`;

  if (survey.comment) {
    contentHtml += `
      <p style="margin-bottom: 5px;">Ecco il testo della tua recensione, pronto da copiare:</p>
      <div style="background-color: #f7fafc; border: 1px dashed #cbd5e0; padding: 15px; border-radius: 6px; margin: 10px 0; font-style: italic; color: #4a5568;">
        "${survey.comment}"
      </div>
      <p style="font-size: 0.85rem; color: #718096; text-align: center; margin-top: 0;">(Copia questo testo prima di cliccare sul link del canale scelto)</p>
    `;
  }

  contentHtml += `
    <p style="margin-top: 25px;">Grazie di cuore per il tuo prezioso supporto!</p>
    <p>Un cordiale saluto,<br/><strong>Lo staff di ${restaurantName}</strong></p>
  `;

  const htmlBody = buildHtmlEmail(
    `Ci aiuti su Google o TripAdvisor?`,
    `Condividi il tuo entusiasmo`,
    contentHtml,
    null,
    null,
    `Ricevi questa email in seguito alla tua valutazione positiva del servizio presso ${restaurantName}.`,
    restaurant
  );

  if (!resendClient) {
    console.log(`✉️ [Follow-up Recensione Simulata] Inviata a ${survey.customer_email} per feedback ${survey.id}`);
    io.to(restId).emit('syncLog', {
      timestamp: Date.now(),
      type: 'info',
      message: `✉️ [Follow-up Recensione Simulata] Inviata a ${survey.customer_email} per recensire su Google/TripAdvisor`
    });
    return;
  }

  try {
    let fromEmail = 'noreply@specchietto.app';
    if (RESEND_FROM) {
      const match = RESEND_FROM.match(/<([^>]+)>/);
      if (match && match[1]) {
        fromEmail = match[1];
      }
    }
    await resendClient.emails.send({
      from: `"${restaurantName}" <${fromEmail}>`,
      to: survey.customer_email,
      subject: subject,
      text: bodyText,
      html: htmlBody
    });
    console.log(`✉️ Email follow-up recensione inviata con successo a: ${survey.customer_email}`);
    io.to(restId).emit('syncLog', {
      timestamp: Date.now(),
      type: 'info',
      message: `✉️ Email follow-up recensione inviata con successo a: ${survey.customer_email}`
    });
  } catch (err) {
    console.error('❌ Errore invio email follow-up recensione:', err);
  }
};

// TODO: non ancora richiamata da nessuna route — va agganciata alla creazione di un
// nuovo appuntamento, quando definiremo il modello resources/services/appointments.
// --- APPOINTMENT EMAIL HELPERS ---

const sendCustomerConfirmationEmail = async (appointment, restaurant) => {
  if (!appointment.customer_email || !appointment.customer_email.includes('@')) return;

  const subject = `Conferma Appuntamento: ${restaurant.name}`;
  const bodyText = `Ciao ${appointment.customer_name},\nIl tuo appuntamento per ${appointment.service_name} è confermato per il ${appointment.date} alle ${appointment.time}.`;

  const contentHtml = `
    <p>Ciao <strong>${appointment.customer_name}</strong>,</p>
    <p>Siamo felici di confermare il tuo appuntamento presso <strong>${restaurant.name}</strong>.</p>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; text-align: left;">
      <h3 style="margin-top: 0; color: #0f172a;">Dettagli Appuntamento</h3>
      <p style="margin: 5px 0;"><strong>Servizio:</strong> ${appointment.service_name}</p>
      <p style="margin: 5px 0;"><strong>Data:</strong> ${appointment.date}</p>
      <p style="margin: 5px 0;"><strong>Ora:</strong> ${appointment.time}</p>
    </div>
    <p>Ti aspettiamo!</p>
  `;

  const htmlBody = buildHtmlEmail(subject, "Appuntamento Confermato", contentHtml, null, null, `Ricevi questa email perché hai prenotato presso ${restaurant.name}.`, restaurant);

  if (!resendClient) {
    console.log(`✉️ [Email Simulata] Conferma appuntamento a ${appointment.customer_email}`);
    return;
  }

  try {
    let fromEmail = 'noreply@specchietto.app';
    if (RESEND_FROM) { const match = RESEND_FROM.match(/<([^>]+)>/); if (match && match[1]) fromEmail = match[1]; }
    await resendClient.emails.send({ from: `"${restaurant.name}" <${fromEmail}>`, to: appointment.customer_email, subject, text: bodyText, html: htmlBody });
    console.log(`✉️ Conferma inviata a: ${appointment.customer_email}`);
  } catch (err) {
    console.error('❌ Errore invio conferma:', err);
  }
};

const sendSalonNotificationEmail = async (appointment, restaurant, adminEmail) => {
  if (!adminEmail || !adminEmail.includes('@')) return;

  const subject = `Nuova Prenotazione: ${appointment.customer_name}`;
  const bodyText = `Hai ricevuto una nuova prenotazione da ${appointment.customer_name} per ${appointment.service_name} il ${appointment.date} alle ${appointment.time}.`;

  const contentHtml = `
    <p>Hai ricevuto un nuovo appuntamento dal widget online o da Google Maps!</p>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; text-align: left;">
      <p style="margin: 5px 0;"><strong>Cliente:</strong> ${appointment.customer_name}</p>
      <p style="margin: 5px 0;"><strong>Telefono:</strong> ${appointment.customer_phone || 'Non specificato'}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> ${appointment.customer_email || 'Non specificata'}</p>
      <p style="margin: 5px 0;"><strong>Servizio:</strong> ${appointment.service_name}</p>
      <p style="margin: 5px 0;"><strong>Data e Ora:</strong> ${appointment.date} alle ${appointment.time}</p>
      <p style="margin: 5px 0;"><strong>Sorgente:</strong> ${appointment.source || 'direct'}</p>
    </div>
  `;

  const htmlBody = buildHtmlEmail(subject, "Nuova Prenotazione", contentHtml, "Apri Dashboard", process.env.FRONTEND_URL || "https://specchietto.app", "Specchietto Notifiche", restaurant);

  if (!resendClient) {
    console.log(`✉️ [Email Simulata] Notifica salone a ${adminEmail}`);
    return;
  }

  try {
    let fromEmail = 'noreply@specchietto.app';
    if (RESEND_FROM) { const match = RESEND_FROM.match(/<([^>]+)>/); if (match && match[1]) fromEmail = match[1]; }
    await resendClient.emails.send({ from: `"Specchietto" <${fromEmail}>`, to: adminEmail, subject, text: bodyText, html: htmlBody });
  } catch (err) {
    console.error('❌ Errore notifica salone:', err);
  }
};

const sendReminderEmail = async (appointment, restaurant) => {
  if (!appointment.customer_email || !appointment.customer_email.includes('@')) return;

  const subject = `Promemoria: Appuntamento domani da ${restaurant.name}`;
  const bodyText = `Ciao ${appointment.customer_name}, ti ricordiamo il tuo appuntamento per ${appointment.service_name} domani alle ${appointment.time}.`;

  const contentHtml = `
    <p>Ciao <strong>${appointment.customer_name}</strong>,</p>
    <p>Questo è un promemoria per il tuo appuntamento di domani presso <strong>${restaurant.name}</strong>.</p>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; text-align: left;">
      <p style="margin: 5px 0;"><strong>Servizio:</strong> ${appointment.service_name}</p>
      <p style="margin: 5px 0;"><strong>Ora:</strong> ${appointment.time}</p>
    </div>
    <p>A domani!</p>
  `;

  const htmlBody = buildHtmlEmail(subject, "Promemoria Appuntamento", contentHtml, null, null, `Promemoria da ${restaurant.name}.`, restaurant);

  if (!resendClient) {
    console.log(`✉️ [Email Simulata] Promemoria a ${appointment.customer_email}`);
    return;
  }

  try {
    let fromEmail = 'noreply@specchietto.app';
    if (RESEND_FROM) { const match = RESEND_FROM.match(/<([^>]+)>/); if (match && match[1]) fromEmail = match[1]; }
    await resendClient.emails.send({ from: `"${restaurant.name}" <${fromEmail}>`, to: appointment.customer_email, subject, text: bodyText, html: htmlBody });
  } catch (err) {
    console.error('❌ Errore promemoria:', err);
  }
};

const sendReviewEmail = async (appointment, restaurant, googleReviewLink) => {
  if (!appointment.customer_email || !appointment.customer_email.includes('@')) return false;

  const subject = `Com'è andata da ${restaurant.name}?`;
  const frontendUrl = process.env.FRONTEND_URL || 'https://specchietto.vercel.app'; // Default vercel app if env not set
  const internalReviewUrl = `${frontendUrl}/#/leave-review/${appointment.id}`;

  const bodyText = `Ciao ${appointment.customer_name}, speriamo tu sia rimasto soddisfatto del servizio ${appointment.service_name}. Lasciaci una recensione cliccando su questo link: ${internalReviewUrl} ${googleReviewLink ? 'oppure su Google: ' + googleReviewLink : ''}`;

  const reviewBtn = googleReviewLink ? 
    `<div style="margin-top: 20px;"><a href="${googleReviewLink}" style="background-color: ${restaurant.primary_color || '#0f172a'}; padding: 12px 24px; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Lascia una recensione su Google</a></div>` 
    : '';

  const internalBtn = `<div style="margin-top: ${googleReviewLink ? '10px' : '20px'};"><a href="${internalReviewUrl}" style="background-color: ${googleReviewLink ? '#f1f5f9' : (restaurant.primary_color || '#0f172a')}; padding: 12px 24px; color: ${googleReviewLink ? '#334155' : '#fff'}; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; border: 1px solid ${googleReviewLink ? '#e2e8f0' : 'transparent'};">Condividi la tua esperienza con noi</a></div>`;

  const contentHtml = `
    <p>Ciao <strong>${appointment.customer_name}</strong>,</p>
    <p>grazie per averci scelto per il tuo ${appointment.service_name}!</p>
    <p>Ci piacerebbe sapere com'è andata. Il tuo parere è preziosissimo per noi e per gli altri clienti.</p>
    ${reviewBtn}
    ${internalBtn}
    <p style="margin-top: 30px;">A presto,<br>Lo staff di ${restaurant.name}</p>
  `;

  const htmlBody = buildHtmlEmail(subject, "La tua opinione conta", contentHtml, null, null, `Richiesta recensione da ${restaurant.name}.`, restaurant);

  if (!resendClient) {
    console.log(`✉️ [Email Simulata] Richiesta recensione a ${appointment.customer_email} (RESEND_API_KEY non configurata: email NON realmente inviata)`);
    return false;
  }

  try {
    let fromEmail = 'noreply@specchietto.app';
    if (RESEND_FROM) { const match = RESEND_FROM.match(/<([^>]+)>/); if (match && match[1]) fromEmail = match[1]; }
    await resendClient.emails.send({ from: `"${restaurant.name}" <${fromEmail}>`, to: appointment.customer_email, subject, text: bodyText, html: htmlBody });
    return true;
  } catch (err) {
    console.error('❌ Errore richiesta recensione:', err);
    return false;
  }
};

// Helper to send push notifications to all registered devices of a specific restaurant
const sendPushNotificationToAll = async (order) => {
  if (!firebaseInitialized) {
    console.log('ℹ️ Firebase non inizializzato. Notifica push simulata per l\'ordine di:', order.name);
    return;
  }
  
  const restId = order.restaurant_id || 'rest-1';
  try {
    const rows = await dbAll('SELECT token FROM devices WHERE restaurant_id = ?', [restId]);
    const tokens = rows.map(r => r.token);
    
    if (tokens.length === 0) {
      console.log(`ℹ️ Nessun dispositivo registrato per le notifiche push per il ristorante: ${restId}`);
      return;
    }
    
    const targetSetting = await dbGet("SELECT value FROM settings WHERE restaurant_id = ? AND key = 'push_notification_target'", [restId]);
    const openInBrowser = targetSetting && targetSetting.value === 'browser';

    const messageTitle = order.type === 'delivery' ? 'Nuovo Ordine Domicilio!' : 'Nuova Prenotazione Tavolo!';
    const messageBody = order.type === 'delivery' 
      ? `Nuovo ordine per ${order.name} - Consegna in ${order.address}`
      : `Nuova prenotazione per ${order.name} - Tavolo da ${order.guests} persone`;
      
    console.log(`📤 Invio notifica push a ${tokens.length} dispositivi del ristorante ${restId}...`);
    
    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokens,
      notification: {
        title: messageTitle,
        body: messageBody,
      },
      data: {
        orderId: String(order.id),
        type: String(order.type || ''),
        name: String(order.name || ''),
        restaurantId: String(restId),
        click_action: 'ORDER_ACTIONS',
        openInBrowser: String(openInBrowser)
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'notification_sound',
          channelId: 'orders-channel-v4',
          clickAction: 'ORDER_ACTIONS'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'notification_sound.caf',
            category: 'ORDER_ACTIONS'
          }
        }
      }
    });
    
    console.log(`✅ Risultato invio push: ${response.successCount} inviati, ${response.failureCount} falliti.`);
    
    // Cleanup unregistered/invalid tokens
    if (response.failureCount > 0) {
      const tokensToRemove = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (errCode === 'messaging/invalid-registration-token' || errCode === 'messaging/registration-token-not-registered') {
            tokensToRemove.push(tokens[idx]);
          }
        }
      });
      
      if (tokensToRemove.length > 0) {
        console.log(`🧹 Rimozione di ${tokensToRemove.length} token non validi o scaduti per il ristorante ${restId}...`);
        for (const t of tokensToRemove) {
          await dbRun('DELETE FROM devices WHERE token = ? AND restaurant_id = ?', [t, restId]);
        }
      }
    }
  } catch (err) {
    console.error('❌ Errore durante l\'invio della notifica push:', err);
  }
};

// HTTP REST API routes

// Chiave segreta per la firma dei token stateless (JWT-like) per resistere ai reboot di Render
if (!process.env.JWT_SECRET) {
  console.error('🚨 ATTENZIONE: JWT_SECRET non configurata nelle variabili d\'ambiente. Uso un valore di default NON sicuro: chiunque conosca questo codice sorgente può forgiare token validi. Imposta JWT_SECRET in backend/.env prima di andare in produzione.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'specchietto_super_secret_key_change_me';

// Helper per generare un token stateless firmato (valido 30 giorni per evitare disconnessioni)
const generateToken = (user) => {
  const payload = {
    user_id: user.id,
    restaurant_id: user.restaurant_id,
    role: user.role,
    expires_at: Date.now() + 30 * 24 * 3600 * 1000 // 30 giorni
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', JWT_SECRET);
  hmac.update(payloadStr);
  const signature = hmac.digest('base64url');
  return `${payloadStr}.${signature}`;
};

// Helper per verificare un token stateless firmato
const verifyToken = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadStr, signature] = parts;
    const hmac = crypto.createHmac('sha256', JWT_SECRET);
    hmac.update(payloadStr);
    const expectedSignature = hmac.digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
    
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (Date.now() > payload.expires_at) return null; // Scaduto
    return payload;
  } catch (e) {
    return null;
  }
};

// Middleware per l'autenticazione dei merchant/super_admin
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Autenticazione richiesta' });
    }
    const token = authHeader.split(' ')[1];
    
    // 1. Tenta la verifica del token stateless firmato (JWT-like)
    const tokenData = verifyToken(token);
    if (tokenData) {
      req.user = {
        id: tokenData.user_id,
        restaurant_id: tokenData.restaurant_id,
        role: tokenData.role
      };
      return next();
    }
    
    // 2. Fallback per le sessioni legacy nel database
    const session = await dbGet('SELECT * FROM sessions WHERE token = ?', [token]);
    if (session) {
      if (Date.now() > session.expires_at) {
        await dbRun('DELETE FROM sessions WHERE token = ?', [token]);
        return res.status(401).json({ error: 'Sessione scaduta' });
      }
      req.user = {
        id: session.user_id,
        restaurant_id: session.restaurant_id,
        role: session.role
      };
      return next();
    }
    
    return res.status(401).json({ error: 'Sessione non valida o scaduta' });
  } catch (err) {
    res.status(500).json({ error: 'Errore interno di autenticazione' });
  }
};

// Funzione helper per verificare che un merchant operi solo sul proprio ristorante
const checkScope = (req, res, resourceRestaurantId) => {
  if (req.user.role === 'super_admin') return true;
  if (req.user.restaurant_id !== resourceRestaurantId) {
    res.status(403).json({ error: 'Accesso negato. Non sei autorizzato a gestire questo locale.' });
    return false;
  }
  return true;
};

// POST login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password sono obbligatorie' });
    }
    
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    
    const isValid = verifyPassword(password, user.salt, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Check if restaurant is active (only for non-super admins)
    if (user.role !== 'super_admin' && user.restaurant_id) {
      const rest = await dbGet('SELECT active FROM restaurants WHERE id = ?', [user.restaurant_id]);
      if (rest && rest.active === 0) {
        return res.status(403).json({ error: 'L\'account di questo locale è disattivato. Contatta l\'amministratore del servizio.' });
      }
    }
    
    // Genera token di sessione stateless (valido 30 giorni)
    const token = generateToken(user);
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        restaurant_id: user.restaurant_id
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST logout
app.post('/api/auth/logout', requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    // Rimuove la sessione dal database se era legacy, altrimenti fa solo successo
    await dbRun('DELETE FROM sessions WHERE token = ?', [token]).catch(() => {});
    res.json({ success: true, message: 'Logout effettuato con successo' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET auth profile (me)
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await dbGet('SELECT id, email, role, restaurant_id FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST update current user auth credentials (email/password)
app.post('/api/auth/update', requireAuth, async (req, res) => {
  try {
    const { email, password } = req.body;
    const userId = req.user.id;

    if (!email && !password) {
      return res.status(400).json({ error: 'Nessun dato da aggiornare fornito (email o password)' });
    }

    if (email) {
      // Verifica se l'email è già usata da qualcun altro
      const existingUser = await dbGet('SELECT * FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (existingUser) {
        return res.status(400).json({ error: 'Email già in uso da un altro utente' });
      }
      await dbRun('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'La password deve contenere almeno 6 caratteri' });
      }
      const { salt, hash } = hashPassword(password);
      await dbRun('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?', [hash, salt, userId]);
    }

    res.json({ success: true, message: 'Credenziali aggiornate con successo' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST generate SSO token for a specific restaurant (requires super_admin role)
app.post('/api/auth/sso', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Accesso negato: richiesto ruolo super_admin' });
    }
    
    const { restaurant_id } = req.body;
    if (!restaurant_id) {
      return res.status(400).json({ error: 'restaurant_id è obbligatorio' });
    }
    
    // Find the merchant user for this restaurant
    const targetUser = await dbGet("SELECT id, email, role, restaurant_id FROM users WHERE restaurant_id = ? AND role = 'merchant'", [restaurant_id]);
    if (!targetUser) {
      return res.status(404).json({ error: 'Gestore non trovato per questo ristorante' });
    }
    
    // Generate stateless token
    const token = generateToken(targetUser);
    
    res.json({
      token,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        restaurant_id: targetUser.restaurant_id
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST update restaurant branding (logo, primary_color, accent_color)
app.post('/api/restaurants/:id/branding', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { logo, primary_color, accent_color } = req.body;
    
    if (!checkScope(req, res, id)) return;
    
    await dbRun(`
      UPDATE restaurants
      SET logo = ?, primary_color = ?, accent_color = ?
      WHERE id = ?
    `, [logo, primary_color, accent_color, id]);
    
    // Retrieve the updated restaurant row
    const updatedRestaurant = await dbGet('SELECT * FROM restaurants WHERE id = ?', [id]);
    
    // Emit update via socket.io so client-side changes can take effect in real-time
    io.to(id).emit('restaurantUpdated', updatedRestaurant);
    io.emit('restaurantsUpdated', updatedRestaurant); // global update too
    
    console.log(`🎨 Branding aggiornato per il ristorante ${id}: logo=${logo}, primary=${primary_color}, accent=${accent_color}`);
    res.json(updatedRestaurant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET settings for a restaurant
app.get('/api/settings', async (req, res) => {
  try {
    const { restaurant_id } = req.query;
    if (!restaurant_id) {
      return res.status(400).json({ error: 'restaurant_id obbligatorio' });
    }
    const settings = await dbAll('SELECT key, value FROM settings WHERE restaurant_id = ?', [restaurant_id]);
    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });
    res.json(settingsMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST save settings
app.post('/api/settings', requireAuth, async (req, res) => {
  try {
    const { restaurant_id, settings } = req.body;
    if (!checkScope(req, res, restaurant_id)) return;
    
    for (const [key, value] of Object.entries(settings)) {
      await dbRun(`
        INSERT INTO settings (restaurant_id, key, value)
        VALUES (?, ?, ?)
        ON CONFLICT(restaurant_id, key) DO UPDATE SET value = excluded.value
      `, [restaurant_id, key, String(value)]);
    }
    
    // Notify clients of updated settings
    const updatedSettings = await dbAll('SELECT key, value FROM settings WHERE restaurant_id = ?', [restaurant_id]);
    const settingsMap = {};
    updatedSettings.forEach(s => { settingsMap[s.key] = s.value; });
    io.to(restaurant_id).emit('settingsUpdated', settingsMap);

    // Aggiorna subito lo stato dei dispositivi (es. toggle reception_enabled)
    await emitDeviceStatus(restaurant_id);

    res.json({ success: true, settings: settingsMap });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST request password recovery link
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email obbligatoria' });
    }

    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    
    // Per motivi di sicurezza, ritorniamo comunque 200 anche se l'utente non esiste
    // per impedire l'enumerazione degli indirizzi email.
    if (!user) {
      return res.json({ success: true, message: 'Se l\'indirizzo email esiste, riceverai un link di ripristino a breve.' });
    }

    // Genera token di recupero casuale
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 3600000; // Valido 1 ora

    await dbRun('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [resetToken, resetTokenExpires, user.id]);

    // Fetch user's restaurant profile for branding
    let restaurant = null;
    if (user.restaurant_id) {
      restaurant = await dbGet('SELECT * FROM restaurants WHERE id = ?', [user.restaurant_id]);
    }

    // Determina l'origine dinamica (locale vs produzione)
    const origin = getOrigin(req);

    const resetUrl = `${origin}/#/reset-password?token=${resetToken}`;
    
    // Invia email al gestore
    const brandName = restaurant ? restaurant.name : 'Specchietto';
    const mailSubject = `Reimpostazione Password - ${brandName}`;
    const mailBody = `Ciao,
abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account.

Puoi reimpostare la tua password cliccando sul link seguente (valido per 1 ora):
${resetUrl}

Se non hai richiesto tu il ripristino, puoi ignorare questa email.

Un cordiale saluto,
Piattaforma ${brandName}`;

    const mailHtml = buildHtmlEmail(
      'Reimpostazione Password',
      `${brandName} Account Recovery`,
      `
      <p>Ciao,</p>
      <p>abbiamo ricevuto una richiesta per reimpostare la password del tuo account sulla piattaforma ${brandName}.</p>
      <p>Clicca sul pulsante qui sotto per procedere e impostare una nuova password (il link scadrà tra 1 ora):</p>
      `,
      'Reimposta Password',
      resetUrl,
      'Se il pulsante non funziona, copia e incolla questo indirizzo nel browser:<br>' + resetUrl,
      restaurant
    );

    // Invia l'email tramite il servizio configurato
    transporter.emails.send({
      from: RESEND_FROM || `"${brandName}" <noreply@specchietto.app>`,
      to: email,
      subject: mailSubject,
      text: mailBody,
      html: mailHtml
    }).then(() => {
      console.log(`✉️ Email di ripristino password inviata a: ${email}`);
    }).catch(err => {
      console.error("Errore nell'invio dell'email di ripristino password:", err);
    });

    res.json({ success: true, message: 'Se l\'indirizzo email esiste, riceverai un link di ripristino a breve.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST reset password using token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token e password sono obbligatori' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La password deve contenere almeno 6 caratteri' });
    }

    const user = await dbGet('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?', [token, Date.now()]);
    if (!user) {
      return res.status(400).json({ error: 'Token non valido o scaduto. Richiedi un nuovo link di ripristino.' });
    }

    const { salt, hash } = hashPassword(password);
    await dbRun('UPDATE users SET password_hash = ?, salt = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hash, salt, user.id]);

    res.json({ success: true, message: 'Password reimpostata con successo! Ora puoi effettuare il login.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST register device token
app.post('/api/devices/register', async (req, res) => {
  try {
    const { token, restaurant_id } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token mancante' });
    }
    const targetRestaurantId = restaurant_id || 'rest-1';
    
    // Rimuovi eventuali associazioni precedenti di questo token ad altri ristoranti
    await dbRun('DELETE FROM devices WHERE token = ?', [token]);
    
    const timestamp = Date.now();
    await dbRun(`
      INSERT OR REPLACE INTO devices (token, restaurant_id, timestamp)
      VALUES (?, ?, ?)
    `, [token, targetRestaurantId, timestamp]);
    
    console.log(`📱 Dispositivo registrato con successo. Token: ${token.substring(0, 15)}...`);
    res.status(200).json({ message: 'Dispositivo registrato con successo' });
  } catch (err) {
    console.error('❌ Errore registrazione dispositivo:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET all registered devices (for debug)
app.get('/api/devices', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM devices');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET active socket connections (for live debug)
app.get('/api/socket/debug', (req, res) => {
  try {
    const sockets = [];
    const allSockets = io.sockets.sockets;
    for (const [id, socket] of allSockets.entries()) {
      sockets.push({
        id,
        restaurantId: socket.restaurantId || null,
        deviceType: socket.deviceType || 'unknown',
        connected: socket.connected,
        rooms: Array.from(socket.rooms).filter(r => r !== id)
      });
    }
    
    const serializedActiveDevices = {};
    for (const restId of Object.keys(activeDevices)) {
      serializedActiveDevices[restId] = {
        merchant_pc: Array.from(activeDevices[restId].merchant_pc || []),
        merchant_mobile: Array.from(activeDevices[restId].merchant_mobile || [])
      };
    }

    res.json({
      activeDevices: serializedActiveDevices,
      sockets
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a new lead (Lead Capture on demo trial)
app.post('/api/leads', async (req, res) => {
  try {
    const { restaurant_name, name, email, phone } = req.body;
    if (!restaurant_name || !name || !email) {
      return res.status(400).json({ error: 'Nome locale, nome e email sono obbligatori' });
    }
    const id = 'lead-' + crypto.randomBytes(8).toString('hex');
    await dbRun(`
      INSERT INTO leads (id, restaurant_name, name, email, phone, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, restaurant_name, name, email, phone || '', Date.now()]);
    
    console.log(`💼 Nuovo Lead acquisito per la demo: "${restaurant_name}" da ${name} (${email})`);
    res.status(201).json({ success: true, leadId: id });
  } catch (err) {
    console.error('❌ Errore durante il salvataggio del lead:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET all leads (for super admin / debug)
app.get('/api/leads', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM leads ORDER BY timestamp DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all restaurants (for tenant listing / debug)
app.get('/api/restaurants', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM restaurants');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET restaurant info by ID or slug (Tenant Resolution)
app.get('/api/restaurants/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    if (idOrSlug === 'all') {
      return res.json({
        id: 'all',
        name: 'Specchietto',
        slug: 'all',
        logo: '/icon.png',
        primary_color: '#ff9000',
        accent_color: '#4d5df1',
        created_at: Date.now()
      });
    }
    let row = await dbGet('SELECT * FROM restaurants WHERE id = ?', [idOrSlug]);
    if (!row) {
      row = await dbGet('SELECT * FROM restaurants WHERE slug = ?', [idOrSlug]);
    }
    if (!row) {
      return res.status(404).json({ error: 'Ristorante non trovato' });
    }
    
    // Fetch public settings for the restaurant (like stripe_enabled)
    const settingsRows = await dbAll("SELECT key, value FROM settings WHERE restaurant_id = ? AND key IN ('stripe_enabled', 'stripe_type', 'stripe_amount')", [row.id]);
    const settings = settingsRows.reduce((acc, s) => { acc[s.key] = s.value; return acc; }, {});
    
    res.json({ ...row, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SUPER ADMIN ROUTES
app.get('/api/super-admin/restaurants', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Accesso negato.' });
    
    // Ritorna la lista dei saloni con info utili (numero clienti, numero appuntamenti, etc)
    const restaurants = await dbAll(`
      SELECT r.id, r.name, r.slug, r.active, r.plan, r.created_at, u.email as admin_email
      FROM restaurants r
      LEFT JOIN users u ON u.restaurant_id = r.id AND u.role = 'admin'
      ORDER BY r.created_at DESC
    `);
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/super-admin/restaurants/:id/plan', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Accesso negato.' });
    const { id } = req.params;
    const { plan } = req.body;
    
    if (!['starter', 'pro', 'premium'].includes(plan)) {
      return res.status(400).json({ error: 'Piano non valido' });
    }
    
    await dbRun('UPDATE restaurants SET plan = ? WHERE id = ?', [plan, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST create new restaurant (SaaS Super Admin)
app.post('/api/restaurants', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Accesso negato. Solo i super admin possono creare ristoranti.' });
    }
    const { name, slug, logo, primary_color, accent_color } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'Nome e slug sono obbligatori' });
    }
    const id = 'rest-' + Math.random().toString(36).substr(2, 9);
    const logoUrl = logo || '/icon.png';
    const primary = primary_color || '#4d5df1';
    const accent = accent_color || '#FF9000';
    
    // Insert restaurant
    await dbRun(`
      INSERT INTO restaurants (id, name, slug, logo, primary_color, accent_color, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, name, slug, logoUrl, primary, accent, Date.now()]);
    
    // Seed default settings for the new business
    // TODO: aggiungere qui le impostazioni specifiche di Specchietto (orari operatori, servizi, ecc.)
    // una volta disegnato il modello dati risorse/servizi/appuntamenti.
    const defaultSettings = {
      restaurant_name: name,
      notification_email: "info@" + slug + ".it",
      email_notifications_enabled: "true",
      notification_phone: "",
      auto_decline_minutes: "30",
      reception_enabled: "true"
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      await dbRun('INSERT INTO settings (restaurant_id, key, value) VALUES (?, ?, ?)', [id, key, value]);
    }

    // Seed default admin user for the new restaurant
    const defaultUserEmail = `admin@${slug}.it`;
    const defaultUserPassword = `${slug}123`;
    const { salt, hash } = hashPassword(defaultUserPassword);
    const userId = 'usr-' + Math.random().toString(36).substr(2, 9);
    await dbRun(`
      INSERT INTO users (id, restaurant_id, email, password_hash, salt, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, id, defaultUserEmail, hash, salt, 'merchant', Date.now()]);
    console.log(`Default user created for new restaurant ${slug}: ${defaultUserEmail} / ${defaultUserPassword}`);
    
    const newRestaurant = {
      id, name, slug, logo: logoUrl, primary_color: primary, accent_color: accent, active: 1, created_at: Date.now()
    };
    
    // Emit event to all sockets that restaurants list has updated
    io.emit('restaurantsUpdated', newRestaurant);

    // Notify Super Admin of new tenant and credentials
    sendSuperAdminRestaurantAlert(newRestaurant, defaultUserEmail, defaultUserPassword);
    
    res.json(newRestaurant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT toggle restaurant active/inactive status (SaaS Super Admin)
app.put('/api/restaurants/:id/loyalty', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { loyalty_enabled, loyalty_points_per_euro, loyalty_reward_threshold, loyalty_reward_value } = req.body;
    if (!checkScope(req, res, id)) return;

    await dbRun(
      'UPDATE restaurants SET loyalty_enabled = ?, loyalty_points_per_euro = ?, loyalty_reward_threshold = ?, loyalty_reward_value = ? WHERE id = ?',
      [loyalty_enabled ? 1 : 0, loyalty_points_per_euro, loyalty_reward_threshold, loyalty_reward_value, id]
    );
    const updated = await dbGet('SELECT * FROM restaurants WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/restaurants/:id/status', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Accesso negato. Solo i super admin possono cambiare lo stato dei ristoranti.' });
    }
    const { id } = req.params;
    const { active } = req.body;
    
    if (active === undefined) {
      return res.status(400).json({ error: 'Il campo active è obbligatorio' });
    }
    
    const activeVal = active ? 1 : 0;
    
    const rest = await dbGet('SELECT * FROM restaurants WHERE id = ?', [id]);
    if (!rest) {
      return res.status(404).json({ error: 'Ristorante non trovato' });
    }
    
    await dbRun('UPDATE restaurants SET active = ? WHERE id = ?', [activeVal, id]);
    
    const updatedRestaurant = { ...rest, active: activeVal };
    
    // Emit updates to clients
    io.emit('restaurantsUpdated', updatedRestaurant);
    
    res.json(updatedRestaurant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE restaurant (SaaS Super Admin)
app.delete('/api/restaurants/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Accesso negato. Solo i super admin possono rimuovere ristoranti.' });
    }
    const { id } = req.params;
    
    const rest = await dbGet('SELECT * FROM restaurants WHERE id = ?', [id]);
    if (!rest) {
      return res.status(404).json({ error: 'Ristorante non trovato' });
    }
    
    // Permanent cascading delete of the restaurant and all associated resources:
    // 1. Settings
    await dbRun('DELETE FROM settings WHERE restaurant_id = ?', [id]);
    // 2. Devices
    await dbRun('DELETE FROM devices WHERE restaurant_id = ?', [id]);
    // 3. Customers (CRM)
    await dbRun('DELETE FROM customers WHERE restaurant_id = ?', [id]);
    // 4. Appointments, services and resources (and their hours/exceptions/assignments)
    await dbRun('DELETE FROM appointments WHERE restaurant_id = ?', [id]);
    await dbRun(`DELETE FROM resource_hours WHERE resource_id IN (SELECT id FROM resources WHERE restaurant_id = ?)`, [id]);
    await dbRun(`DELETE FROM resource_exceptions WHERE resource_id IN (SELECT id FROM resources WHERE restaurant_id = ?)`, [id]);
    await dbRun(`DELETE FROM resource_services WHERE resource_id IN (SELECT id FROM resources WHERE restaurant_id = ?)`, [id]);
    await dbRun('DELETE FROM resources WHERE restaurant_id = ?', [id]);
    await dbRun('DELETE FROM services WHERE restaurant_id = ?', [id]);
    // 5. Users
    await dbRun('DELETE FROM users WHERE restaurant_id = ?', [id]);
    // 6. Finally, delete the restaurant itself
    await dbRun('DELETE FROM restaurants WHERE id = ?', [id]);
    
    // Emit delete notification to connected sockets
    io.emit('restaurantDeleted', { id });
    
    res.json({ success: true, message: `Ristorante ${id} e tutti i dati collegati sono stati eliminati.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all settings for a specific restaurant
app.get('/api/settings', async (req, res) => {
  try {
    const restaurantId = req.query.restaurant_id || 'rest-1';
    const rows = await dbAll('SELECT * FROM settings WHERE restaurant_id = ?', [restaurantId]);
    const settingsObj = {};
    rows.forEach(r => {
      settingsObj[r.key] = r.value;
    });

    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST save/update settings
// CRM Customer endpoints
app.get('/api/customers', requireAuth, async (req, res) => {
  try {
    const restaurantId = req.query.restaurant_id || 'rest-1';
    if (!checkScope(req, res, restaurantId)) return;
    const rows = await dbAll('SELECT * FROM customers WHERE restaurant_id = ? ORDER BY name ASC', [restaurantId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers/:phone', requireAuth, async (req, res) => {
  try {
    const { phone } = req.params;
    const restaurantId = req.query.restaurant_id || 'rest-1';
    if (!checkScope(req, res, restaurantId)) return;
    const row = await dbGet('SELECT * FROM customers WHERE phone = ? AND restaurant_id = ?', [phone, restaurantId]);
    if (!row) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', requireAuth, async (req, res) => {
  try {
    const { phone, restaurant_id, name, email, notes, no_show_count, blocked } = req.body;
    const targetRestaurantId = restaurant_id || 'rest-1';
    if (!checkScope(req, res, targetRestaurantId)) return;

    if (!phone || !name) {
      return res.status(400).json({ error: 'Telefono e Nome sono obbligatori' });
    }

    await dbRun(`
      INSERT OR REPLACE INTO customers (phone, restaurant_id, name, email, notes, no_show_count, blocked, loyalty_points, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT loyalty_points FROM customers WHERE phone = ? AND restaurant_id = ?), 0), COALESCE((SELECT created_at FROM customers WHERE phone = ? AND restaurant_id = ?), ?))
    `, [
      phone.trim(), targetRestaurantId, name.trim(), (email || '').trim(), notes || '', 
      no_show_count || 0, blocked || 0, phone.trim(), targetRestaurantId, phone.trim(), targetRestaurantId, Date.now()
    ]);

    const row = await dbGet('SELECT * FROM customers WHERE phone = ? AND restaurant_id = ?', [phone.trim(), targetRestaurantId]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers/import', requireAuth, async (req, res) => {
  try {
    const { customers, restaurant_id } = req.body;
    const targetRestaurantId = restaurant_id || 'rest-1';
    if (!checkScope(req, res, targetRestaurantId)) return;
    
    if (!Array.isArray(customers)) {
      return res.status(400).json({ error: 'Body must contain an array of customers' });
    }

    let importedCount = 0;
    
    // Process sequentially to reuse dbRun easily (could use a transaction for speed, but this is safer and simpler for SQLite)
    for (const cust of customers) {
      const phone = (cust.phone || '').toString().trim();
      const name = (cust.name || '').toString().trim();
      if (!phone || !name) continue; // Skip invalid records
      
      const email = (cust.email || '').toString().trim();
      const notes = (cust.notes || '').toString().trim();
      
      await dbRun(`
        INSERT OR REPLACE INTO customers (phone, restaurant_id, name, email, notes, no_show_count, blocked, created_at)
        VALUES (?, ?, ?, ?, ?, COALESCE((SELECT no_show_count FROM customers WHERE phone = ? AND restaurant_id = ?), 0), COALESCE((SELECT blocked FROM customers WHERE phone = ? AND restaurant_id = ?), 0), COALESCE((SELECT created_at FROM customers WHERE phone = ? AND restaurant_id = ?), ?))
      `, [
        phone, targetRestaurantId, name, email, notes, 
        phone, targetRestaurantId, phone, targetRestaurantId, phone, targetRestaurantId, Date.now()
      ]);
      importedCount++;
    }

    res.json({ success: true, importedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers/:phone/redeem_points', requireAuth, async (req, res) => {
  try {
    const { phone } = req.params;
    const { restaurant_id, points } = req.body;
    const targetRestaurantId = restaurant_id || 'rest-1';
    if (!checkScope(req, res, targetRestaurantId)) return;

    const cust = await dbGet('SELECT * FROM customers WHERE phone = ? AND restaurant_id = ?', [phone.trim(), targetRestaurantId]);
    if (!cust) return res.status(404).json({ error: 'Cliente non trovato' });

    if (cust.loyalty_points < points) {
      return res.status(400).json({ error: 'Punti insufficienti' });
    }

    await dbRun(
      'UPDATE customers SET loyalty_points = loyalty_points - ? WHERE phone = ? AND restaurant_id = ?',
      [points, phone.trim(), targetRestaurantId]
    );

    const updated = await dbGet('SELECT * FROM customers WHERE phone = ? AND restaurant_id = ?', [phone.trim(), targetRestaurantId]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:phone', requireAuth, async (req, res) => {
  try {
    const { phone } = req.params;
    const restaurantId = req.query.restaurant_id || 'rest-1';
    if (!checkScope(req, res, restaurantId)) return;
    await dbRun('DELETE FROM customers WHERE phone = ? AND restaurant_id = ?', [phone, restaurantId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all surveys for a restaurant
app.get('/api/restaurants/:id/surveys', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!checkScope(req, res, id)) return;

    const rows = await dbAll('SELECT * FROM surveys WHERE restaurant_id = ? ORDER BY created_at DESC', [id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT resolve/archive callback request
app.put('/api/surveys/:id/resolve', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await dbGet('SELECT restaurant_id FROM surveys WHERE id = ?', [id]);
    if (!survey) {
      return res.status(404).json({ error: 'Feedback non trovato' });
    }
    if (!checkScope(req, res, survey.restaurant_id)) return;

    await dbRun('UPDATE surveys SET resolved = 1 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Richiesta di callback segnata come risolta' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set up server and socket.io connection
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Track active connections per restaurant
// Structure: { [restaurantId]: { merchant_pc: Set(socket.id), merchant_mobile: Set(socket.id) } }
const activeDevices = {};

const emitDeviceStatus = async (restaurantId) => {
  if (!restaurantId) return;

  // Retrieve reception_enabled setting from SQLite database
  let receptionEnabled = true;
  try {
    const row = await dbGet("SELECT value FROM settings WHERE restaurant_id = ? AND key = 'reception_enabled'", [restaurantId]);
    if (row && row.value === 'false') {
      receptionEnabled = false;
    }
  } catch (err) {
    console.error("Errore nel recupero dell'impostazione reception_enabled:", err);
  }

  const pcConnected = !!(activeDevices[restaurantId]?.merchant_pc?.size > 0);
  const mobileConnected = !!(activeDevices[restaurantId]?.merchant_mobile?.size > 0);
  
  io.to(restaurantId).emit('deviceStatus', {
    pcConnected,
    mobileConnected
  });
  console.log(`📡 Emesso deviceStatus per ${restaurantId}: PC=${pcConnected}, Mobile=${mobileConnected} (receptionEnabled=${receptionEnabled})`);
};

io.on('connection', (socket) => {
  console.log(`Un client si è connesso: ${socket.id}`);
  
  socket.on('join_restaurant', async (data) => {
    let restaurantId;
    let deviceType = 'customer';
    
    if (data && typeof data === 'object') {
      restaurantId = data.restaurantId;
      deviceType = data.deviceType || 'customer';
    } else {
      restaurantId = data;
    }
    
    if (!restaurantId) return;

    const oldRestaurantId = socket.restaurantId;
    
    socket.join(restaurantId);
    socket.restaurantId = restaurantId;
    socket.deviceType = deviceType;

    // Clean up socket from any previous activeDevices registrations
    for (const rId of Object.keys(activeDevices)) {
      if (activeDevices[rId].merchant_pc) {
        activeDevices[rId].merchant_pc.delete(socket.id);
      }
      if (activeDevices[rId].merchant_mobile) {
        activeDevices[rId].merchant_mobile.delete(socket.id);
      }
      if (activeDevices[rId].merchant_pc?.size === 0 && activeDevices[rId].merchant_mobile?.size === 0) {
        delete activeDevices[rId];
      }
    }
    
    if (deviceType === 'merchant_pc' || deviceType === 'merchant_mobile') {
      if (!activeDevices[restaurantId]) {
        activeDevices[restaurantId] = {
          merchant_pc: new Set(),
          merchant_mobile: new Set()
        };
      }
      activeDevices[restaurantId][deviceType].add(socket.id);
    }
    
    console.log(`Socket ${socket.id} iscritto alla stanza del ristorante: ${restaurantId} come ${deviceType}`);
    
    if (activeDevices[restaurantId]) {
      console.log(`[Socket Debug] Dispositivi attivi per ${restaurantId}:`, {
        merchant_pc: Array.from(activeDevices[restaurantId].merchant_pc || []),
        merchant_mobile: Array.from(activeDevices[restaurantId].merchant_mobile || [])
      });
    }
    
    // Invia lo stato aggiornato a tutta la stanza
    await emitDeviceStatus(restaurantId);

    // Se il socket ha cambiato ristorante, aggiorna lo stato anche per il vecchio ristorante
    if (oldRestaurantId && oldRestaurantId !== restaurantId) {
      await emitDeviceStatus(oldRestaurantId);
    }
  });

  socket.on('disconnect', async () => {
    console.log(`Client disconnesso: ${socket.id}`);
    const { restaurantId, deviceType } = socket;
    if (restaurantId && (deviceType === 'merchant_pc' || deviceType === 'merchant_mobile')) {
      if (activeDevices[restaurantId] && activeDevices[restaurantId][deviceType]) {
        activeDevices[restaurantId][deviceType].delete(socket.id);
        
        // Pulisce l'oggetto se non ci sono più dispositivi connessi
        if (activeDevices[restaurantId].merchant_pc.size === 0 && activeDevices[restaurantId].merchant_mobile.size === 0) {
          delete activeDevices[restaurantId];
        }
        
        await emitDeviceStatus(restaurantId);
      }
    }
  });
});

// ===================== RESOURCES (operatori / postazioni prenotabili) =====================

app.get('/api/resources', async (req, res) => {
  try {
    const restaurantId = req.query.restaurant_id || 'rest-1';
    const rows = await dbAll('SELECT * FROM resources WHERE restaurant_id = ? ORDER BY created_at ASC', [restaurantId]);
    
    // Fetch hours and services for each resource
    for (let resource of rows) {
      const hours = await dbAll('SELECT day_of_week, open_time, close_time FROM resource_hours WHERE resource_id = ?', [resource.id]);
      const services = await dbAll('SELECT service_id FROM resource_services WHERE resource_id = ?', [resource.id]);
      
      resource.hours = hours;
      resource.services = services.map(s => s.service_id);
    }
    
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resources', requireAuth, async (req, res) => {
  try {
    const { restaurant_id, name, type, photo_url, color } = req.body;
    if (!checkScope(req, res, restaurant_id)) return;
    if (!name) return res.status(400).json({ error: 'Nome obbligatorio' });
    const id = 'res-' + Math.random().toString(36).substr(2, 9);
    await dbRun(
      'INSERT INTO resources (id, restaurant_id, name, type, photo_url, color, active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
      [id, restaurant_id, name, type || 'operator', photo_url || '', color || '', Date.now()]
    );
    const created = await dbGet('SELECT * FROM resources WHERE id = ?', [id]);
    io.to(restaurant_id).emit('resourcesUpdated', { action: 'create', resource: created });
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/resources/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbGet('SELECT * FROM resources WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Risorsa non trovata' });
    if (!checkScope(req, res, existing.restaurant_id)) return;
    const { name, type, photo_url, color, active } = req.body;
    await dbRun(
      'UPDATE resources SET name = ?, type = ?, photo_url = ?, color = ?, active = ? WHERE id = ?',
      [name ?? existing.name, type ?? existing.type, photo_url ?? existing.photo_url, color ?? existing.color, active !== undefined ? (active ? 1 : 0) : existing.active, id]
    );
    const updated = await dbGet('SELECT * FROM resources WHERE id = ?', [id]);
    io.to(existing.restaurant_id).emit('resourcesUpdated', { action: 'update', resource: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crea credenziali di accesso per un dipendente (staff)
app.post('/api/resources/:id/user', requireAuth, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e password richiesti' });

    const resource = await dbGet('SELECT * FROM resources WHERE id = ?', [req.params.id]);
    if (!resource) return res.status(404).json({ error: 'Risorsa non trovata' });
    if (!checkScope(req, res, resource.restaurant_id)) return;

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
});

app.delete('/api/resources/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbGet('SELECT * FROM resources WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Risorsa non trovata' });
    if (!checkScope(req, res, existing.restaurant_id)) return;
    await dbRun('DELETE FROM resources WHERE id = ?', [id]);
    await dbRun('DELETE FROM resource_services WHERE resource_id = ?', [id]);
    await dbRun('DELETE FROM resource_hours WHERE resource_id = ?', [id]);
    await dbRun('DELETE FROM resource_exceptions WHERE resource_id = ?', [id]);
    io.to(existing.restaurant_id).emit('resourcesUpdated', { action: 'delete', id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET orario settimanale ricorrente di una risorsa
app.get('/api/resources/:id/hours', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM resource_hours WHERE resource_id = ? ORDER BY day_of_week ASC', [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT sostituisce l'intero orario settimanale di una risorsa
// body: { hours: [{ day_of_week, open_time, close_time }, ...] }
app.put('/api/resources/:id/hours', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await dbGet('SELECT * FROM resources WHERE id = ?', [id]);
    if (!resource) return res.status(404).json({ error: 'Risorsa non trovata' });
    if (!checkScope(req, res, resource.restaurant_id)) return;
    const { hours } = req.body;
    if (!Array.isArray(hours)) return res.status(400).json({ error: 'hours deve essere un array' });

    await dbRun('DELETE FROM resource_hours WHERE resource_id = ?', [id]);
    for (const h of hours) {
      const hid = 'rh-' + Math.random().toString(36).substr(2, 9);
      await dbRun(
        'INSERT INTO resource_hours (id, resource_id, day_of_week, open_time, close_time) VALUES (?, ?, ?, ?, ?)',
        [hid, id, h.day_of_week, h.open_time, h.close_time]
      );
    }
    const updated = await dbAll('SELECT * FROM resource_hours WHERE resource_id = ? ORDER BY day_of_week ASC', [id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET eccezioni (ferie, chiusure straordinarie, orari speciali) di una risorsa
app.get('/api/resources/:id/exceptions', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM resource_exceptions WHERE resource_id = ? ORDER BY date ASC', [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resources/:id/exceptions', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await dbGet('SELECT * FROM resources WHERE id = ?', [id]);
    if (!resource) return res.status(404).json({ error: 'Risorsa non trovata' });
    if (!checkScope(req, res, resource.restaurant_id)) return;
    const { date, closed, open_time, close_time } = req.body;
    if (!date) return res.status(400).json({ error: 'Data obbligatoria' });
    const eid = 'rex-' + Math.random().toString(36).substr(2, 9);
    await dbRun(
      'INSERT INTO resource_exceptions (id, resource_id, date, closed, open_time, close_time) VALUES (?, ?, ?, ?, ?, ?)',
      [eid, id, date, closed ? 1 : 0, open_time || '', close_time || '']
    );
    res.json(await dbGet('SELECT * FROM resource_exceptions WHERE id = ?', [eid]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/resources/:resourceId/exceptions/:exceptionId', requireAuth, async (req, res) => {
  try {
    const { resourceId, exceptionId } = req.params;
    const resource = await dbGet('SELECT * FROM resources WHERE id = ?', [resourceId]);
    if (!resource) return res.status(404).json({ error: 'Risorsa non trovata' });
    if (!checkScope(req, res, resource.restaurant_id)) return;
    await dbRun('DELETE FROM resource_exceptions WHERE id = ? AND resource_id = ?', [exceptionId, resourceId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT sostituisce l'intero elenco di servizi che una risorsa puo' eseguire
// body: { service_ids: [...] }
app.put('/api/resources/:id/services', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await dbGet('SELECT * FROM resources WHERE id = ?', [id]);
    if (!resource) return res.status(404).json({ error: 'Risorsa non trovata' });
    if (!checkScope(req, res, resource.restaurant_id)) return;
    const { service_ids } = req.body;
    if (!Array.isArray(service_ids)) return res.status(400).json({ error: 'service_ids deve essere un array' });

    await dbRun('DELETE FROM resource_services WHERE resource_id = ?', [id]);
    for (const serviceId of service_ids) {
      await dbRun('INSERT INTO resource_services (resource_id, service_id) VALUES (?, ?)', [id, serviceId]);
    }
    res.json({ success: true, service_ids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== COUPONS (codici sconto) =====================

app.get('/api/coupons', async (req, res) => {
  try {
    const restaurantId = req.query.restaurant_id || 'rest-1';
    const rows = await dbAll('SELECT * FROM coupons WHERE restaurant_id = ? ORDER BY created_at DESC', [restaurantId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/coupons', requireAuth, async (req, res) => {
  try {
    const { restaurant_id, code, discount_type, discount_value } = req.body;
    if (!checkScope(req, res, restaurant_id)) return;
    if (!code || !discount_type || !discount_value) return res.status(400).json({ error: 'Codice, tipo e valore obbligatori' });
    
    const id = 'coup-' + Math.random().toString(36).substr(2, 9);
    await dbRun(
      'INSERT INTO coupons (id, restaurant_id, code, discount_type, discount_value, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
      [id, restaurant_id, code.toUpperCase(), discount_type, Number(discount_value), Date.now()]
    );
    const created = await dbGet('SELECT * FROM coupons WHERE id = ?', [id]);
    io.to(restaurant_id).emit('couponsUpdated', { action: 'create', coupon: created });
    res.json({ success: true, coupon: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/coupons/:id', requireAuth, async (req, res) => {
  try {
    const restaurant_id = req.query.restaurant_id;
    if (!checkScope(req, res, restaurant_id)) return;
    await dbRun('DELETE FROM coupons WHERE id = ? AND restaurant_id = ?', [req.params.id, restaurant_id]);
    io.to(restaurant_id).emit('couponsUpdated', { action: 'delete', id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== SERVICES (catalogo servizi con durata) =====================

app.get('/api/services', async (req, res) => {
  try {
    const restaurantId = req.query.restaurant_id || 'rest-1';
    const rows = await dbAll('SELECT * FROM services WHERE restaurant_id = ? ORDER BY category ASC, name ASC', [restaurantId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/services', requireAuth, async (req, res) => {
  try {
    const { restaurant_id, category, name, description, price, duration_minutes, is_addon } = req.body;
    if (!checkScope(req, res, restaurant_id)) return;
    if (!name || !duration_minutes) return res.status(400).json({ error: 'Nome e durata sono obbligatori' });
    const id = 'svc-' + Math.random().toString(36).substr(2, 9);
    await dbRun(
      'INSERT INTO services (id, restaurant_id, category, name, description, price, duration_minutes, is_addon, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)',
      [id, restaurant_id, category || '', name, description || '', price || 0, duration_minutes, is_addon ? 1 : 0, Date.now()]
    );
    const created = await dbGet('SELECT * FROM services WHERE id = ?', [id]);
    io.to(restaurant_id).emit('servicesUpdated', { action: 'create', service: created });
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/services/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbGet('SELECT * FROM services WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Servizio non trovato' });
    if (!checkScope(req, res, existing.restaurant_id)) return;
    const { category, name, description, price, duration_minutes, is_addon, active } = req.body;
    await dbRun(
      'UPDATE services SET category = ?, name = ?, description = ?, price = ?, duration_minutes = ?, is_addon = ?, active = ? WHERE id = ?',
      [category ?? existing.category, name ?? existing.name, description ?? existing.description, price ?? existing.price, duration_minutes ?? existing.duration_minutes, is_addon !== undefined ? (is_addon ? 1 : 0) : existing.is_addon, active !== undefined ? (active ? 1 : 0) : existing.active, id]
    );
    const updated = await dbGet('SELECT * FROM services WHERE id = ?', [id]);
    io.to(existing.restaurant_id).emit('servicesUpdated', { action: 'update', service: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/services/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbGet('SELECT * FROM services WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Servizio non trovato' });
    if (!checkScope(req, res, existing.restaurant_id)) return;
    await dbRun('DELETE FROM services WHERE id = ?', [id]);
    await dbRun('DELETE FROM resource_services WHERE service_id = ?', [id]);
    io.to(existing.restaurant_id).emit('servicesUpdated', { action: 'delete', id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET quali operatori attivi possono eseguire un dato servizio (per la UI di prenotazione cliente)
app.get('/api/services/:id/resources', async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT r.* FROM resources r
       INNER JOIN resource_services rs ON rs.resource_id = r.id
       WHERE rs.service_id = ? AND r.active = 1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== MOTORE DI DISPONIBILITA' =====================
// A differenza del vecchio motore a slot fissi (pranzo/cena da 30 min per l'intero locale),
// qui la disponibilita' si calcola per singola risorsa/operatore e dipende dalla durata
// del servizio scelto: due servizi diversi nello stesso orario possono avere slot diversi.

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function formatMinutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const calculateResourceAvailability = async (resourceId, date, serviceId, addonId = null) => {
  const service = await dbGet('SELECT * FROM services WHERE id = ?', [serviceId]);
  if (!service) return [];
  let durationMinutes = service.duration_minutes || 30;

  if (addonId) {
    const addon = await dbGet('SELECT * FROM services WHERE id = ?', [addonId]);
    if (addon) durationMinutes += addon.duration_minutes || 0;
  }

  const dayOfWeek = new Date(`${date}T12:00:00`).getDay();

  // Un'eccezione per quella data specifica (ferie o orario speciale) ha sempre la precedenza
  // sull'orario settimanale ricorrente.
  const exception = await dbGet('SELECT * FROM resource_exceptions WHERE resource_id = ? AND date = ?', [resourceId, date]);

  let workingRanges;
  if (exception) {
    if (exception.closed) return [];
    workingRanges = [{ open: exception.open_time, close: exception.close_time }];
  } else {
    const hours = await dbAll('SELECT * FROM resource_hours WHERE resource_id = ? AND day_of_week = ?', [resourceId, dayOfWeek]);
    workingRanges = hours.map(h => ({ open: h.open_time, close: h.close_time }));
  }

  if (workingRanges.length === 0) return [];

  const existing = await dbAll(
    `SELECT time, duration_minutes FROM appointments WHERE resource_id = ? AND date = ? AND status NOT IN ('declined', 'cancelled')`,
    [resourceId, date]
  );
  const busyRanges = existing.map(a => {
    const start = parseTimeToMinutes(a.time);
    return { start, end: start + (a.duration_minutes || 30) };
  });

  const SLOT_STEP_MINUTES = 15;
  const rawSlots = [];

  for (const range of workingRanges) {
    const openMins = parseTimeToMinutes(range.open);
    const closeMins = parseTimeToMinutes(range.close);
    if (openMins === null || closeMins === null) continue;

    for (let start = openMins; start + durationMinutes <= closeMins; start += SLOT_STEP_MINUTES) {
      const end = start + durationMinutes;
      const overlaps = busyRanges.some(b => start < b.end && end > b.start);
      if (!overlaps) {
        rawSlots.push(start);
      }
    }
  }

  // === Anti-Buchi (Gap Minimization) ===
  const optimizedSlots = [];
  
  for (const start of rawSlots) {
    const end = start + durationMinutes;

    let maxEndBefore = null;
    let minStartAfter = null;

    for (const range of workingRanges) {
      const openMins = parseTimeToMinutes(range.open);
      const closeMins = parseTimeToMinutes(range.close);
      if (start >= openMins && end <= closeMins) {
        maxEndBefore = openMins;
        minStartAfter = closeMins;
      }
    }

    for (const b of busyRanges) {
      if (b.end <= start && (!maxEndBefore || b.end > maxEndBefore)) maxEndBefore = b.end;
      if (b.start >= end && (!minStartAfter || b.start < minStartAfter)) minStartAfter = b.start;
    }

    const gapBefore = maxEndBefore !== null ? start - maxEndBefore : 0;
    const gapAfter = minStartAfter !== null ? minStartAfter - end : 0;

    // Evitiamo slot che lasciano esattamente 15 o 30 minuti buchi
    const badGapBefore = gapBefore === 15 || gapBefore === 30;
    const badGapAfter = gapAfter === 15 || gapAfter === 30;

    if (!badGapBefore && !badGapAfter) {
      optimizedSlots.push(formatMinutesToTime(start));
    }
  }

  // Se l'ottimizzazione elimina tutto, ritorniamo i rawSlots per non bloccare le prenotazioni
  if (optimizedSlots.length === 0 && rawSlots.length > 0) {
    return rawSlots.map(formatMinutesToTime);
  }

  return optimizedSlots;
};

app.get('/api/resources/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, service_id, addon_id } = req.query;
    if (!date || !service_id) return res.status(400).json({ error: 'date e service_id sono obbligatori' });
    const slots = await calculateResourceAvailability(id, date, service_id, addon_id);
    res.json({ resource_id: id, date, service_id, addon_id, slots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== APPOINTMENTS (sostituisce il vecchio "orders") =====================

app.get('/api/appointments', requireAuth, async (req, res) => {
  try {
    const restaurantId = req.query.restaurant_id || 'rest-1';
    if (!checkScope(req, res, restaurantId)) return;
    const rows = await dbAll('SELECT * FROM appointments WHERE restaurant_id = ? ORDER BY date DESC, time DESC', [restaurantId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/appointments/:id', async (req, res) => {
  try {
    const row = await dbGet('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Appuntamento non trovato' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST crea un nuovo appuntamento (pubblica, usata dal booking del cliente)
app.post('/api/appointments', async (req, res) => {
  try {
    const { restaurant_id, resource_id, service_id, addon_id, customer_name, customer_phone, customer_email, date, time, notes, source, has_guarantee } = req.body;
    if (!restaurant_id || !resource_id || !service_id || !customer_name || !date || !time) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti' });
    }

    const service = await dbGet('SELECT * FROM services WHERE id = ? AND restaurant_id = ?', [service_id, restaurant_id]);
    if (!service) return res.status(404).json({ error: 'Servizio non trovato' });

    let finalName = service.name;
    let finalDuration = service.duration_minutes;
    let finalPrice = service.price;

    if (addon_id) {
      const addon = await dbGet('SELECT * FROM services WHERE id = ? AND restaurant_id = ?', [addon_id, restaurant_id]);
      if (addon) {
        finalName = `${service.name} + ${addon.name}`;
        finalDuration += addon.duration_minutes || 0;
        finalPrice += addon.price || 0;
      }
    }

    // Ricontrolla che lo slot richiesto sia ancora libero
    const availableSlots = await calculateResourceAvailability(resource_id, date, service_id, addon_id);
    if (!availableSlots.includes(time)) {
      return res.status(409).json({ error: "Lo slot richiesto o l'add-on si sovrappone con un altro appuntamento" });
    }

    const id = 'apt-' + Math.random().toString(36).substr(2, 9);
    await dbRun(
      `INSERT INTO appointments (id, restaurant_id, resource_id, service_id, service_name, duration_minutes, price, customer_name, customer_phone, customer_email, date, time, notes, status, source, has_guarantee, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'accepted', ?, ?, ?)`,
      [id, restaurant_id, resource_id, service_id, finalName, finalDuration, finalPrice, customer_name, customer_phone || '', customer_email || '', date, time, notes || '', source || 'direct', has_guarantee ? 1 : 0, Date.now()]
    );

    // Registra o aggiorna il cliente nel CRM, cosi' la lista clienti si popola da sola con le prenotazioni
    if (customer_phone && customer_phone.trim()) {
      const cleanPhone = customer_phone.trim();
      const existingCustomer = await dbGet('SELECT * FROM customers WHERE phone = ? AND restaurant_id = ?', [cleanPhone, restaurant_id]);
      if (existingCustomer) {
        await dbRun(
          `UPDATE customers SET name = ?, email = CASE WHEN ? != '' THEN ? ELSE email END WHERE phone = ? AND restaurant_id = ?`,
          [customer_name.trim(), (customer_email || '').trim(), (customer_email || '').trim(), cleanPhone, restaurant_id]
        );
      } else {
        await dbRun(
          `INSERT INTO customers (phone, restaurant_id, name, email, notes, no_show_count, blocked, created_at) VALUES (?, ?, ?, ?, '', 0, 0, ?)`,
          [cleanPhone, restaurant_id, customer_name.trim(), (customer_email || '').trim(), Date.now()]
        );
      }
    }

    const created = await dbGet('SELECT * FROM appointments WHERE id = ?', [id]);
    io.to(restaurant_id).emit('appointmentCreated', created);
    
    // --- SEND EMAILS ---
    try {
      const restaurant = await dbGet('SELECT * FROM restaurants WHERE id = ?', [restaurant_id]);
      if (restaurant) {
        // To Customer
        if (created.customer_email) {
          sendCustomerConfirmationEmail(created, restaurant);
        }
        // To Salon Admin
        const admin = await dbGet('SELECT email FROM users WHERE restaurant_id = ? AND role = "merchant"', [restaurant_id]);
        if (admin && admin.email) {
          sendSalonNotificationEmail(created, restaurant, admin.email);
        }
      }
    } catch (e) {
      console.error("Errore invio email post-creazione appuntamento:", e);
    }

    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET route per testare la configurazione SMTP
app.get('/api/test-email', async (req, res) => {
  try {
    if (!resendClient) {
      return res.status(400).json({ error: 'Servizio email non configurato. Controlla le variabili d\'ambiente (SMTP_HOST, SMTP_USER, SMTP_PASS).' });
    }
    const testTo = req.query.email || process.env.SMTP_USER;
    if (!testTo) {
      return res.status(400).json({ error: 'Nessuna email di destinazione specificata. Passa ?email=tuaemail@dominio.it' });
    }
    
    let fromEmail = RESEND_FROM;
    if (process.env.RESEND_FROM) { 
      const match = process.env.RESEND_FROM.match(/<([^>]+)>/); 
      if (match && match[1]) fromEmail = match[1]; 
    }

    const response = await resendClient.emails.send({
      from: `"Specchietto Test" <${fromEmail}>`,
      to: testTo,
      subject: 'Test Invio Email Specchietto',
      text: 'Se stai leggendo questa mail, il server SMTP è configurato correttamente!',
      html: '<p>Se stai leggendo questa mail, il <strong>server SMTP</strong> è configurato correttamente! 🎉</p>'
    });
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    res.json({ success: true, message: 'Email inviata con successo!', info: response.data ? response.data.id : 'ok' });
  } catch (err) {
    console.error('Test Email Fallito:', err);
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

// GET route per testare notifica salone e buildHtmlEmail
app.get('/api/test-notification', async (req, res) => {
  try {
    const testEmail = req.query.email || 'info@altamente.it';
    const fakeRestaurant = { name: "Test Salone", slug: "test", primary_color: "#000000" };
    
    // Simulate what sendSalonNotificationEmail does exactly
    const subject = `Nuova Prenotazione: Test`;
    const contentHtml = `<p>Test notifica salone.</p>`;
    const htmlBody = buildHtmlEmail(subject, "Nuova Prenotazione", contentHtml, "Apri Dashboard", "https://specchietto.app", "Specchietto Notifiche", fakeRestaurant);

    if (!resendClient) {
      return res.status(400).json({ error: "Resend non configurato" });
    }

    let fromEmail = 'onboarding@resend.dev';
    if (typeof RESEND_FROM !== 'undefined') fromEmail = RESEND_FROM;

    if (fromEmail.includes('<')) {
      const match = fromEmail.match(/<([^>]+)>/);
      if (match && match[1]) fromEmail = match[1];
    }

    const response = await resendClient.emails.send({
      from: `"Specchietto" <${fromEmail}>`,
      to: testEmail,
      subject,
      html: htmlBody
    });

    if (response.error) throw new Error(response.error.message);
    
    res.json({ success: true, message: 'Notifica inviata!', info: response.data ? response.data.id : 'ok' });
  } catch (err) {
    console.error('Test Notifica Fallito:', err);
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

// PUT aggiorna lo stato di un appuntamento (confermato, arrivato, completato, no-show, rifiutato...)
app.put('/api/appointments/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const existing = await dbGet('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Appuntamento non trovato' });
    if (!checkScope(req, res, existing.restaurant_id)) return;

    await dbRun('UPDATE appointments SET status = ?, reason = ? WHERE id = ?', [status, reason || '', id]);

    // Incrementa il contatore no-show del cliente nel CRM
    if (status === 'noshow' && existing.status !== 'noshow' && existing.customer_phone) {
      await dbRun(
        'UPDATE customers SET no_show_count = no_show_count + 1 WHERE phone = ? AND restaurant_id = ?',
        [existing.customer_phone, existing.restaurant_id]
      );
    }

    if (status === 'completed' && existing.status !== 'completed') {
      
      // 1. Invia email recensione immediatamente (indipendentemente da telefono o prezzo)
      if (existing.customer_email && existing.survey_sent === 0) {
        try {
          const restaurant = await dbGet('SELECT * FROM restaurants WHERE id = ?', [existing.restaurant_id]);
          const googleLink = restaurant?.google_review_link || null;
          const sent = await sendReviewEmail(existing, restaurant, googleLink);
          if (sent) await dbRun('UPDATE appointments SET survey_sent = 1 WHERE id = ?', [existing.id]);
        } catch (e) {
          console.error('Errore invio email recensione dal checkout:', e);
        }
      }

      // 2. Aggiungi punti fedeltà se ci sono telefono e prezzo
      if (existing.customer_phone && existing.price) {
        const restaurant = await dbGet('SELECT * FROM restaurants WHERE id = ?', [existing.restaurant_id]);
        if (restaurant && restaurant.loyalty_enabled === 1) {
          const points = Math.floor(existing.price * (restaurant.loyalty_points_per_euro || 1));
          if (points > 0) {
            await dbRun(
              'UPDATE customers SET loyalty_points = loyalty_points + ? WHERE phone = ? AND restaurant_id = ?',
              [points, existing.customer_phone, existing.restaurant_id]
            );
          }
        }
      }
    }

    const updated = await dbGet('SELECT * FROM appointments WHERE id = ?', [id]);
    io.to(existing.restaurant_id).emit('appointmentUpdated', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/appointments/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbGet('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Appuntamento non trovato' });
    if (!checkScope(req, res, existing.restaurant_id)) return;
    await dbRun('DELETE FROM appointments WHERE id = ?', [id]);
    io.to(existing.restaurant_id).emit('appointmentDeleted', { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TRANSACTIONS ENDPOINTS ---
app.get('/api/transactions', requireAuth, async (req, res) => {
  try {
    const { restaurant_id } = req.query;
    if (!checkScope(req, res, restaurant_id)) return;
    const transactions = await dbAll('SELECT * FROM transactions WHERE restaurant_id = ? ORDER BY timestamp DESC', [restaurant_id]);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', requireAuth, async (req, res) => {
  try {
    const { restaurant_id, appointment_id, total_amount, payment_method, items, discount_code } = req.body;
    if (!checkScope(req, res, restaurant_id)) return;

    const apt = await dbGet('SELECT * FROM appointments WHERE id = ?', [appointment_id]);
    if (!apt) return res.status(404).json({ error: 'Appuntamento non trovato' });

    const id = crypto.randomUUID();
    await dbRun(
      'INSERT INTO transactions (id, restaurant_id, appointment_id, customer_name, customer_phone, total_amount, payment_method, items, discount_code, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, restaurant_id, appointment_id, apt.customer_name, apt.customer_phone, total_amount, payment_method, JSON.stringify(items || []), discount_code || '', Date.now()]
    );

    // Update appointment price and status
    await dbRun('UPDATE appointments SET status = ?, price = ? WHERE id = ?', ['completed', total_amount, appointment_id]);
    
    // Trigger the same logic as PUT /status (reviews and loyalty points)
    if (apt.status !== 'completed') {
      // 1. Invia email recensione
      if (apt.customer_email && apt.survey_sent === 0) {
        try {
          const restaurant = await dbGet('SELECT * FROM restaurants WHERE id = ?', [restaurant_id]);
          const googleLink = restaurant?.google_review_link || null;
          const sent = await sendReviewEmail(apt, restaurant, googleLink);
          if (sent) await dbRun('UPDATE appointments SET survey_sent = 1 WHERE id = ?', [appointment_id]);
        } catch (e) {
          console.error('Errore invio email recensione dal checkout:', e);
        }
      }

      // 2. Aggiungi punti fedeltà
      if (apt.customer_phone && total_amount > 0) {
        const restaurant = await dbGet('SELECT * FROM restaurants WHERE id = ?', [restaurant_id]);
        if (restaurant && restaurant.loyalty_enabled === 1) {
          const points = Math.floor(total_amount * (restaurant.loyalty_points_per_euro || 1));
          if (points > 0) {
            await dbRun(
              'UPDATE customers SET loyalty_points = loyalty_points + ? WHERE phone = ? AND restaurant_id = ?',
              [points, apt.customer_phone, restaurant_id]
            );
          }
        }
      }
    }

    const updatedApt = await dbGet('SELECT * FROM appointments WHERE id = ?', [appointment_id]);
    io.to(restaurant_id).emit('appointmentUpdated', updatedApt);
    
    res.json({ success: true, transactionId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- REVIEWS ENDPOINTS ---
app.get('/api/reviews', requireAuth, async (req, res) => {
  try {
    const { restaurant_id } = req.query;
    if (!checkScope(req, res, restaurant_id)) return;
    const rows = await dbAll('SELECT * FROM reviews WHERE restaurant_id = ? ORDER BY created_at DESC', [restaurant_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pubblico: il cliente lascia una recensione dal link ricevuto via email (nessuna autenticazione)
app.post('/api/reviews', async (req, res) => {
  try {
    const { appointment_id, rating, comment } = req.body;
    const ratingNum = parseInt(rating, 10);
    if (!appointment_id) return res.status(400).json({ error: 'Appuntamento mancante' });
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) return res.status(400).json({ error: 'Valutazione non valida' });

    const appointment = await dbGet('SELECT * FROM appointments WHERE id = ?', [appointment_id]);
    if (!appointment) return res.status(404).json({ error: 'Appuntamento non trovato' });

    const already = await dbGet('SELECT id FROM reviews WHERE appointment_id = ?', [appointment_id]);
    if (already) return res.status(400).json({ error: 'Hai già lasciato una recensione per questo appuntamento.' });

    const id = 'rev-' + crypto.randomBytes(8).toString('hex');
    await dbRun(
      'INSERT INTO reviews (id, restaurant_id, appointment_id, customer_name, customer_email, rating, comment, response, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)',
      [id, appointment.restaurant_id, appointment_id, appointment.customer_name || '', appointment.customer_email || '', ratingNum, comment || '', Date.now()]
    );

    const created = await dbGet('SELECT * FROM reviews WHERE id = ?', [id]);
    io.to(appointment.restaurant_id).emit('reviewsUpdated', { action: 'create', review: created });
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Il salone risponde pubblicamente a una recensione
app.post('/api/reviews/:id/reply', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    if (!response || !response.trim()) return res.status(400).json({ error: 'Risposta obbligatoria' });

    const existing = await dbGet('SELECT * FROM reviews WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Recensione non trovata' });
    if (!checkScope(req, res, existing.restaurant_id)) return;

    await dbRun('UPDATE reviews SET response = ? WHERE id = ?', [response.trim(), id]);
    const updated = await dbGet('SELECT * FROM reviews WHERE id = ?', [id]);
    io.to(existing.restaurant_id).emit('reviewsUpdated', { action: 'reply', review: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- WAITLIST ENDPOINTS ---
app.get('/api/waitlist', requireAuth, async (req, res) => {
  try {
    const { restaurant_id, date } = req.query;
    if (!checkScope(req, res, restaurant_id)) return;
    
    let query = 'SELECT * FROM waitlist WHERE restaurant_id = ?';
    const params = [restaurant_id];
    
    if (date) {
      query += ' AND date_requested = ?';
      params.push(date);
    }
    
    query += ' ORDER BY timestamp ASC';
    const rows = await dbAll(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/waitlist', async (req, res) => {
  try {
    const { restaurant_id, customer_name, customer_phone, customer_email, date_requested, time_preference, notes } = req.body;
    if (!restaurant_id || !customer_name || !customer_phone || !date_requested) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti' });
    }

    const id = 'wait-' + Math.random().toString(36).substr(2, 9);
    await dbRun(
      `INSERT INTO waitlist (id, restaurant_id, customer_name, customer_phone, customer_email, date_requested, time_preference, notes, status, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'waiting', ?)`,
      [id, restaurant_id, customer_name, customer_phone, customer_email || '', date_requested, time_preference || 'any', notes || '', Date.now()]
    );
    
    // Auto-create customer in CRM if missing
    await dbRun(`
      INSERT OR IGNORE INTO customers (phone, restaurant_id, name, email, created_at)
      VALUES (?, ?, ?, ?)
    `, [customer_phone.trim(), restaurant_id, customer_name.trim(), (customer_email || '').trim(), Date.now()]);

    const row = await dbGet('SELECT * FROM waitlist WHERE id = ?', [id]);
    io.to(restaurant_id).emit('waitlistUpdated', row);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/waitlist/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const existing = await dbGet('SELECT * FROM waitlist WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Richiesta non trovata' });
    if (!checkScope(req, res, existing.restaurant_id)) return;

    await dbRun('UPDATE waitlist SET status = ? WHERE id = ?', [status, id]);
    const updated = await dbGet('SELECT * FROM waitlist WHERE id = ?', [id]);
    io.to(existing.restaurant_id).emit('waitlistUpdated', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/waitlist/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbGet('SELECT * FROM waitlist WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Richiesta non trovata' });
    if (!checkScope(req, res, existing.restaurant_id)) return;
    
    await dbRun('DELETE FROM waitlist WHERE id = ?', [id]);
    io.to(existing.restaurant_id).emit('waitlistDeleted', { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Background Worker for 24h Reminders
const checkAndSendReminders = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString().split('T')[0];
    
    const appointments = await dbAll(`SELECT * FROM appointments WHERE date = ? AND (status = 'pending' OR status = 'accepted') AND reminder_sent = 0`, [tomorrowIso]);

    for (const apt of appointments) {
      const restaurant = await dbGet("SELECT * FROM restaurants WHERE id = ?", [apt.restaurant_id]);
      if (restaurant) {
        console.log(`[Reminders] Sending 24h reminder to ${apt.customer_email} for apt ${apt.id}`);
        await sendReminderEmail(apt, restaurant);
        await dbRun("UPDATE appointments SET reminder_sent = 1 WHERE id = ?", [apt.id]);
      }
    }
  } catch (err) {
    console.error("Errore nel worker checkAndSendReminders:", err);
  }
};

// Background Worker for Review Requests (After Appointment Completion)
const checkAndSendReviews = async () => {
  try {
    const appointments = await dbAll(`SELECT * FROM appointments WHERE status = 'completed' AND survey_sent = 0`);

    for (const apt of appointments) {
      const restaurant = await dbGet("SELECT * FROM restaurants WHERE id = ?", [apt.restaurant_id]);
      if (restaurant) {
        // Find Google Maps Link
        const setting = await dbGet("SELECT value FROM settings WHERE restaurant_id = ? AND key = 'google_review_link'", [apt.restaurant_id]);
        const googleLink = setting ? setting.value : null;

        console.log(`[Reviews] Sending review request to ${apt.customer_email} for apt ${apt.id}`);
        const sent = await sendReviewEmail(apt, restaurant, googleLink);
        if (sent) await dbRun("UPDATE appointments SET survey_sent = 1 WHERE id = ?", [apt.id]);
      }
    }
  } catch (err) {
    console.error("Errore nel worker checkAndSendReviews:", err);
  }
};

// Start checking every 15 minutes (900000 ms)
setInterval(checkAndSendReminders, 900000);
setInterval(checkAndSendReviews, 900000);
checkAndSendReminders();
checkAndSendReviews();

// Start the server
server.listen(PORT, () => {
  console.log(`Backend server in esecuzione sulla porta ${PORT}`);
});
