import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { collectionGroup, query, where, getDocs, updateDoc, doc, arrayUnion, increment, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, AlertCircle, Sparkles, Code2 } from 'lucide-react';
import OnboardingModal from '../components/Modals/OnboardingModal';
import { logWorkspaceActivity, logWorkspaceAudit } from '../utils/workspaceUtils';

const InviteJoin = () => {
  const { code } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, onboarding, error, success
  const [workspace, setWorkspace] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [inviteRefPath, setInviteRefPath] = useState(null);

  useEffect(() => {
    const verifyAndJoin = async () => {
      if (!user) {
        // Redirect to login but save the invite path
        navigate(`/login?redirect=/invite/${code}`);
        return;
      }

      try {
        // Find invite via collectionGroup (no full scan)
        const invitesQ = query(collectionGroup(db, 'invites'), where('code', '==', code));
        const inviteSnap = await getDocs(invitesQ);
        if (inviteSnap.empty) return setStatus('error');

        const inviteDoc = inviteSnap.docs[0];
        const wsId = inviteDoc.ref.parent.parent?.id;
        if (!wsId) return setStatus('error');

        const wsDocRef = doc(db, 'workspaces', wsId);
        const wsDoc = await getDoc(wsDocRef);
        if (!wsDoc.exists()) return setStatus('error');

        setWorkspace(wsDoc.data());
        setWorkspaceId(wsId);
        setInviteRefPath(inviteDoc.ref.path);
        setStatus('onboarding');
      } catch (error) {
        console.error("Join error:", error);
        setStatus('error');
      }
    };

    verifyAndJoin();
  }, [code, user, navigate]);

  const completeJoin = async ({ nickname, skills }) => {
    if (!workspaceId || !user?.uid) return;

    const wsDocRef = doc(db, 'workspaces', workspaceId);
    await updateDoc(wsDocRef, {
      memberIds: arrayUnion(user.uid),
      memberCount: increment(1),
      updatedAt: serverTimestamp(),
      'stats.lastActivityAt': serverTimestamp(),
    });

    await setDoc(doc(db, 'workspaces', workspaceId, 'members', user.uid), {
      uid: user.uid,
      username: user.username || user.displayName || 'User',
      avatar: user.avatar || user.photoURL || '',
      nickname: nickname || '',
      roles: ['@everyone'],
      skills: skills || [],
      status: 'online',
      joinedAt: serverTimestamp(),
      rulesAcceptedAt: workspace?.rules?.enabled ? serverTimestamp() : null,
    }, { merge: true });

    await logWorkspaceActivity(workspaceId, {
      type: 'member.joined',
      message: `${user.username || 'Someone'} joined the workspace`,
      actor: { uid: user.uid, username: user.username || user.displayName || 'User', avatar: user.avatar || '' },
      meta: { invite: inviteRefPath || null },
    });

    await logWorkspaceAudit(workspaceId, {
      action: 'MEMBER_JOIN',
      actor: { uid: user.uid, username: user.username || user.displayName || 'User' },
      target: { type: 'member', id: user.uid },
      meta: { source: 'invite', invite: inviteRefPath || null },
    });

    setStatus('success');
    setTimeout(() => navigate('/app'), 1500);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
      <OnboardingModal
        isOpen={status === 'onboarding'}
        workspace={workspace}
        onCancel={() => setStatus('error')}
        onComplete={completeJoin}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[40px] p-10 text-center space-y-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-gradient" />
        
        {status === 'verifying' && (
          <>
            <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto border border-indigo-500/20">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Verifying Invite...</h1>
              <p className="text-slate-500 mt-2">Checking workspace access and security protocols.</p>
            </div>
          </>
        )}

        {status === 'onboarding' && (
          <>
            <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto border border-indigo-500/20">
              <Sparkles className="w-10 h-10 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Preparing onboarding…</h1>
              <p className="text-slate-500 mt-2">Review rules and set up your profile before joining.</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/20">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome to {workspace?.name}!</h1>
              <p className="text-slate-500 mt-2">You've successfully joined the workspace. Redirecting to your dashboard...</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              Access Granted
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertCircle className="w-10 h-10 text-rose-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Invalid or Expired Invite</h1>
              <p className="text-slate-500 mt-2">This invite link is no longer valid. Please ask the workspace owner for a new link.</p>
            </div>
            <button 
              onClick={() => navigate('/app')}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all"
            >
              Back to Dashboard
            </button>
          </>
        )}

        <div className="pt-4 border-t border-slate-800 flex items-center justify-center gap-2">
          <Code2 className="w-4 h-4 text-slate-600" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Anti Gravity Secure Join</span>
        </div>
      </motion.div>
    </div>
  );
};

export default InviteJoin;
