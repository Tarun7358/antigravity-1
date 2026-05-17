import React, { useEffect, useState } from 'react';
import { db } from '../../../config/firebase';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { ShieldCheck, History, Activity, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const AuditLogsPanel = ({ workspace }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace?._id) return;

    const q = query(
      collection(db, 'workspaces', workspace._id, 'audit'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(logsData);
      setLoading(false);
    }, (err) => {
      console.error("Audit Logs Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [workspace]);

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (action.includes('UPDATE')) return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
    return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Audit Logs</h2>
        <p className="text-slate-400 text-sm">Review administrative actions and security events in your workspace.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-white">Action History</span>
          </div>
          <div className="flex gap-2">
             <span className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-medium text-slate-400 border border-slate-700">Filter: All Events</span>
          </div>
        </div>

        <div className="divide-y divide-slate-800/50">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-500">
              <ShieldCheck className="w-12 h-12 mb-4 opacity-20" />
              <p>No audit logs available yet.</p>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-slate-800/30 transition-colors">
                <div className={`p-2 rounded-lg border ${getActionColor(log.action)} mt-1`}>
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm text-slate-300">
                      <span className="font-bold text-white">{log.actor?.username || 'System'}</span> performed{' '}
                      <span className="font-medium text-indigo-300">{log.action}</span>
                    </p>
                    <span className="text-xs text-slate-500 shrink-0 ml-4">
                      {log.createdAt?.toDate ? formatDistanceToNow(log.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Target: {log.target?.type} ({log.target?.name || log.target?.id})
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPanel;
