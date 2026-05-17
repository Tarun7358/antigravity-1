import { db } from '../config/firebase';
import { addDoc, collection, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';

const levelFromXp = (xp) => {
  const safeXp = Math.max(0, Number(xp || 0));
  return Math.max(1, Math.floor(Math.sqrt(safeXp / 100)) + 1);
};

export const logWorkspaceActivity = async (workspaceId, event) => {
  if (!workspaceId) return;
  try {
    const activityCol = collection(db, 'workspaces', workspaceId, 'activity');

    await addDoc(activityCol, {
      ...event,
      createdAt: serverTimestamp(),
    });

    // Update XP + derived level in a transaction for consistency.
    const workspaceRef = doc(db, 'workspaces', workspaceId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(workspaceRef);
      if (!snap.exists()) return;
      const data = snap.data();
      const prevXp = data?.stats?.xp || 0;
      const nextXp = prevXp + 10; // MVP: fixed XP per activity
      const nextLevel = levelFromXp(nextXp);
      tx.update(workspaceRef, {
        'stats.xp': nextXp,
        'stats.level': nextLevel,
        'stats.lastActivityAt': serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    console.warn("Non-critical: Failed to log workspace activity", err);
  }
};

export const logWorkspaceAudit = async (workspaceId, event) => {
  if (!workspaceId) return;
  try {
    const auditCol = collection(db, 'workspaces', workspaceId, 'audit');
    await addDoc(auditCol, {
      ...event,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Non-critical: Failed to log workspace audit", err);
  }
};

export const getWorkspaceById = async (workspaceId) => {
  const ref = doc(db, 'workspaces', workspaceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, _id: snap.id, ...snap.data() };
};
