const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const axios = require('axios');
const pino = require('pino');
const QRCode = require('qrcode');
const admin = require('firebase-admin');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const WALLET_AUTH_DIR = 'auth_info_baileys';
const SERVICE_ACCOUNT_FILE = './eduhubsl0-firebase-adminsdk-fbsvc-55642e63cb.json';
const TARGET_EMAIL = 'tikfese@gmail.com'; 

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(require(SERVICE_ACCOUNT_FILE)) });
}
const db = admin.firestore();

let sock;
let isReconnecting = false;

async function startBot() {
  console.log("🚀 eBot Bridge Starting...");
  
  const { state, saveCreds } = await useMultiFileAuthState(WALLET_AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'error' }),
    browser: ['eBot System', 'Chrome', '10.0.0'],
    syncFullHistory: false
  });

  sock.ev.on('creds.update', saveCreds);

  const snapshot = await db.collection('businesses').where('email', '==', TARGET_EMAIL).limit(1).get();
  if (snapshot.empty) return console.error("❌ Business not found in Firestore.");
  const bizRef = snapshot.docs[0].ref;

  bizRef.onSnapshot(async (doc) => {
    const data = doc.data();
    if (data.whatsapp_status === 'disconnected' && sock?.user && !isReconnecting) {
      await sock.logout();
      if (fs.existsSync(WALLET_AUTH_DIR)) fs.rmSync(WALLET_AUTH_DIR, { recursive: true, force: true });
      process.exit(0);
    }
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      const qrDataUrl = await QRCode.toDataURL(qr);
      await bizRef.update({ whatsapp_qr: qrDataUrl, whatsapp_status: 'disconnected' });
    }

    if (connection === 'open') {
      console.log('✅ AI BOT IS LIVE ON YOUR PHONE!');
      await bizRef.update({ whatsapp_status: 'connected', whatsapp_qr: null });
    }

    if (connection === 'close') {
      const code = (lastDisconnect.error instanceof Boom)?.output?.statusCode;
      if (code === 401 || code === 400) {
        if (fs.existsSync(WALLET_AUTH_DIR)) fs.rmSync(WALLET_AUTH_DIR, { recursive: true, force: true });
      }
      setTimeout(startBot, 5000);
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!text) return;

    console.log(`\n💬 Customer: ${text}`);

    const payload = {
      message: text,
      phone: jid.split('@')[0],
      name: msg.pushName || 'Customer'
    };
    const headers = { 'Authorization': 'Bearer dev-token' };

    // TRY LIVE FIRST, FALLBACK TO LOCAL
    const urls = [
      process.env.NEXT_PUBLIC_SITE_URL,
      'http://127.0.0.1:3000'
    ].filter(Boolean);

    let replied = false;
    for (const url of urls) {
      if (replied) break;
      try {
        const response = await axios.post(`${url}/api/simulator`, payload, { headers, timeout: 60000 });
        if (response.data.reply) {
          console.log(`🤖 AI (${url}): ${response.data.reply}`);
          await sock.sendMessage(jid, { text: response.data.reply });
          replied = true;
        }
      } catch (err) {
        // Silently try next URL if one fails
      }
    }

    if (!replied) {
      console.error("❌ Could not connect to your website (Make sure it is deployed or local is running).");
    }
  });
}

startBot();
