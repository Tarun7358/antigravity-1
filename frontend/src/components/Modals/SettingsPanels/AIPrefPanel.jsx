import React, { useContext, useState } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import { db } from '../../../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Bot, Sparkles, Sliders, Loader2, Check } from 'lucide-react';

const AIPrefPanel = () => {
  const { user } = useContext(AuthContext);
  const [defaultModel, setDefaultModel] = useState(user?.settings?.defaultModel || 'gemini-1.5-pro');
  const [temperature, setTemperature] = useState(user?.settings?.temperature || 0.7);
  const [systemPrompt, setSystemPrompt] = useState(user?.settings?.systemPrompt || 'You are Gravity AI, an expert collaborative coding assistant in Anti Gravity.');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSaveAI = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setLoading(true);
    setSuccess(false);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'settings.defaultModel': defaultModel,
        'settings.temperature': Number(temperature),
        'settings.systemPrompt': systemPrompt,
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
    <form onSubmit={handleSaveAI} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">AI Preferences</h2>
        <p className="text-slate-400 text-sm">Configure Gravity AI model parameters, creative temperature, and custom system instructions.</p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 space-y-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" /> Default AI Model
            </label>
            <select 
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Advanced Reasoning)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast Execution)</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
              <option value="gpt-4o">GPT-4o</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2"><Sliders className="w-4 h-4 text-purple-400" /> Temperature ({temperature})</span>
              <span className="text-[10px] text-slate-500 font-normal">0.0 (Precise) - 1.0 (Creative)</span>
            </label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-3"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Custom System Prompt
          </label>
          <textarea 
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all min-h-[120px] resize-none font-mono text-sm"
            placeholder="Define how Gravity AI should behave..."
          />
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" /> AI preferences saved successfully.
        </div>
      )}

      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save AI Preferences'}
        </button>
      </div>
    </form>
  );
};

export default AIPrefPanel;
