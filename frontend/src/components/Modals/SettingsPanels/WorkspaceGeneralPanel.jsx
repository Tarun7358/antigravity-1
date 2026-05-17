import React, { useState } from 'react';
import { db } from '../../../config/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Settings, Globe, Shield, Trash2, Camera, Loader2, Check } from 'lucide-react';

const WorkspaceGeneralPanel = ({ workspace, setActiveWorkspace, onClose }) => {
  const [name, setName] = useState(workspace?.name || '');
  const [description, setDescription] = useState(workspace?.description || '');
  const [visibility, setVisibility] = useState(workspace?.visibility || 'private');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSaveWorkspace = async (e) => {
    e.preventDefault();
    if (!workspace?._id) return;
    setLoading(true);
    setSuccess(false);

    try {
      const wsRef = doc(db, 'workspaces', workspace._id);
      await updateDoc(wsRef, {
        name,
        description,
        visibility,
        updatedAt: new Date()
      });
      // Update local state if needed
      if (setActiveWorkspace) {
        setActiveWorkspace(prev => ({ ...prev, name, description, visibility }));
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspace?._id) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'workspaces', workspace._id));
      if (setActiveWorkspace) setActiveWorkspace(null);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      setDeleteLoading(false);
    }
  };

  return (
    <form onSubmit={handleSaveWorkspace} className="space-y-10">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Workspace Overview</h2>
        <p className="text-slate-400 text-sm">Manage your server's public identity and basic configuration.</p>
      </div>

      <div className="flex gap-8 items-start bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-4">
          <div className="relative group">
            <div className="w-32 h-32 bg-slate-800 rounded-[40px] flex items-center justify-center text-4xl font-bold text-white border border-slate-700 shadow-2xl group-hover:bg-slate-700 transition-all">
              {name.slice(0, 2).toUpperCase()}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-[40px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-white/20 backdrop-blur-sm">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase text-center">Min: 128x128</p>
        </div>

        <div className="flex-1 space-y-6">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Workspace Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-95 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-95 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all min-h-[100px] resize-none"
            />
          </div>

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4" /> Workspace overview updated successfully.
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-800">
        <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 shadow-xl">
          <Globe className="w-6 h-6 text-indigo-400" />
          <h3 className="text-white font-bold">Public Visibility</h3>
          <p className="text-sm text-slate-400">Allow users to find this workspace via global search.</p>
          <div className="pt-4 flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => setVisibility('public')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${visibility === 'public' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Public
            </button>
            <button 
              type="button" 
              onClick={() => setVisibility('private')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${visibility === 'private' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Private
            </button>
          </div>
        </div>

        <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 shadow-xl">
          <Shield className="w-6 h-6 text-emerald-400" />
          <h3 className="text-white font-bold">Safe Workspace</h3>
          <p className="text-sm text-slate-400">Automatically filter explicit content and spam messages.</p>
          <div className="pt-2">
            <button type="button" className="text-emerald-400 text-sm font-semibold hover:underline">Manage Security</button>
          </div>
        </div>
      </div>

      <div className="p-6 border border-rose-500/20 bg-rose-500/5 rounded-2xl space-y-4 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-rose-400 font-bold flex items-center gap-2">
               Dangerous Area
            </h3>
            <p className="text-sm text-slate-400 mt-1">Permanently delete this workspace. This action cannot be undone.</p>
          </div>

          {!showDeleteConfirm ? (
            <button 
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 border border-rose-500/50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl font-semibold transition-all shadow-lg"
            >
              Delete Workspace
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setShowDeleteConfirm(false)} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleDeleteWorkspace}
                disabled={deleteLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20"
              >
                {deleteLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4" /> Confirm Delete</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default WorkspaceGeneralPanel;
