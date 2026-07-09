const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
let code = fs.readFileSync(serverFile, 'utf8');

// Replace await resendClient.emails.send(...)
code = code.replace(/await resendClient\.emails\.send\(\{([^\}]+)\}\);/g, `const response = await resendClient.emails.send({$1});\n    if (response.error) throw new Error(response.error.message);`);

fs.writeFileSync(serverFile, code);
console.log('Fixed resend error handling.');
