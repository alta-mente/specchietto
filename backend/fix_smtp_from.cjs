const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
let code = fs.readFileSync(serverFile, 'utf8');

// Replace all SMTP_FROM with RESEND_FROM
code = code.replace(/SMTP_FROM/g, 'RESEND_FROM');

fs.writeFileSync(serverFile, code);
console.log('Fixed SMTP_FROM references.');
