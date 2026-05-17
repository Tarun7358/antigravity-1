import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { collection, query, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { Users, Shield, UserX, Loader2, Check } from 'lucide-react';

const MembersPanel = ({ workspace }) => {
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace?._id) return;
    // Fetch all users as workspace members
    const qUsers = query(collection(db, 'users'));
    const qRoles = query(collection(db, 'workspaces', workspace._id, 'roles'));

    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const uData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(uData);
      setLoading(false);
    });

    const unsubRoles = onSnapshot(qRoles, (snapshot) => {
      const rData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRoles(rData);
    });

    return () => { unsubUsers(); unsubRoles(); };
  }, [workspace]);

  const handleAssignRole = async (userId, roleId) => {
    if (!workspace?._id || !userId) return;
    try {
      const userRef = doc(db, 'users', userId);
      const assignedRole = roles.find(r => r.id === roleId);
      await updateDoc(userRef, {
        role: assignedRole ? assignedRole.name : 'Member',
        [`workspaceRoles.${workspace._id}`]: roleId
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleKickMember = async (userId) => {
    if (!workspace?._id || !userId) return;
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        [`workspaceRoles.${workspace._id}`]: null
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Workspace Members</h2>
        <p className="text-slate-400 text-sm">Manage member permissions, assign custom roles, or revoke server access.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Members ({members.length})</h3>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
        ) : (
          <div className="divide-y divide-slate-800">
            {members.map((member) => {
              const currentRoleId = member.workspaceRoles?.[workspace._id] || '';
              return (
                <div key={member.id} className="p-6 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.username}`} alt="avatar" className="w-10 h-10 rounded-full border-2 border-slate-800 bg-slate-800 object-cover shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate flex items-center gap-2">
                        {member.username}
                        {member.role === 'Owner' && <Shield className="w-3.5 h-3.5 text-amber-500" />}
                      </h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">UID: {member.uid || member.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <select 
                      value={currentRoleId}
                      onChange={(e) => handleAssignRole(member.id, e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="">Default Member</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>

                    <button 
                      onClick={() => handleKickMember(member.id)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-rose-500/20"
                      title="Kick Member"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersPanel;
