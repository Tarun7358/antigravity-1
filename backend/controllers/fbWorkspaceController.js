const { getFirestore } = require('../config/firebaseAdmin');

const ensureFirebase = () => {
  try {
    return getFirestore();
  } catch (err) {
    return null;
  }
};

const createWorkspace = async (req, res) => {
  const db = ensureFirebase();
  if (!db) return res.status(503).json({ message: 'Firebase Admin not configured on backend' });

  try {
    const { name, description = '', visibility = 'private', type = 'Development Teams', category = 'Web Development', tags = [], rules = {} } =
      req.body || {};

    if (!name || !String(name).trim()) return res.status(400).json({ message: 'name is required' });

    const uid = req.firebaseUser.uid;
    const now = new Date();

    const workspaceRef = db.collection('workspaces').doc();
    const workspaceDoc = {
      name: String(name).trim(),
      description,
      createdAt: now,
      updatedAt: now,
      ownerId: uid,
      visibility,
      type,
      category,
      tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
      memberIds: [uid],
      memberCount: 1,
      rules: {
        enabled: !!rules?.enabled,
        text: rules?.enabled ? String(rules?.text || '') : '',
      },
      onboarding: {
        enabled: true,
        checklist: ['Pick your role', 'Pick your skills', 'Read the rules', 'Say hello in #general'],
      },
      verificationLevel: 0,
      stats: {
        xp: 0,
        level: 1,
        boosts: 0,
        collaborationStreakDays: 0,
        lastActivityAt: now,
      },
    };

    const batch = db.batch();
    batch.set(workspaceRef, workspaceDoc);

    const memberRef = workspaceRef.collection('members').doc(uid);
    batch.set(memberRef, {
      uid,
      username: req.firebaseUser.name || req.firebaseUser.email || 'User',
      avatar: req.firebaseUser.picture || '',
      nickname: '',
      roles: ['@everyone', 'Owner'],
      skills: [],
      status: 'online',
      joinedAt: now,
      rulesAcceptedAt: workspaceDoc.rules.enabled ? now : null,
    });

    const channelsCol = workspaceRef.collection('channels');
    batch.set(channelsCol.doc(), { name: 'general', type: 'text', createdAt: now });
    batch.set(channelsCol.doc(), { name: 'announcements', type: 'text', isAnnouncements: true, createdAt: now });
    if (workspaceDoc.rules.enabled) batch.set(channelsCol.doc(), { name: 'rules', type: 'text', isRules: true, createdAt: now });
    batch.set(channelsCol.doc(), { name: 'voice-lounge', type: 'voice', createdAt: now });

    batch.set(workspaceRef.collection('activity').doc(), {
      type: 'workspace.created',
      message: `${req.firebaseUser.name || 'Someone'} created the workspace`,
      actor: { uid, username: req.firebaseUser.name || req.firebaseUser.email || 'User', avatar: req.firebaseUser.picture || '' },
      meta: { visibility, type, category },
      createdAt: now,
    });

    batch.set(workspaceRef.collection('audit').doc(), {
      action: 'WORKSPACE_CREATE',
      actor: { uid, username: req.firebaseUser.name || req.firebaseUser.email || 'User' },
      target: { type: 'workspace', id: workspaceRef.id, name: workspaceDoc.name },
      meta: { visibility, type, category, tags: workspaceDoc.tags },
      createdAt: now,
    });

    await batch.commit();

    return res.status(201).json({ id: workspaceRef.id, _id: workspaceRef.id, ...workspaceDoc });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getMyWorkspaces = async (req, res) => {
  const db = ensureFirebase();
  if (!db) return res.status(503).json({ message: 'Firebase Admin not configured on backend' });

  try {
    const uid = req.firebaseUser.uid;
    const snap = await db.collection('workspaces').where('memberIds', 'array-contains', uid).get();
    const items = snap.docs.map((d) => ({ id: d.id, _id: d.id, ...d.data() }));
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getPublicWorkspaces = async (req, res) => {
  const db = ensureFirebase();
  if (!db) return res.status(503).json({ message: 'Firebase Admin not configured on backend' });

  try {
    const { category, q } = req.query || {};
    let queryRef = db.collection('workspaces').where('visibility', '==', 'public');
    if (category && category !== 'All') queryRef = queryRef.where('category', '==', category);
    const snap = await queryRef.get();
    const items = snap.docs.map((d) => ({ id: d.id, _id: d.id, ...d.data() }));
    if (q) {
      const s = String(q).toLowerCase();
      return res.json(items.filter((ws) => `${ws.name || ''} ${ws.description || ''} ${(ws.tags || []).join(' ')}`.toLowerCase().includes(s)));
    }
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { createWorkspace, getMyWorkspaces, getPublicWorkspaces };

