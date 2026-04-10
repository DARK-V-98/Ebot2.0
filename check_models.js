const https = require('https');
const fs = require('fs');
const path = require('path');

// Read key directly from .env.local
let key = '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY\s*=\s*(AIza[^\r\n]+)/);
  if (match) key = match[1].split(' ')[0].split('"').join('').split("'").join('').trim();
} catch (e) {
  console.error('Could not read .env.local');
}

if (!key) {
  console.error('No GEMINI_API_KEY found in .env.local');
  process.exit(1);
}

console.log('--- DIAGNOSTIC START ---');
console.log('Checking Key:', key.substring(0, 10) + '...');

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      if (data.error) {
        console.error('❌ Google Error:', data.error.message);
        console.log('Status Code:', res.statusCode);
      } else {
        console.log('✅ Success! Your key can see:');
        data.models.forEach(m => console.log(' -> ' + m.name));
      }
    } catch (e) {
      console.error('Failed to parse response:', body);
    }
  });
}).on('error', (e) => {
  console.error('Network Error:', e.message);
});
