import React, { useState } from 'react';
import { 
  GitBranch, GitCommit, GitPullRequest, 
  Plus, ArrowUpCircle, RefreshCw,
  Check, Info, Clock, AlertCircle
} from 'lucide-react';

const SourceControl = () => {
  const [isLinked, setIsLinked] = useState(true);
  const [commits] = useState([
    { id: '1', msg: 'feat: add collaborative editor', user: 'tarun', time: '2m ago', hash: 'e2a4f5' },
    { id: '2', msg: 'fix: terminal pty bridge issues', user: 'sarah', time: '1h ago', hash: 'a1b2c3' },
    { id: '3', msg: 'chore: update dependencies', user: 'bot', time: '3h ago', hash: 'd9e8f7' },
  ]);

  if (!isLinked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center border border-slate-700 shadow-xl">
          <GitBranch className="w-8 h-8 text-white" />
        </div>
        <div>
          <h4 className="text-white font-bold">Link GitHub Repository</h4>
          <p className="text-xs text-slate-500 mt-1">Connect your code to GitHub to enable sync, PRs, and team deployments.</p>
        </div>
        <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all">
          Connect GitHub
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 border-r border-slate-800">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Source Control</h3>
        <RefreshCw className="w-3.5 h-3.5 text-slate-500 hover:text-white cursor-pointer transition-all" />
      </div>

      {/* Changes Section */}
      <div className="p-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-400">STAGED CHANGES</span>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 rounded">2</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-800/50 rounded-lg group">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs text-slate-300 flex-1 truncate">frontend/App.jsx</span>
            <span className="text-[9px] text-emerald-500 font-bold">M</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-800/50 rounded-lg group">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs text-slate-300 flex-1 truncate">backend/server.js</span>
            <span className="text-[9px] text-amber-500 font-bold">A</span>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <textarea 
            placeholder="Commit message..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 min-h-[60px] resize-none"
          />
          <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all">
            <GitCommit className="w-3.5 h-3.5" />
            Commit & Push
          </button>
        </div>
      </div>

      {/* Commit History */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <span className="text-[11px] font-bold text-slate-400 block mb-3 uppercase tracking-wider">Recent Activity</span>
          <div className="space-y-4">
            {commits.map(commit => (
              <div key={commit.id} className="flex gap-3 group cursor-pointer">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                    <img src={`https://ui-avatars.com/api/?name=${commit.user}&background=random`} alt="u" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-indigo-600 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <GitCommit className="w-2 h-2 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{commit.msg}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{commit.hash}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500">@{commit.user}</span>
                    <span className="text-slate-700">•</span>
                    <span className="text-[10px] text-slate-500">{commit.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GitHub Actions / Status */}
      <div className="p-3 bg-slate-950/50 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
             <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-500" />
             <span className="text-[10px] font-bold text-slate-400">CI/CD STATUS</span>
          </div>
          <span className="text-[9px] text-emerald-500 font-bold">SUCCESS</span>
        </div>
        <div className="text-[9px] text-slate-500 leading-tight">
          Deployment to production was successful at 12:45 PM.
        </div>
      </div>
    </div>
  );
};

export default SourceControl;
