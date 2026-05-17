import React, { useContext, useMemo, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../../context/AuthContext';
import { logWorkspaceActivity, logWorkspaceAudit } from '../../utils/workspaceUtils';

const CreateWorkspaceModal = ({ isOpen, onClose, onCreated }) => {
  const { user } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workspaceType, setWorkspaceType] = useState('Development Teams');
  const [visibility, setVisibility] = useState('private'); // private | public
  const [category, setCategory] = useState('Web Development');
  const [tagsInput, setTagsInput] = useState('');
  const [rulesEnabled, setRulesEnabled] = useState(true);
  const [rulesText, setRulesText] = useState('Be respectful. No spam. Keep discussions on-topic.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tags = useMemo(() => {
    const parsed = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);
    return Array.from(new Set(parsed));
  }, [tagsInput]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!user?.uid) return setError('Please login to create a workspace.');
    
    setError('');
    setLoading(true);
    try {
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'workspaces'), {
        name,
        description,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ownerId: user.uid,
        ownerName: user.username || user.displayName || 'Owner',
        visibility,
        type: workspaceType,
        category,
        tags,
        memberIds: [user.uid],
        memberCount: 1,
        rules: {
          enabled: rulesEnabled,
          text: rulesEnabled ? rulesText : '',
        },
        onboarding: {
          enabled: true,
          checklist: ['Pick your role', 'Pick your skills', 'Read the rules', 'Say hello in #general'],
        },
        verificationLevel: 0,
        stats: {
          xp: 0,
          level: 1,
          boosts: 0,
          collaborationStreakDays: 0,
          lastActivityAt: serverTimestamp(),
        },
      });

      // Seed membership profile
      await setDoc(doc(db, 'workspaces', docRef.id, 'members', user.uid), {
        uid: user.uid,
        username: user.username || user.displayName || 'User',
        avatar: user.avatar || user.photoURL || '',
        nickname: '',
        roles: ['@everyone', 'Owner'],
        skills: [],
        status: 'online',
        joinedAt: serverTimestamp(),
        rulesAcceptedAt: rulesEnabled ? serverTimestamp() : null,
      });

      // Default channels: general + announcements + rules (optional) + voice lounge
      const channelsCol = collection(db, 'workspaces', docRef.id, 'channels');
      await addDoc(channelsCol, { name: 'general', type: 'text', createdAt: serverTimestamp() });
      await addDoc(channelsCol, { name: 'announcements', type: 'text', isAnnouncements: true, createdAt: serverTimestamp() });
      if (rulesEnabled) {
        await addDoc(channelsCol, { name: 'rules', type: 'text', isRules: true, createdAt: serverTimestamp() });
      }
      await addDoc(channelsCol, { name: 'voice-lounge', type: 'voice', createdAt: serverTimestamp() });

      await logWorkspaceActivity(docRef.id, {
        type: 'workspace.created',
        message: `${user.username || 'Someone'} created the workspace`,
        actor: { uid: user.uid, username: user.username || user.displayName || 'User', avatar: user.avatar || '' },
        meta: { visibility, workspaceType, category },
      });

      await logWorkspaceAudit(docRef.id, {
        action: 'WORKSPACE_CREATE',
        actor: { uid: user.uid, username: user.username || user.displayName || 'User' },
        target: { type: 'workspace', id: docRef.id, name },
        meta: { visibility, workspaceType, category, tags },
      });

      onCreated({ _id: docRef.id, name, description });
      setName('');
      setDescription('');
      setTagsInput('');
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to create server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Create a Server</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Server Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g., Development Team"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 min-h-[100px]"
              placeholder="What is this server for?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Type</label>
              <select
                value={workspaceType}
                onChange={(e) => setWorkspaceType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-indigo-500"
              >
                <option>Development Teams</option>
                <option>Startup Teams</option>
                <option>Open Source Communities</option>
                <option>Gaming Teams</option>
                <option>AI Communities</option>
                <option>Student Teams</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="private">Private</option>
                <option value="public">Public (Discoverable)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-indigo-500"
              >
                <option>Web Development</option>
                <option>MERN Stack</option>
                <option>AI/ML</option>
                <option>Game Development</option>
                <option>Open Source</option>
                <option>DevOps</option>
                <option>UI/UX</option>
                <option>Mobile Development</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Tags</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. react, node, devops"
              />
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Rules & Onboarding</div>
                <div className="text-[11px] text-slate-500">Enable rules acceptance when members join.</div>
              </div>
              <button
                type="button"
                onClick={() => setRulesEnabled((v) => !v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${rulesEnabled ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
              >
                {rulesEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <textarea
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              disabled={!rulesEnabled}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 min-h-[90px] disabled:opacity-60"
              placeholder="Workspace rules shown during onboarding…"
            />
          </div>
          
          {error && <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">{error}</p>}
          
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkspaceModal;
