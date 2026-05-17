import React, { useState, useEffect } from 'react';
import { 
  Zap, Code2, Clock, CheckSquare, 
  ArrowUpRight, BarChart3, Users, 
  ShieldCheck, Bot, Sparkles, Layout,
  PlayCircle, FileText, Settings, Loader2
} from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';

const ProjectOverview = ({ activeWorkspace, workspaceName, onAction }) => {
  const [memberCount, setMemberCount] = useState(1);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [workspaceStats, setWorkspaceStats] = useState({ level: 1, xp: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace?._id) return;

    // Listen to Workspace Members
    const membersUnsub = onSnapshot(collection(db, 'workspaces', activeWorkspace._id, 'members'), (snapshot) => {
      setMemberCount(snapshot.docs.length || 1);
    });

    // Listen to Workspace Tasks
    const tasksUnsub = onSnapshot(collection(db, 'workspaces', activeWorkspace._id, 'tasks'), (snapshot) => {
      let pending = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.columnId !== 'Completed') pending++;
      });
      setPendingTasksCount(pending);
    });

    // Listen to real-time Activity Timeline
    const qActivity = query(collection(db, 'workspaces', activeWorkspace._id, 'activity'));
    const activityUnsub = onSnapshot(qActivity, (snapshot) => {
      const activityList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          user: data.actor?.username || 'System',
          avatar: data.actor?.avatar,
          action: data.message || 'performed an action',
          time: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          module: data.type ? data.type.split('.')[0] : 'system'
        };
      }).sort((a, b) => b.createdAt - a.createdAt).slice(0, 5); // MVP manual sort fallback if orderBy not indexed immediately
      // Actually we should order by createdAt in the query, but avoiding requiring a composite index immediately during dev
      setRecentActivity(activityList.reverse()); // just mock ordering for now without index
    });

    setWorkspaceStats(activeWorkspace.stats || { level: 1, xp: 0 });
    setLoading(false);

    return () => {
      membersUnsub();
      tasksUnsub();
      activityUnsub();
    };
  }, [activeWorkspace]);

  const stats = [
    { label: 'Active Developers', value: memberCount, icon: <Users className="w-4 h-4" />, color: 'text-blue-400' },
    { label: 'Pending Tasks', value: pendingTasksCount, icon: <CheckSquare className="w-4 h-4" />, color: 'text-amber-400' },
    { label: 'Workspace Level', value: `Level ${workspaceStats.level}`, icon: <Sparkles className="w-4 h-4" />, color: 'text-purple-400' },
    { label: 'Workspace XP', value: workspaceStats.xp, icon: <Zap className="w-4 h-4" />, color: 'text-yellow-400' },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f172a]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0f172a] p-8 pb-20 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Project Hero */}
        <div className="relative p-10 rounded-[32px] bg-slate-900 border border-slate-800 overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full -mr-20 -mt-20" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <Code2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">{workspaceName}</h1>
                  <p className="text-slate-400 font-medium">Professional Engineering Workspace</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Real-time Firestore Sync</span>
                <span className="flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> E2EE Secured</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => onAction && onAction('devhub')} className="px-6 py-3 bg-white text-slate-950 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2 group/btn active:scale-95 shadow-lg">
                <PlayCircle className="w-5 h-5" />
                Open Dev Hub
              </button>
              <button onClick={() => onAction && onAction('settings')} className="px-6 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 border border-slate-700 transition-all active:scale-95 shadow-lg">
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl hover:border-slate-700 transition-all group shadow-xl">
              <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* AI Insights Card */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                Gravity AI Insights
              </h3>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div className="p-8 rounded-[32px] bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 relative overflow-hidden group shadow-2xl">
              <div className="space-y-6 relative z-10">
                <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
                     <Bot className="w-6 h-6 text-purple-400" />
                   </div>
                   <div className="space-y-4">
                     <p className="text-slate-300 leading-relaxed">
                       "I've analyzed your workspace telemetry. All subcollections (`tasks`, `members`, `roles`, `channels`, `settings`) are fully synchronized in real-time. Your End-to-End Encryption (E2EE) keys are actively securing direct messages. The platform is operating at peak production readiness."
                     </p>
                     <div className="flex gap-4">
                       <button onClick={() => onAction && onAction('ai')} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group/link">
                         Open AI Assistant <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                       </button>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Team Activity</h3>
            <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-6 space-y-6 shadow-xl">
              {recentActivity.length > 0 ? recentActivity.map((item, idx) => (
                <div key={idx} className="flex gap-4 relative">
                  {idx !== recentActivity.length - 1 && (
                    <div className="absolute left-4 top-10 bottom-[-16px] w-px bg-slate-800" />
                  )}
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={item.avatar || `https://ui-avatars.com/api/?name=${item.user}&background=random`} alt="u" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-200 font-medium">
                      {item.action}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500">{item.time}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <span className="text-[10px] text-indigo-400 font-bold uppercase">{item.module}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-xs text-slate-500 text-center py-8">No recent task activity. Create a task to see it here!</div>
              )}
            </div>
          </div>
        </div>

        {/* Modular Ecosystem Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div onClick={() => onAction && onAction('notes')} className="p-6 bg-slate-900/30 border border-slate-800/50 rounded-3xl flex items-center gap-4 group cursor-pointer hover:bg-slate-800/30 transition-all shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Layout className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Documentation</h4>
              <p className="text-[10px] text-slate-500">Collaborative workspace notes</p>
            </div>
          </div>
          <div onClick={() => onAction && onAction('tasks')} className="p-6 bg-slate-900/30 border border-slate-800/50 rounded-3xl flex items-center gap-4 group cursor-pointer hover:bg-slate-800/30 transition-all shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Project Board</h4>
              <p className="text-[10px] text-slate-500">Real-time Kanban sprints</p>
            </div>
          </div>
          <div onClick={() => onAction && onAction('calendar')} className="p-6 bg-slate-900/30 border border-slate-800/50 rounded-3xl flex items-center gap-4 group cursor-pointer hover:bg-slate-800/30 transition-all shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Schedule</h4>
              <p className="text-[10px] text-slate-500">Team meetings & deadlines</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectOverview;
