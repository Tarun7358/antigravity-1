import { Bot, Shield, Code, User, Hash, UserPlus } from 'lucide-react';
import { getRoleColor } from '../../utils/devPermissions';

const MemberSidebar = ({ members = [], onOpenInvite }) => {
  // Group members by role
  const groups = members.reduce((acc, member) => {
    // Primary role is the first one that isn't @everyone, or fallback to 'Member'
    const primaryRole = (member.roles || []).filter(r => r !== '@everyone')[0] || member.role || 'Member';
    if (!acc[primaryRole]) acc[primaryRole] = [];
    acc[primaryRole].push(member);
    return acc;
  }, {});

  const statusColors = {
    online: 'bg-emerald-500',
    idle: 'bg-amber-500',
    dnd: 'bg-rose-500',
    coding: 'bg-indigo-500 animate-pulse',
    offline: 'bg-slate-600'
  };

  return (
    <div className="w-60 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0 overflow-y-auto custom-scrollbar">
      <div className="p-4">
        {/* Invite Button */}
        <button 
          onClick={onOpenInvite}
          className="w-full py-2.5 mb-6 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
        >
          <UserPlus className="w-4 h-4" />
          Invite People
        </button>

        {Object.entries(groups).map(([role, roleMembers]) => (
          <div key={role} className="mb-6">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">
              {role} — {roleMembers.length}
            </h3>
            <div className="space-y-0.5">
              {roleMembers.map((member) => (
                <div 
                  key={member.uid}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-all group cursor-pointer"
                >
                  <div className="relative shrink-0">
                    <img 
                      src={member.avatar || `https://ui-avatars.com/api/?name=${member.username}`} 
                      className={`w-8 h-8 rounded-full ${member.status === 'offline' ? 'grayscale opacity-50' : ''}`}
                      alt={member.username} 
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${statusColors[member.status || 'offline']}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-sm font-semibold truncate group-hover:text-white transition-colors flex items-center gap-2"
                      style={{ color: member.status !== 'offline' ? getRoleColor(role) : '#64748b' }}
                    >
                      {member.nickname || member.username}
                    </div>
                    {(member.skills && member.skills.length > 0) && (
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate mt-0.5">
                        {member.skills.slice(0, 2).join(' • ')}
                      </div>
                    )}
                    {member.customStatus && (
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{member.customStatus}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Bot Section */}
        <div className="mb-6">
           <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Bots — 1</h3>
           <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-all group cursor-pointer">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 bg-emerald-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-purple-400 flex items-center gap-1.5">
                  Gravity AI
                  <span className="text-[8px] bg-indigo-500 text-white px-1 rounded font-bold uppercase">Bot</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">Listening to workspace...</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MemberSidebar;
