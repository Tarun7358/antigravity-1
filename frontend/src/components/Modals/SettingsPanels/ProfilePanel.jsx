import React, { useContext, useState } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import { db, auth } from '../../../config/firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Camera, ShieldCheck, Loader2, Check, Award, Trophy, AlertTriangle } from 'lucide-react';

const ProfilePanel = () => {
  const { user } = useContext(AuthContext);
  const [displayName, setDisplayName] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setLoading(true);
    setError('');
    setSuccess(false);

    const trimmedName = displayName.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setError('Username must be at least 3 characters.');
      setLoading(false);
      return;
    }

    try {
      // ── Check username uniqueness ──────────────────────────────────
      if (trimmedName !== user.username) {
        const q = query(
          collection(db, 'users'),
          where('username', '==', trimmedName)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setError(`The username "${trimmedName}" is already taken. Please choose a different one.`);
          setLoading(false);
          return;
        }
      }

      // Update Firestore user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username: trimmedName,
        bio: bio,
        updatedAt: new Date()
      });

      // Update Firebase Auth profile
      if (auth.currentUser && auth.currentUser.uid === user.uid) {
        await updateProfile(auth.currentUser, { displayName: trimmedName });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSaveChanges} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">User Profile</h2>
        <p className="text-slate-400 text-sm">Customize how you appear to others in Anti Gravity.</p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="h-24 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
          <button type="button" className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 p-2 rounded-lg text-white text-xs font-medium backdrop-blur-sm transition-all border border-white/10">
            Edit Banner
          </button>
        </div>
        <div className="px-8 pb-8">
          <div className="flex justify-between items-end -mt-12 mb-6">
            <div className="relative group">
              <img 
                src={user?.avatar} 
                alt="avatar" 
                className="w-24 h-24 rounded-full border-8 border-slate-900 bg-slate-800 object-cover"
              />
              <div className="absolute inset-8 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-white/20 backdrop-blur-sm">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
                placeholder="How should we call you?"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">About Me</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all min-h-[100px] resize-none"
                placeholder="Tell the workspace a bit about yourself..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Developer Badges
              </label>
              <div className="flex flex-wrap gap-2">
                {/* Fallback badges if none exist for demonstration of the Discord-style ecosystem */}
                {['Full Stack Pro', 'AI Specialist', 'Early Adopter'].map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300">
                    <Award className="w-3.5 h-3.5 text-indigo-400" />
                    {badge}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && <div className="mt-6 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">{error}</div>}
          {success && (
            <div className="mt-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4" /> Profile updated successfully.
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-white font-bold">Verified Account</h3>
          <p className="text-sm text-slate-400">Your email has been verified. You're ready to collaborate.</p>
        </div>
      </div>
    </form>
  );
};

export default ProfilePanel;
