import React, { useContext, useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, updateDoc, where, arrayUnion, increment, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Users, Tag } from 'lucide-react';
import { db } from '../config/firebase';
import { AuthContext } from '../context/AuthContext';
import OnboardingModal from '../components/Modals/OnboardingModal';
import { logWorkspaceActivity, logWorkspaceAudit } from '../utils/workspaceUtils';

const CATEGORIES = [
  'All',
  'Web Development',
  'MERN Stack',
  'AI/ML',
  'Game Development',
  'Open Source',
  'DevOps',
  'UI/UX',
  'Mobile Development',
];

const Discover = ({ onWorkspaceSelected }) => {
  const { user } = useContext(AuthContext);
  const [workspaces, setWorkspaces] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'workspaces'), where('visibility', '==', 'public'));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, _id: d.id, ...d.data() }));
      // MVP trending heuristic: memberCount desc then lastActivityAt desc
      items.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
      setWorkspaces(items);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return workspaces.filter((ws) => {
      if (category !== 'All' && ws.category !== category) return false;
      if (!s) return true;
      const hay = `${ws.name || ''} ${ws.description || ''} ${(ws.tags || []).join(' ')}`.toLowerCase();
      return hay.includes(s);
    });
  }, [workspaces, search, category]);

  const beginJoin = async (wsId) => {
    const snap = await getDoc(doc(db, 'workspaces', wsId));
    if (!snap.exists()) return;
    setSelectedWorkspaceId(wsId);
    setSelectedWorkspace(snap.data());
  };

  const completeJoin = async ({ nickname, skills }) => {
    if (!user?.uid || !selectedWorkspaceId) return;

    const wsRef = doc(db, 'workspaces', selectedWorkspaceId);
    await updateDoc(wsRef, {
      memberIds: arrayUnion(user.uid),
      memberCount: increment(1),
      updatedAt: serverTimestamp(),
      'stats.lastActivityAt': serverTimestamp(),
    });

    await setDoc(doc(db, 'workspaces', selectedWorkspaceId, 'members', user.uid), {
      uid: user.uid,
      username: user.username || user.displayName || 'User',
      avatar: user.avatar || user.photoURL || '',
      nickname: nickname || '',
      roles: ['@everyone'],
      skills: skills || [],
      status: 'online',
      joinedAt: serverTimestamp(),
      rulesAcceptedAt: selectedWorkspace?.rules?.enabled ? serverTimestamp() : null,
    }, { merge: true });

    await logWorkspaceActivity(selectedWorkspaceId, {
      type: 'member.joined',
      message: `${user.username || 'Someone'} joined from discovery`,
      actor: { uid: user.uid, username: user.username || user.displayName || 'User', avatar: user.avatar || '' },
      meta: { source: 'discovery' },
    });
    await logWorkspaceAudit(selectedWorkspaceId, {
      action: 'MEMBER_JOIN',
      actor: { uid: user.uid, username: user.username || user.displayName || 'User' },
      target: { type: 'member', id: user.uid },
      meta: { source: 'discovery' },
    });

    setSelectedWorkspace(null);
    const wsSnapshot = await getDoc(wsRef);
    const ws = wsSnapshot.exists() ? { id: wsSnapshot.id, _id: wsSnapshot.id, ...wsSnapshot.data() } : null;
    if (ws) onWorkspaceSelected?.(ws);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <OnboardingModal
        isOpen={!!selectedWorkspaceId}
        workspace={selectedWorkspace}
        onCancel={() => { setSelectedWorkspace(null); setSelectedWorkspaceId(null); }}
        onComplete={completeJoin}
      />

      <div className="p-6 border-b border-slate-800 bg-slate-950/20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" /> Discover Workspaces
            </h2>
            <p className="text-sm text-slate-500 mt-1">Find public communities for dev, startups, open source, and more.</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, tags, or description…"
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500">
            No public workspaces found.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((ws) => (
              <motion.div
                key={ws.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-[28px] p-5 shadow-xl hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-extrabold text-indigo-200">
                        {(ws.name || 'WS').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-bold truncate">{ws.name}</div>
                        <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest truncate">
                          {ws.type || 'Community'} • {ws.category || 'Uncategorized'}
                        </div>
                      </div>
                    </div>

                    {ws.description && (
                      <div className="text-sm text-slate-400 mt-3 line-clamp-2">
                        {ws.description}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <div className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-950/60 border border-slate-800 px-2 py-1 rounded-xl">
                        <Users className="w-3.5 h-3.5 text-slate-500" /> {ws.memberCount || 0}
                      </div>
                      {(ws.tags || []).slice(0, 4).map((t) => (
                        <div key={t} className="inline-flex items-center gap-1 text-xs text-indigo-200 bg-indigo-600/10 border border-indigo-500/20 px-2 py-1 rounded-xl">
                          <Tag className="w-3.5 h-3.5" /> {t}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    disabled={!user?.uid}
                    onClick={() => beginJoin(ws.id)}
                    className="shrink-0 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold transition-colors"
                  >
                    Join
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
