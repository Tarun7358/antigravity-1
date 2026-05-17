const admin = require('firebase-admin');

let initAttempted = false;
let initError = null;

const initFirebaseAdmin = () => {
  if (admin.apps.length > 0) return admin;
  if (initAttempted) {
    if (initError) throw initError;
    return admin;
  }
  initAttempted = true;

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({ projectId });
      return admin;
    }

    if (!projectId || !clientEmail || !privateKeyRaw) {
      throw new Error(
        'Firebase Admin not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY (or GOOGLE_APPLICATION_CREDENTIALS).'
      );
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
    return admin;
  } catch (err) {
    initError = err;
    throw err;
  }
};

const getFirestore = () => initFirebaseAdmin().firestore();
const getAuth = () => initFirebaseAdmin().auth();

module.exports = { initFirebaseAdmin, getFirestore, getAuth };

