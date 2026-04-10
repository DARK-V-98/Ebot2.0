const admin = require('firebase-admin');

try {
  const serviceAccount = require('./firebase-admin-sdk.json');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (e) {
  // If json doesn't exist, try env init fallback, or assume failure
  console.log('Firebase config not found');
}

const db = admin.firestore();

async function check() { 
  const b = await db.collection('businesses').get(); 
  b.forEach(doc => console.log('Business:', doc.id, doc.data().whatsapp_phone_id)); 
} 
check().catch(console.error);
