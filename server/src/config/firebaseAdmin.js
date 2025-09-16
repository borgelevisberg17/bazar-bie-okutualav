const admin = require('firebase-admin');

// Verifica variáveis obrigatórias
if (!process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY) {
    if (process.env.NODE_ENV !== 'development') {
        throw new Error('Missing Firebase environment variables');
    } else {
        console.warn("Firebase credentials not found, skipping initialization.");
    }
} else if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

module.exports = admin;