import React, { useState, useEffect, useContext } from 'react';
import { 
  Hash, Volume2, Plus, Layout, FileText, 
  Compass, Settings, Loader2, LogOut, 
  User, ChevronDown, ChevronRight, 
  Code2, MessageSquare, Bot, Calendar, GitBranch, Mic, MicOff
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, query, onSnapshot, where, getDocs } from 'firebase/firestore';

// ── Real DM User List ────────────────────────────────────────────────────────
const DMUserList = ({ currentUserId, onSelectUser }) => {
  const [dmUsers, setDmUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) return;
    // Listen to all users except self
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snap) => {
      const others = snap.docs
        .map(d => ({ uid: d.id, ...d.data() }))
        .filter(u => u.uid !== currentUserId);
      setDmUsers(others);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUserId]);

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-slate-600 mx-auto my-2" />;
  if (dmUsers.length === 0) return <p className="text-[11px] text-slate-600 px-2 py-2">No other members yet. Invite teammates!</p>;

  return (
    <div className="space-y-0.5">
      {dmUsers.map(u => (
        <div
          key={u.uid}
          onClick={() => onSelectUser(u)}
          className="flex items-center gap-3 px-2 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 cursor-pointer group transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-slate-800 relative shrink-0">
            <img
              src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username || 'User')}&background=random`}
              alt={u.username}
              className="w-full h-full rounded-full object-cover"
            />
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-slate-900 rounded-full ${
              u.status === 'online' ? 'bg-emerald-500' : 'bg-slate-600'
            }`} />
          </div>
          <span className="text-sm font-medium truncate">{u.username || 'Unknown User'}</span>
        </div>
      ))}
    </div>
  );
};

const VoiceChannelItem = ({ item, activeChannel, setActiveChannel, setActiveView, activeWorkspace }) => {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (!activeWorkspace?._id || !item?.id) return;
    const q = query(collection(db, 'workspaces', activeWorkspace._id, 'channels', item.id, 'participants'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setParticipants(parts);
    });
    return () => unsubscribe();
  }, [activeWorkspace, item]);

  const isActive = activeChannel?.id === item.id;

  return (
    <div className="space-y-1">
      <button
        onClick={() => {
          setActiveChannel(item);
          setActiveView('voice');
        }}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
          isActive
            ? 'bg-slate-800 text-white shadow-md'
            : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
        }`}
      >
        <Volume2 className="w-4 h-4 shrink-0 text-rose-400" />
        <span className="text-sm font-medium truncate">{item.name}</span>
      </button>

      {/* Real-time Voice Participants List */}
      {participants.length > 0 && (
        <div className="pl-6 pr-2 space-y-1 py-1 border-l-2 border-slate-800 ml-3">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-slate-800/40 transition-colors group">
              <div className="relative">
                <img src={p.avatar || `https://ui-avatars.com/api/?name=${p.name}`} alt={p.name} className="w-5 h-5 rounded-full border border-slate-700 bg-slate-800 object-cover" />
                {p.speaking && <div className="absolute -inset-0.5 rounded-full border border-indigo-500 animate-ping opacity-75" />}
              </div>
              <span className="text-xs text-slate-400 group-hover:text-slate-200 truncate flex-1">{p.name}</span>
              {p.speaking ? <Mic className="w-3 h-3 text-indigo-400 shrink-0" /> : <MicOff className="w-3 h-3 text-slate-600 shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({
  activeView,
  setActiveView,
  setActiveChannel,
  activeChannel,
  onOpenWorkspaceModal,
  onOpenChannelModal,
  onOpenUserSettings,
  onOpenWorkspaceSettings,
  activeWorkspace,
  setActiveWorkspace,
  channels,
}) => {
  const { user, logout } = useContext(AuthContext);
  const [workspaces, setWorkspaces] = useState([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [isDMView, setIsDMView] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(['TEXT CHANNELS', 'DEVELOPER TOOLS', 'VOICE CHANNELS']);

  const userRole = user?.role || 'Member';

  const categories = [
    {
      name: 'TEXT CHANNELS',
      type: 'text',
      items: channels.filter(c => c.type === 'text' || c.type === 'forum')
    },
    {
      name: 'DEVELOPER TOOLS',
      type: 'dev',
      items: [
        { id: 'dev-hub', name: 'Project Overview', icon: <Layout className="w-4 h-4" />, view: 'dashboard' },
        { id: 'dev-code', name: 'Developer Hub', icon: <Code2 className="w-4 h-4" />, view: 'devhub' },
        { id: 'dev-snippets', name: 'Snippets Library', icon: <FileText className="w-4 h-4" />, view: 'snippets' },
        { id: 'dev-ai', name: 'Gravity AI', icon: <Bot className="w-4 h-4" />, view: 'ai' },
        { id: 'dev-tasks', name: 'Task Board', icon: <Calendar className="w-4 h-4" />, view: 'tasks' }
      ]
    },
    {
      name: 'VOICE CHANNELS',
      type: 'voice',
      items: channels.filter(c => c.type === 'voice' || c.type === 'stage')
    }
  ];

  const toggleCategory = (name) => {
    setExpandedCategories(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  useEffect(() => {
    if (!user) return;
    const q = user?.uid
      ? query(collection(db, 'workspaces'), where('memberIds', 'array-contains', user.uid))
      : query(collection(db, 'workspaces'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wsData = snapshot.docs.map(doc => ({ id: doc.id, _id: doc.id, ...doc.data() }));
      setWorkspaces(wsData);
      setLoadingWorkspaces(false);
      if (wsData.length > 0 && !activeWorkspace && !isDMView && activeView !== 'discover') setActiveWorkspace(wsData[0]);
    });
    return () => unsubscribe();
  }, [user]);

  const handleDMClick = () => {
    setIsDMView(true);
    setActiveWorkspace(null);
    setActiveView('dm');
  };

  const handleDiscoverClick = () => {
    setIsDMView(false);
    setActiveWorkspace(null);
    setActiveView('discover');
  };

  const handleWorkspaceClick = (ws) => {
    setIsDMView(false);
    setActiveWorkspace(ws);
    setActiveView('dashboard');
  };

  return (
      <div className="flex h-full shrink-0 overflow-hidden">
        {/* 1. Server Rail */}
        <div className="w-[72px] bg-slate-950 flex flex-col items-center py-3 gap-2 overflow-y-auto no-scrollbar border-r border-slate-900">
        <div className="flex flex-col items-center gap-2 mb-2">
          <div 
            onClick={handleDiscoverClick}
            title="Discover"
            className={`w-12 h-12 flex items-center justify-center cursor-pointer transition-all group shadow-lg ${
              activeView === 'discover' ? 'bg-indigo-600 rounded-xl text-white' : 'bg-slate-800 rounded-2xl text-indigo-400 hover:rounded-xl hover:bg-indigo-600 hover:text-white'
            }`}
          >
            <Compass className="w-7 h-7 group-hover:rotate-12 transition-transform" />
          </div>
          <div 
            onClick={handleDMClick}
            title="Direct Messages"
            className={`w-12 h-12 flex items-center justify-center cursor-pointer transition-all group shadow-lg ${
              isDMView ? 'bg-indigo-600 rounded-xl text-white' : 'bg-slate-800 rounded-2xl text-indigo-400 hover:rounded-xl hover:bg-indigo-600 hover:text-white'
            }`}
          >
            <MessageSquare className="w-7 h-7 group-hover:scale-105 transition-transform" />
          </div>
        </div>
         
         <div className="w-8 h-[2px] bg-slate-800 rounded-full mb-2" />

        {loadingWorkspaces ? (
          <Loader2 className="w-5 h-5 text-slate-700 animate-spin" />
        ) : (
          workspaces.map(ws => (
            <div key={ws.id} className="relative group flex items-center">
               <div className={`absolute left-0 w-1 bg-white rounded-r-full transition-all ${activeWorkspace?.id === ws.id ? 'h-10' : 'h-2 scale-0 group-hover:scale-100 group-hover:h-5'}`} />
               <div
                onClick={() => handleWorkspaceClick(ws)}
                title={ws.name}
                className={`w-12 h-12 flex items-center justify-center text-white font-bold cursor-pointer shadow-lg transition-all mx-3 ${
                  activeWorkspace?.id === ws.id
                    ? 'bg-indigo-600 rounded-xl'
                    : 'bg-slate-800 rounded-[24px] hover:rounded-xl hover:bg-indigo-600'
                }`}
              >
                {ws.name.slice(0, 2).toUpperCase()}
              </div>
            </div>
          ))
        )}
        
        <div
          onClick={onOpenWorkspaceModal}
          className="w-12 h-12 rounded-[24px] bg-slate-800 flex items-center justify-center text-emerald-500 cursor-pointer hover:bg-emerald-500 hover:text-white hover:rounded-xl transition-all group shadow-lg"
        >
          <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </div>

        <div className="mt-auto mb-2 flex flex-col items-center gap-2">
           <div className="w-8 h-[2px] bg-slate-800 rounded-full mb-1" />
           <button className="w-12 h-12 rounded-[24px] bg-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-700 hover:rounded-xl transition-all group shadow-lg">
             <GitBranch className="w-6 h-6 group-hover:scale-110 transition-transform" />
           </button>
        </div>
      </div>

      {/* 2. Channel Sidebar */}
      <div className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
        <div
          className="h-12 flex items-center justify-between px-4 border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors group shadow-sm"
          onClick={isDMView ? null : onOpenWorkspaceSettings}
        >
          <h1 className="text-white font-bold text-sm truncate uppercase tracking-tight">
            {isDMView ? 'Direct Messages' : (activeWorkspace?.name || 'Workspace')}
          </h1>
          {!isDMView && <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />}
        </div>

        <div className="flex-1 overflow-y-auto pt-4 px-2 space-y-4 custom-scrollbar">
          {isDMView ? (
            <div className="space-y-4">
               <div className="px-2">
                 <div className="w-full h-8 bg-slate-950 border border-slate-800 rounded flex items-center px-2 text-xs text-slate-500 hover:border-indigo-500 cursor-text transition-all">
                   Find or start a conversation
                 </div>
               </div>
               <div className="space-y-0.5">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Direct Messages</h3>
                  <DMUserList
                    currentUserId={user?.uid}
                    onSelectUser={(dmUser) => {
                      window.dispatchEvent(new CustomEvent('ag:open-dm', { detail: dmUser }));
                    }}
                  />
               </div>
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat.name}>
                <div 
                  onClick={() => toggleCategory(cat.name)}
                  className="flex items-center justify-between px-1 mb-1 group cursor-pointer"
                >
                  <div className="flex items-center gap-1">
                    {expandedCategories.includes(cat.name) ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">
                      {cat.name}
                    </span>
                  </div>
                  {cat.type !== 'dev' && (
                    <Plus 
                      className="w-3.5 h-3.5 text-slate-500 hover:text-white transition-colors" 
                      onClick={(e) => { e.stopPropagation(); onOpenChannelModal(cat.type); }} 
                    />
                  )}
                </div>
                
                {expandedCategories.includes(cat.name) && (
                  <div className="space-y-0.5">
                    {cat.items.map(item => {
                      if (cat.type === 'voice') {
                        return (
                          <VoiceChannelItem 
                            key={item.id} 
                            item={item} 
                            activeChannel={activeChannel} 
                            setActiveChannel={setActiveChannel} 
                            setActiveView={setActiveView} 
                            activeWorkspace={activeWorkspace} 
                          />
                        );
                      }
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.view) {
                              setActiveView(item.view);
                            } else {
                              setActiveChannel(item);
                              setActiveView(item.type === 'voice' ? 'voice' : item.type === 'forum' ? 'forum' : 'chat');
                            }
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
                            (activeChannel?.id === item.id)
                              ? 'bg-slate-800 text-white shadow-md'
                              : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
                          }`}
                        >
                          {item.type === 'text' ? (
                            <Hash className="w-4 h-4 shrink-0 text-indigo-400" />
                          ) : item.type === 'forum' ? (
                            <FileText className="w-4 h-4 shrink-0 text-indigo-400" />
                          ) : (
                            item.icon || <Hash className="w-4 h-4 shrink-0 text-indigo-400" />
                          )}
                          <span className="text-sm font-medium truncate">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* User Status Footer */}
        <div className="bg-slate-950/50 p-2 border-t border-slate-800">
          <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer group" onClick={onOpenUserSettings}>
            <div className="relative">
              <img src={user?.avatar} className="w-8 h-8 rounded-full border-2 border-slate-900" alt="me" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-slate-100 truncate">{user?.username}</div>
              <div className="text-[10px] text-slate-500 truncate"># {user?.uid?.slice(-4)}</div>
            </div>
            <Settings className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
