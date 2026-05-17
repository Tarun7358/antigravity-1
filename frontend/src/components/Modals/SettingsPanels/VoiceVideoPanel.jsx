import React, { useContext, useState } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import { db } from '../../../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Mic, Volume2, Settings, Loader2, Check } from 'lucide-react';

const VoiceVideoPanel = () => {
  const { user } = useContext(AuthContext);
  const [inputDevice, setInputDevice] = useState(user?.settings?.inputDevice || 'default');
  const [outputDevice, setOutputDevice] = useState(user?.settings?.outputDevice || 'default');
  const [noiseSuppression, setNoiseSuppression] = useState(user?.settings?.noiseSuppression ?? true);
  const [echoCancellation, setEchoCancellation] = useState(user?.settings?.echoCancellation ?? true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSaveVoiceVideo = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setLoading(true);
    setSuccess(false);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'settings.inputDevice': inputDevice,
        'settings.outputDevice': outputDevice,
        'settings.noiseSuppression': noiseSuppression,
        'settings.echoCancellation': echoCancellation,
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
    <form onSubmit={handleSaveVoiceVideo} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Voice & Video</h2>
        <p className="text-slate-400 text-sm">Configure your audio devices and advanced real-time voice processing settings.</p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 space-y-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-400" /> Input Device
            </label>
            <select 
              value={inputDevice}
              onChange={(e) => setInputDevice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="default">Default Microphone</option>
              <option value="built-in">Built-in Microphone</option>
              <option value="external">External USB Mic</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-purple-400" /> Output Device
            </label>
            <select 
              value={outputDevice}
              onChange={(e) => setOutputDevice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="default">Default Headphones / Speakers</option>
              <option value="built-in">Built-in Speakers</option>
              <option value="external">External Audio Device</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div>
            <h3 className="text-white font-bold">Noise Suppression (Crisp Audio)</h3>
            <p className="text-sm text-slate-400">Automatically filter out background noise, keyboard typing, and fan hums.</p>
          </div>
          <button 
            type="button"
            onClick={() => setNoiseSuppression(!noiseSuppression)}
            className={`w-12 h-6 rounded-full relative transition-all ${noiseSuppression ? 'bg-indigo-600' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${noiseSuppression ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold">Echo Cancellation</h3>
            <p className="text-sm text-slate-400">Prevent audio feedback loops when using speakers during a call.</p>
          </div>
          <button 
            type="button"
            onClick={() => setEchoCancellation(!echoCancellation)}
            className={`w-12 h-6 rounded-full relative transition-all ${echoCancellation ? 'bg-indigo-600' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${echoCancellation ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" /> Voice & Video settings saved successfully.
        </div>
      )}

      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Audio Settings'}
        </button>
      </div>
    </form>
  );
};

export default VoiceVideoPanel;
