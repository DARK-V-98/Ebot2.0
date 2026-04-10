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
  console.log("🚀 Initializing eBot Worker...");
  
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

  // --- Real-time Dashboard Sync ---
  const snapshot = await db.collection('businesses').where('email', '==', TARGET_EMAIL).limit(1).get();
  if (snapshot.empty) return console.error("❌ Business not found in Firestore.");
  const bizRef = snapshot.docs[0].ref;

  // Listen for "Disconnect" command from Dashboard
  bizRef.onSnapshot(async (doc) => {
    const data = doc.data();
    if (data.whatsapp_status === 'disconnected' && sock?.user && !isReconnecting) {
      console.log("🛑 DISCONNECT COMMAND RECEIVED FROM DASHBOARD");
      await sock.logout();
      if (fs.existsSync(WALLET_AUTH_DIR)) {
        fs.rmSync(WALLET_AUTH_DIR, { recursive: true, force: true });
      }
      process.exit(0); // Exit so you can restart clean
    }
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('📷 QR Code generated.');
      const qrDataUrl = await QRCode.toDataURL(qr);
      await bizRef.update({ whatsapp_qr: qrDataUrl, whatsapp_status: 'disconnected' });
    }

    if (connection === 'open') {
      console.log('✅ Connected to WhatsApp!');
      await bizRef.update({ whatsapp_status: 'connected', whatsapp_qr: null });
    }

    if (connection === 'close') {
      const code = (lastDisconnect.error instanceof Boom)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log(`Connection closed (Code: ${code}). Reconnecting: ${shouldReconnect}`);
      
      if (shouldReconnect) {
        isReconnecting = true;
        setTimeout(startBot, 5000);
      } else {
        await bizRef.update({ whatsapp_status: 'disconnected', whatsapp_qr: null });
        if (fs.existsSync(WALLET_AUTH_DIR)) {
          fs.rmSync(WALLET_AUTH_DIR, { recursive: true, force: true });
        }
      }
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!text) return;

    try {
      // Use your defined domain or local development server
      const apiBase = process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3000';

      const response = await axios.post(`${apiBase}/api/simulator`, {
        message: text,
        phone: jid.split('@')[0],
        name: msg.pushName || 'Customer'
      }, {
        headers: { 'Authorization': 'Bearer dev-token' }
      });

      if (response.data.reply) {
        await sock.sendMessage(jid, { text: response.data.reply });
      }
    } catch (err) {
      console.error("❌ Reply Error:", err.message);
    }
  });
}

startBot();
