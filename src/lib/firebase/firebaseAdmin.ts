import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // Attempt to initialize from explicit env variables
    if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle newline characters in the private key string from env
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      // Fallback to default application credentials if GOOGLE_APPLICATION_CREDENTIALS is set
      admin.initializeApp();
    }
    console.log('Firebase Admin Initialized Successfully');
  } catch (error: any) {
    console.error('Firebase Admin Initialization Error:', error.stack);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
