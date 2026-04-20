import * as admin from 'firebase-admin';

// Re-initialize check to prevent multiple initializations in dev HMR
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n'),
        }),
      });
      console.log(`[firebase-admin] Initialized for project: ${projectId}`);
    } else {
      console.warn('[firebase-admin] Missing credentials in .env.local. Admin SDK not initialized.');
    }
  } catch (error: any) {
    console.error('[firebase-admin] Initialization Error:', error.message);
  }
}

// Exported database and auth instances
// Note: These will still throw if accessed before initialization, but won't crash the module load
export const db = admin.firestore();
export const auth = admin.auth();

