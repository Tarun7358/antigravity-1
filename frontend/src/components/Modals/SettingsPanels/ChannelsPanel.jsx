import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { collection, query, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Hash, Volume2, Edit3, Trash2, Shield, Loader2, Check } from 'lucide-react';

const ChannelsPanel = ({ workspace }) => {
  const [channels, setChannels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [activeRoleId, setActiveRoleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingChannel, setEditingChannel] = useState(null); // { id, name }
  const [saveLoading, setSaveLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch Channels & Roles
  useEffect(() => {
    if (!workspace?._id) return;
    const qChannels = query(collection(db, 'workspaces', workspace._id, 'channels'));
    const qRoles = query(collection(db, 'workspaces', workspace._id, 'roles'));

    const unsubChannels = onSnapshot(qChannels, (snapshot) => {
      const chData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChannels(chData);
      if (chData.length > 0 && !activeChannelId) {
        setActiveChannelId(chData[0].id);
      }
      setLoading(false);
    });

    const unsubRoles = onSnapshot(qRoles, (snapshot) => {
      const rData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRoles(rData);
      if (rData.length > 0 && !activeRoleId) {
        setActiveRoleId(rData[0].id);
      }
    });

    return () => { unsubChannels(); unsubRoles(); };
  }, [workspace]);

  const activeChannel = channels.find(c => c.id === activeChannelId);
  const activeRole = roles.find(r => r.id === activeRoleId);

  const handleDeleteChannel = async (id) => {
    if (!workspace?._id || !id) return;
    try {
      await deleteDoc(doc(db, 'workspaces', workspace._id, 'channels', id));
      if (activeChannelId === id) {
        const remaining = channels.filter(c => c.id !== id);
        setActiveChannelId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveChannelName = async (e) => {
    e.preventDefault();
    if (!workspace?._id || !editingChannel) return;
    setSaveLoading(true);
    setSuccess(false);

    try {
      const chRef = doc(db, 'workspaces', workspace._id, 'channels', editingChannel.id);
      await updateDoc(chRef, {
        name: editingChannel.name.toLowerCase().replace(/\s+/g, '-')
      });
      setSuccess(true);
      setEditingChannel(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePermissionOverride = async (permKey, value) => {
    if (!workspace?._id || !activeChannel || !activeRole) return;
    try {
      const chRef = doc(db, 'workspaces', workspace._id, 'channels', activeChannel.id);
      const overrides = activeChannel.permissionOverrides || {};
      const roleOverrides = overrides[activeRole.id] || {};

      const updatedRoleOverrides = {
        ...roleOverrides,
        [permKey]: value
      };

      await updateDoc(chRef, {
        [`permissionOverrides.${activeRole.id}`]: updatedRoleOverrides
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getOverrideValue = (permKey) => {
    if (!activeChannel?.permissionOverrides || !activeRole) return 'inherit';
    return activeChannel.permissionOverrides[activeRole.id]?.[permKey] || 'inherit';
  };

  return (
    <div className="flex h-[700px] -m-12 overflow-hidden border-t border-slate-800">
      {/* Channels Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Channels</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
          ) : (
            channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => { setActiveChannelId(ch.id); setEditingChannel(null); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeChannelId === ch.id ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {ch.type === 'text' ? <Hash className="w-4 h-4 shrink-0 text-indigo-400" /> : <Volume2 className="w-4 h-4 shrink-0 text-rose-400" />}
                  <span className="truncate">{ch.name}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Channel Settings & Permission Overrides */}
      <div className="flex-1 overflow-y-auto p-10 bg-[#0f172a] custom-scrollbar">
        {activeChannel ? (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 shadow-md">
                    {activeChannel.type === 'text' ? <Hash className="w-6 h-6 text-indigo-400" /> : <Volume2 className="w-6 h-6 text-rose-400" />}
                  </div>
                  <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{activeChannel.name} Settings</h2>
                </div>
                <p className="text-sm text-slate-400">Configure channel name and granular role-based permission overrides.</p>
              </div>

              <div className="flex gap-2">
                {!editingChannel ? (
                  <button 
                    onClick={() => setEditingChannel({ id: activeChannel.id, name: activeChannel.name })}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800"
                    title="Edit Channel Name"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    onClick={() => setEditingChannel(null)}
                    className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                  >
                    Cancel Edit
                  </button>
                )}
                {channels.length > 1 && (
                  <button 
                    onClick={() => handleDeleteChannel(activeChannel.id)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-rose-500/20"
                    title="Delete Channel"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {editingChannel && (
              <form onSubmit={handleSaveChannelName} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Channel Name</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={editingChannel.name}
                    onChange={(e) => setEditingChannel({ ...editingChannel, name: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
                    required 
                  />
                  <button 
                    type="submit" 
                    disabled={saveLoading}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                  >
                    {saveLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Name'}
                  </button>
                </div>
              </form>
            )}

            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4" /> Channel updated successfully.
              </div>
            )}

            {/* Permission Overrides Section */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-400" /> Permission Overrides
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Select a role to override its default workspace permissions for this channel.</p>
                </div>

                <select 
                  value={activeRoleId || ''} 
                  onChange={(e) => setActiveRoleId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {activeRole && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-200">View Channel</div>
                      <div className="text-xs text-slate-500 mt-0.5">Allows members of this role to see and read this channel.</div>
                    </div>
                    <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1 gap-1">
                      {['inherit', 'allow', 'deny'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handlePermissionOverride('view_channel', val)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                            getOverrideValue('view_channel') === val 
                            ? (val === 'allow' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : val === 'deny' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-white') 
                            : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeChannel.type === 'text' ? (
                    <div className="flex items-center justify-between pb-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-200">Send Messages</div>
                        <div className="text-xs text-slate-500 mt-0.5">Allows members of this role to send text messages in this channel.</div>
                      </div>
                      <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1 gap-1">
                        {['inherit', 'allow', 'deny'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handlePermissionOverride('send_messages', val)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                              getOverrideValue('send_messages') === val 
                              ? (val === 'allow' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : val === 'deny' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-white') 
                              : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-200">Connect to Voice</div>
                          <div className="text-xs text-slate-500 mt-0.5">Allows members of this role to join this voice lounge.</div>
                        </div>
                        <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1 gap-1">
                          {['inherit', 'allow', 'deny'].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handlePermissionOverride('connect_voice', val)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                                getOverrideValue('connect_voice') === val 
                                ? (val === 'allow' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : val === 'deny' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-white') 
                                : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pb-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-200">Speak in Voice</div>
                          <div className="text-xs text-slate-500 mt-0.5">Allows members of this role to talk in this voice lounge.</div>
                        </div>
                        <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1 gap-1">
                          {['inherit', 'allow', 'deny'].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handlePermissionOverride('speak_voice', val)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                                getOverrideValue('speak_voice') === val 
                                ? (val === 'allow' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : val === 'deny' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-white') 
                                : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">Select a channel to configure permissions.</div>
        )}
      </div>
    </div>
  );
};

export default ChannelsPanel;
