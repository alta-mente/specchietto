const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
let code = fs.readFileSync(serverFile, 'utf8');

// Replace import
code = code.replace("import nodemailer from 'nodemailer';", "import { Resend } from 'resend';");

// Replace configuration block
const oldConfig = `// Configurazione SMTP per le notifiche email
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || \`"Specchietto" <\${process.env.SMTP_USER || 'noreply@specchietto.app'}>\`;
// SMTP_TO removed from requirements as emails are routed dynamically to customers and salons.

let emailTransporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  try {
    emailTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      connectionTimeout: 15000, // 15 secondi
      greetingTimeout: 15000,    // 15 secondi
      socketTimeout: 15000,     // 15 secondi
      dnsTimeout: 15000          // 15 secondi
    });
    console.log(\`✉️ Servizio email configurato con successo (Host: \${SMTP_HOST}).\`);
  } catch (err) {
    console.error('❌ Errore configurazione SMTP email:', err);
  }
} else {
  console.log('ℹ️ Credenziali SMTP non configurate del tutto (SMTP_HOST, SMTP_USER, SMTP_PASS). Le notifiche email saranno simulate.');
}`;

const newConfig = `// Configurazione Resend per le notifiche email
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM = process.env.RESEND_FROM || process.env.SMTP_FROM || 'onboarding@resend.dev';

let resendClient = null;

if (RESEND_API_KEY) {
  resendClient = new Resend(RESEND_API_KEY);
  console.log('✉️ Servizio email configurato con successo tramite Resend API.');
} else {
  console.log('ℹ️ RESEND_API_KEY non configurata. Le notifiche email saranno simulate.');
}`;

code = code.replace(oldConfig, newConfig);

// Replace fromEmail default logic in test-email
code = code.replace(/let fromEmail = process\.env\.SMTP_USER \|\| 'noreply@specchietto\.app';/g, "let fromEmail = RESEND_FROM;");
// Replace fromEmail default logic in emails
code = code.replace(/let fromEmail = 'noreply@specchietto\.app';\n\s*if \(SMTP_FROM\) \{ const match = SMTP_FROM\.match\(\/<\(\[^>\]\+\)>\/\); if \(match && match\[1\]\) fromEmail = match\[1\]; \}/g, `let fromEmail = RESEND_FROM;\n    if (RESEND_FROM.includes('<')) { const match = RESEND_FROM.match(/<([^>]+)>/); if (match && match[1]) fromEmail = match[1]; }`);


// Global replaces
code = code.replace(/emailTransporter/g, 'resendClient');
code = code.replace(/\.sendMail\(/g, '.emails.send(');

fs.writeFileSync(serverFile, code);
console.log('Done replacing nodemailer with resend in server.js');
