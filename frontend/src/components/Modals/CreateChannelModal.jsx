import React, { useContext, useEffect, useState } from 'react';
import { X, Hash, Volume2, FileText, Mic, Loader2 } from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../../context/AuthContext';
import { logWorkspaceActivity, logWorkspaceAudit } from '../../utils/workspaceUtils';

const CreateChannelModal = ({ isOpen, onClose, channelType = 'text', activeWorkspace, onCreated }) => {
  const { user } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [type, setType] = useState(channelType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setType(channelType);
  }, [channelType]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeWorkspace) return setError('No workspace selected.');
    if (!name.trim()) return;

    setError('');
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'workspaces', activeWorkspace._id, 'channels'), {
        name: name.toLowerCase().replace(/\s+/g, '-'),
        type,
        createdAt: serverTimestamp(),
      });

      onCreated({ _id: docRef.id, name, type });
      setName('');

      await logWorkspaceActivity(activeWorkspace._id, {
        type: 'channel.created',
        message: `${user?.username || 'Someone'} created #${name}`,
        actor: { uid: user?.uid, username: user?.username || user?.displayName || 'User', avatar: user?.avatar || '' },
        meta: { channelType: type },
      });

      await logWorkspaceAudit(activeWorkspace._id, {
        action: 'CHANNEL_CREATE',
        actor: { uid: user?.uid, username: user?.username || user?.displayName || 'User' },
        target: { type: 'channel', id: docRef.id, name },
        meta: { channelType: type },
      });

      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to create channel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Create Channel</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Channel Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setType('text')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${type === 'text' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                <Hash className="w-6 h-6" /> <span className="font-bold text-sm">Text</span>
              </button>
              <button 
                type="button"
                onClick={() => setType('voice')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${type === 'voice' ? 'bg-rose-500/10 border-rose-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                <Volume2 className="w-6 h-6" /> <span className="font-bold text-sm">Voice</span>
              </button>
              <button 
                type="button"
                onClick={() => setType('forum')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${type === 'forum' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                <FileText className="w-6 h-6" /> <span className="font-bold text-sm">Forum</span>
              </button>
              <button 
                type="button"
                onClick={() => setType('stage')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${type === 'stage' ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                <Mic className="w-6 h-6" /> <span className="font-bold text-sm">Stage</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Channel Name</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                {type === 'text' ? <Hash className="w-4 h-4" /> : type === 'forum' ? <FileText className="w-4 h-4" /> : (type === 'stage' ? <Mic className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />)}
              </div>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                placeholder="new-channel"
                required
              />
            </div>
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
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;
