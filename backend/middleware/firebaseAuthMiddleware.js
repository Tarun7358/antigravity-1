const { getAuth } = require('../config/firebaseAdmin');

const protectFirebase = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) return res.status(401).json({ message: 'Not authorized, no Firebase token' });

  try {
    const auth = getAuth();
    const decoded = await auth.verifyIdToken(token);
    req.firebaseUser = decoded;
    next();
  } catch (err) {
    const message = String(err?.message || '');
    if (message.includes('Firebase Admin not configured')) {
      return res.status(503).json({ message: 'Firebase Admin not configured on backend' });
    }
    return res.status(401).json({ message: 'Not authorized, Firebase token invalid' });
  }
};

module.exports = { protectFirebase };
