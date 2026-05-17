import React, { useState, useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import { auth, db } from '../../../config/firebase';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Shield, Key, Smartphone, Clock, Trash2, Lock, Loader2, Check } from 'lucide-react';

const SecurityPanel = () => {
  const { user } = useContext(AuthContext);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  const [activeSessions, setActiveSessions] = useState([
    { id: 1, device: 'Windows PC • Chrome', location: 'United States', status: 'Current Session', time: 'Active Now' },
    { id: 2, device: 'iPhone 15 Pro • App', location: 'United Kingdom', status: 'Last seen 2 hours ago', time: 'Today' },
  ]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setSuccess(true);
        setNewPassword('');
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('No active user session found.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to change password. You may need to log in again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    if (!user?.uid) return;
    setTwoFactorLoading(true);
    try {
      const nextState = !twoFactorEnabled;
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        twoFactorEnabled: nextState
      });
      setTwoFactorEnabled(nextState);
    } catch (err) {
      console.error(err);
      setError('Failed to update 2FA settings.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleTerminateSession = (id) => {
    setActiveSessions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Security</h2>
        <p className="text-slate-400 text-sm">Protect your account with advanced security features and active session management.</p>
      </div>

      {/* Password Change */}
      <form onSubmit={handlePasswordChange} className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Change Password</label>
        <div className="flex gap-4">
          <input 
            type="password" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password (min 6 characters)"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
          </button>
        </div>
        {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">{error}</div>}
        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4" /> Password updated successfully.
          </div>
        )}
      </form>

      {/* Two-Factor Auth */}
      <section className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${twoFactorEnabled ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-purple-500/10 border-purple-500/20'}`}>
              <Smartphone className={`w-6 h-6 ${twoFactorEnabled ? 'text-emerald-400' : 'text-purple-400'}`} />
            </div>
            <div>
              <h3 className="text-white font-bold">Two-Factor Authentication</h3>
              <p className="text-sm text-slate-400">Add an extra layer of security to your account.</p>
            </div>
          </div>
          <button 
            onClick={handleToggle2FA}
            disabled={twoFactorLoading}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${twoFactorEnabled ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'}`}
          >
            {twoFactorLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Toggling...</> : (twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA')}
          </button>
        </div>
        <div className="pl-16 space-y-2 border-l-2 border-slate-800 ml-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Key className="w-3 h-3" />
            <span>Use an authenticator app like Google Authenticator or Authy.</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock className="w-3 h-3" />
            <span>Protect your workspace from unauthorized access.</span>
          </div>
        </div>
      </section>

      {/* Active Sessions */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Sessions</label>
          <button 
            onClick={() => setActiveSessions(prev => prev.filter(s => s.status === 'Current Session'))}
            className="text-[10px] font-bold text-rose-500 hover:underline uppercase tracking-widest"
          >
            Logout from all other devices
          </button>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {activeSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between px-6 py-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-all">
              <div className="flex items-center gap-4">
                <Clock className="w-5 h-5 text-slate-500" />
                <div>
                  <div className="text-sm font-semibold text-slate-200">{session.device}</div>
                  <div className="text-xs text-slate-500">{session.location} • <span className={session.status === 'Current Session' ? 'text-emerald-400 font-medium' : ''}>{session.status}</span></div>
                </div>
              </div>
              {session.status !== 'Current Session' && (
                <button onClick={() => handleTerminateSession(session.id)} className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Login History Notification */}
      <section className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
          <Shield className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h3 className="text-white font-bold">Suspicious Activity Alerts</h3>
          <p className="text-sm text-slate-400">We'll notify you if we detect a login from a new device or location.</p>
        </div>
      </section>
    </div>
  );
};

export default SecurityPanel;
