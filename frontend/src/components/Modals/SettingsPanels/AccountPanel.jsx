import React, { useContext, useState } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import { db } from '../../../config/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { User, Mail, Calendar, Shield, Trash2, AlertTriangle, Loader2, Check } from 'lucide-react';

const AccountPanel = () => {
  const { user, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        updatedAt: new Date()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update account details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.uid) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await logout();
    } catch (err) {
      console.error(err);
      setError('Failed to delete account.');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">My Account</h2>
        <p className="text-slate-400 text-sm">Manage your account identity, email address, and membership status.</p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl">
        <div className="flex items-center gap-6 pb-6 border-b border-slate-800">
          <img src={user?.avatar} alt="avatar" className="w-20 h-20 rounded-full border-4 border-slate-800 bg-slate-800 object-cover shadow-lg" />
          <div>
            <h3 className="text-xl font-bold text-white">{user?.username}</h3>
            <p className="text-xs text-slate-400 mt-0.5">UID: {user?.uid}</p>
            <div className="mt-2 flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg w-fit">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-400">{user?.role || 'Member'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateAccount} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  disabled
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-400 cursor-not-allowed opacity-70"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Email is managed via Firebase Authentication.</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Member Since</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={user?.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'Recently'} 
                  disabled
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-400 cursor-not-allowed opacity-70"
                />
              </div>
            </div>
          </div>

          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">{error}</div>}
          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4" /> Account verification status confirmed.
            </div>
          )}

          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify Account Status'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-rose-400 font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h3>
            <p className="text-sm text-slate-400 mt-1">Permanently delete your account and remove all associated data from Anti Gravity.</p>
          </div>
          {!showDeleteConfirm ? (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-rose-400 rounded-xl font-semibold transition-all shadow-lg"
            >
              Delete Account
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20"
              >
                {deleteLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4" /> Confirm Delete</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountPanel;
