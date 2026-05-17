import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Shield, Plus, Edit3, Trash2, Check, Loader2 } from 'lucide-react';

const RolesPanel = ({ workspace }) => {
  const [roles, setRoles] = useState([]);
  const [activeRoleId, setActiveRoleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null); // { id, name, color }
  const [saveLoading, setSaveLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const defaultPermissions = [
    { category: 'General Permissions', items: [
      { id: 'manage_workspace', name: 'Manage Workspace', desc: 'Allows members to change the workspace name and settings.', enabled: false },
      { id: 'view_audit_log', name: 'View Audit Log', desc: 'Allows members to view the audit log.', enabled: false },
      { id: 'manage_webhooks', name: 'Manage Webhooks', desc: 'Allows members to create, edit, and delete webhooks.', enabled: false },
    ]},
    { category: 'Membership Permissions', items: [
      { id: 'create_invite', name: 'Create Invite', desc: 'Allows members to create invitations.', enabled: true },
      { id: 'change_nickname', name: 'Change Nickname', desc: 'Allows members to change their own nickname.', enabled: true },
      { id: 'manage_nicknames', name: 'Manage Nicknames', desc: 'Allows members to change other members\' nicknames.', enabled: false },
      { id: 'kick_members', name: 'Kick Members', desc: 'Allows members to kick other members.', enabled: false },
    ]}
  ];

  // Fetch Roles from Firestore
  useEffect(() => {
    if (!workspace?._id) return;
    const q = query(collection(db, 'workspaces', workspace._id, 'roles'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rolesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRoles(rolesData);
      setLoading(false);
      if (rolesData.length > 0 && !activeRoleId) {
        setActiveRoleId(rolesData[0].id);
      }
    });

    return () => unsubscribe();
  }, [workspace]);

  // Seed default roles if none exist
  useEffect(() => {
    const seedDefaultRoles = async () => {
      if (!loading && roles.length === 0 && workspace?._id) {
        try {
          const rolesRef = collection(db, 'workspaces', workspace._id, 'roles');
          const ownerRef = await addDoc(rolesRef, {
            name: 'Owner', color: '#f59e0b', members: 1, permissions: ['manage_workspace', 'view_audit_log', 'manage_webhooks', 'create_invite', 'change_nickname', 'manage_nicknames', 'kick_members'], createdAt: serverTimestamp()
          });
          await addDoc(rolesRef, {
            name: 'Admin', color: '#ef4444', members: 2, permissions: ['manage_workspace', 'view_audit_log', 'create_invite', 'change_nickname', 'manage_nicknames', 'kick_members'], createdAt: serverTimestamp()
          });
          await addDoc(rolesRef, {
            name: 'Developer', color: '#6366f1', members: 5, permissions: ['create_invite', 'change_nickname'], createdAt: serverTimestamp()
          });
          await addDoc(rolesRef, {
            name: 'Member', color: '#94a3b8', members: 12, permissions: ['create_invite', 'change_nickname'], createdAt: serverTimestamp()
          });
          setActiveRoleId(ownerRef.id);
        } catch (err) {
          console.error("Failed seeding default roles", err);
        }
      }
    };
    seedDefaultRoles();
  }, [loading, roles, workspace]);

  const activeRole = roles.find(r => r.id === activeRoleId);

  const handleCreateRole = async () => {
    if (!workspace?._id) return;
    try {
      const newRoleRef = await addDoc(collection(db, 'workspaces', workspace._id, 'roles'), {
        name: 'New Role',
        color: '#10b981',
        members: 0,
        permissions: ['create_invite', 'change_nickname'],
        createdAt: serverTimestamp()
      });
      setActiveRoleId(newRoleRef.id);
      setEditingRole({ id: newRoleRef.id, name: 'New Role', color: '#10b981' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRole = async (id) => {
    if (!workspace?._id || !id) return;
    const roleToDelete = roles.find(r => r.id === id);
    if (roleToDelete?.name === 'Owner') return; // Protect Owner role
    try {
      await deleteDoc(doc(db, 'workspaces', workspace._id, 'roles', id));
      if (activeRoleId === id) {
        const remaining = roles.filter(r => r.id !== id);
        setActiveRoleId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePermission = async (permId) => {
    if (!workspace?._id || !activeRole) return;
    try {
      const roleRef = doc(db, 'workspaces', workspace._id, 'roles', activeRole.id);
      const currentPerms = activeRole.permissions || [];
      const hasPerm = currentPerms.includes(permId);
      const updatedPerms = hasPerm ? currentPerms.filter(p => p !== permId) : [...currentPerms, permId];

      await updateDoc(roleRef, {
        permissions: updatedPerms
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRoleDetails = async (e) => {
    e.preventDefault();
    if (!workspace?._id || !editingRole) return;
    setSaveLoading(true);
    setSuccess(false);

    try {
      const roleRef = doc(db, 'workspaces', workspace._id, 'roles', editingRole.id);
      await updateDoc(roleRef, {
        name: editingRole.name,
        color: editingRole.color
      });
      setSuccess(true);
      setEditingRole(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="flex h-[700px] -m-12 overflow-hidden border-t border-slate-800">
      {/* Role Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Roles</h3>
          <button onClick={handleCreateRole} className="text-indigo-400 hover:bg-indigo-400/10 p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
          ) : (
            roles.map((role) => (
              <button
                key={role.id}
                onClick={() => { setActiveRoleId(role.id); setEditingRole(null); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeRoleId === role.id ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: role.color }} />
                  <span className="truncate">{role.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-bold ml-2 shrink-0">{role.members || 0}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Role Settings */}
      <div className="flex-1 overflow-y-auto p-10 bg-[#0f172a] custom-scrollbar">
        {activeRole ? (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 shadow-md">
                    <Shield className="w-6 h-6" style={{ color: activeRole.color }} />
                  </div>
                  <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{activeRole.name} Settings</h2>
                </div>
                <p className="text-sm text-slate-400">Members with this role will have the following permissions.</p>
              </div>

              <div className="flex gap-2">
                {!editingRole ? (
                  <button 
                    onClick={() => setEditingRole({ id: activeRole.id, name: activeRole.name, color: activeRole.color })}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800"
                    title="Edit Role Name & Color"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    onClick={() => setEditingRole(null)}
                    className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                  >
                    Cancel Edit
                  </button>
                )}
                {activeRole.name !== 'Owner' && (
                  <button 
                    onClick={() => handleDeleteRole(activeRole.id)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-rose-500/20"
                    title="Delete Role"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {editingRole && (
              <form onSubmit={handleSaveRoleDetails} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Edit Role Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Role Name</label>
                    <input 
                      type="text" 
                      value={editingRole.name}
                      onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Role Color</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color" 
                        value={editingRole.color}
                        onChange={(e) => setEditingRole({ ...editingRole, color: e.target.value })}
                        className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer p-1"
                      />
                      <input 
                        type="text" 
                        value={editingRole.color}
                        onChange={(e) => setEditingRole({ ...editingRole, color: e.target.value })}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm uppercase"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    disabled={saveLoading}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                  >
                    {saveLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Role Identity'}
                  </button>
                </div>
              </form>
            )}

            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4" /> Role updated successfully.
              </div>
            )}

            <div className="space-y-10 pt-4">
              {defaultPermissions.map((group) => (
                <section key={group.category} className="space-y-4">
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">{group.category}</h3>
                  <div className="space-y-6">
                    {group.items.map((perm) => {
                      const isEnabled = (activeRole.permissions || []).includes(perm.id);
                      return (
                        <div key={perm.id} className="flex items-center justify-between group">
                          <div className="max-w-[80%]">
                            <div className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{perm.name}</div>
                            <div className="text-xs text-slate-500 leading-relaxed mt-0.5">{perm.desc}</div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleTogglePermission(perm.id)}
                            className={`w-12 h-6 rounded-full relative transition-all ${isEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isEnabled ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">Select a role to configure permissions.</div>
        )}
      </div>
    </div>
  );
};

export default RolesPanel;
