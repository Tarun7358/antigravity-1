import React, { useContext, useState } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import { db } from '../../../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Bell, Volume2, Mail, Monitor, Loader2, Check } from 'lucide-react';

const NotificationsPanel = () => {
  const { user } = useContext(AuthContext);
  const [desktopNotifs, setDesktopNotifs] = useState(user?.settings?.desktopNotifications ?? true);
  const [soundEnabled, setSoundEnabled] = useState(user?.settings?.soundEnabled ?? true);
  const [emailAlerts, setEmailAlerts] = useState(user?.settings?.emailAlerts ?? false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setLoading(true);
    setSuccess(false);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'settings.desktopNotifications': desktopNotifs,
        'settings.soundEnabled': soundEnabled,
        'settings.emailAlerts': emailAlerts,
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
    <form onSubmit={handleSaveNotifications} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Notifications</h2>
        <p className="text-slate-400 text-sm">Control when and how Anti Gravity alerts you about messages and workspace activity.</p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 space-y-8 shadow-xl">
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Monitor className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Desktop Notifications</h3>
              <p className="text-sm text-slate-400">Receive banner notifications on your desktop when mentioned or in DMs.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setDesktopNotifs(!desktopNotifs)}
            className={`w-12 h-6 rounded-full relative transition-all ${desktopNotifs ? 'bg-indigo-600' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${desktopNotifs ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Volume2 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Sound Effects</h3>
              <p className="text-sm text-slate-400">Play subtle audio cues for incoming messages, user joins, and calls.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-12 h-6 rounded-full relative transition-all ${soundEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${soundEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Mail className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Email Alerts</h3>
              <p className="text-sm text-slate-400">Receive email summaries of missed mentions and critical workspace updates.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setEmailAlerts(!emailAlerts)}
            className={`w-12 h-6 rounded-full relative transition-all ${emailAlerts ? 'bg-indigo-600' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${emailAlerts ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" /> Notification preferences saved successfully.
        </div>
      )}

      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Preferences'}
        </button>
      </div>
    </form>
  );
};

export default NotificationsPanel;
