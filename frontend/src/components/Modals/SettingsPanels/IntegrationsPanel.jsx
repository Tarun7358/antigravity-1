import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Globe, Plus, Trash2, Copy, Check, Loader2 } from 'lucide-react';

const IntegrationsPanel = ({ workspace }) => {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!workspace?._id) return;
    const q = query(collection(db, 'workspaces', workspace._id, 'integrations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWebhooks(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [workspace]);

  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    if (!workspace?._id || !name.trim()) return;
    setCreateLoading(true);

    try {
      const url = `https://api.antigravity.dev/v1/webhooks/${Math.random().toString(36).substring(2, 15)}`;
      await addDoc(collection(db, 'workspaces', workspace._id, 'integrations'), {
        name,
        url,
        createdAt: serverTimestamp()
      });
      setName('');
    } catch (err) {
      console.error(err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteWebhook = async (id) => {
    if (!workspace?._id || !id) return;
    try {
      await deleteDoc(doc(db, 'workspaces', workspace._id, 'integrations', id));
    } catch (err) {
      console.error(err);
    }
  };

  const copyUrl = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Integrations & Webhooks</h2>
        <p className="text-slate-400 text-sm">Connect external tools, GitHub repositories, and automated CI/CD pipelines to Anti Gravity.</p>
      </div>

      <form onSubmit={handleCreateWebhook} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Create New Webhook</label>
        <div className="flex gap-4">
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. GitHub Commit Notifier" 
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
            required
          />
          <button 
            type="submit" 
            disabled={createLoading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            {createLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Webhook</>}
          </button>
        </div>
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Active Webhooks ({webhooks.length})</h3>
        </div>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
        ) : webhooks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No webhooks configured for this workspace yet.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {webhooks.map((hook) => (
              <div key={hook.id} className="p-6 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-all">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                    <Globe className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{hook.name}</h4>
                    <p className="text-xs text-slate-500 truncate font-mono mt-0.5">{hook.url}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => copyUrl(hook.id, hook.url)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
                  >
                    {copiedId === hook.id ? <><Check className="w-4 h-4 text-emerald-400" /> Copied</> : <><Copy className="w-4 h-4" /> Copy URL</>}
                  </button>
                  <button 
                    onClick={() => handleDeleteWebhook(hook.id)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-rose-500/20"
                    title="Delete Webhook"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationsPanel;
