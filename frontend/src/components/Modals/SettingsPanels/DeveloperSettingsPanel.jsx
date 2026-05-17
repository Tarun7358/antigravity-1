import React, { useContext, useState } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import { db } from '../../../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Code, Key, Terminal, Loader2, Check } from 'lucide-react';

const DeveloperSettingsPanel = () => {
  const { user } = useContext(AuthContext);
  const [lineNumbers, setLineNumbers] = useState(user?.settings?.lineNumbers ?? true);
  const [autoSave, setAutoSave] = useState(user?.settings?.autoSave ?? true);
  const [tabSize, setTabSize] = useState(user?.settings?.tabSize || 2);
  const [apiToken, setApiToken] = useState(user?.settings?.apiToken || 'ag_live_99x8172bc9a102');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSaveDeveloper = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setLoading(true);
    setSuccess(false);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'settings.lineNumbers': lineNumbers,
        'settings.autoSave': autoSave,
        'settings.tabSize': Number(tabSize),
        'settings.apiToken': apiToken,
        updatedAt: new Date()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSaveDeveloper} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Developer Hub</h2>
        <p className="text-slate-400 text-sm">Configure your collaborative code editor preferences and manage personal access tokens.</p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 space-y-8 shadow-xl">
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Code className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Show Line Numbers</h3>
              <p className="text-sm text-slate-400">Display line numbers in the live preview and code editor panels.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setLineNumbers(!lineNumbers)}
            className={`w-12 h-6 rounded-full relative transition-all ${lineNumbers ? 'bg-indigo-600' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${lineNumbers ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Terminal className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Auto-Save Code Changes</h3>
              <p className="text-sm text-slate-400">Automatically sync code modifications to the workspace without manual commits.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setAutoSave(!autoSave)}
            className={`w-12 h-6 rounded-full relative transition-all ${autoSave ? 'bg-indigo-600' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoSave ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Editor Tab Size</label>
            <select 
              value={tabSize}
              onChange={(e) => setTabSize(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="2">2 Spaces (Default)</option>
              <option value="4">4 Spaces</option>
              <option value="8">8 Spaces</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Personal Access Token</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-indigo-400 font-mono text-sm focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" /> Developer settings saved successfully.
        </div>
      )}

      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Developer Hub Settings'}
        </button>
      </div>
    </form>
  );
};

export default DeveloperSettingsPanel;
