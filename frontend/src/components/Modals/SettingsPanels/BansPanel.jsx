import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { ShieldAlert, UserCheck, Loader2 } from 'lucide-react';

const BansPanel = ({ workspace }) => {
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace?._id) return;
    const q = query(collection(db, 'workspaces', workspace._id, 'bans'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBans(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [workspace]);

  const handleUnban = async (id) => {
    if (!workspace?._id || !id) return;
    try {
      await deleteDoc(doc(db, 'workspaces', workspace._id, 'bans', id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Banned Users</h2>
        <p className="text-slate-400 text-sm">Users listed here are permanently blocked from re-joining this workspace.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Bans ({bans.length})</h3>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
        ) : bans.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No banned users in this workspace.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {bans.map((ban) => (
              <div key={ban.id} className="p-6 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-all">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shrink-0">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{ban.username || 'Unknown User'}</h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">Reason: {ban.reason || 'Violation of workspace guidelines'} • Banned: {ban.createdAt?.toDate ? ban.createdAt.toDate().toLocaleDateString() : 'Recently'}</p>
                  </div>
                </div>

                <button 
                  onClick={() => handleUnban(ban.id)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all flex items-center gap-2 text-xs font-semibold border border-slate-700"
                  title="Revoke Ban"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" /> Unban
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BansPanel;
