import React, { useState, useEffect, useRef } from 'react';
import { Rocket, Loader2, CheckCircle2, XCircle, Clock, Play, Terminal } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const statusConfig = {
  active:   { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-300', Icon: CheckCircle2 },
  building: { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     badge: 'bg-amber-500/20 text-amber-300',   Icon: Loader2 },
  failed:   { color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',       badge: 'bg-rose-500/20 text-rose-300',     Icon: XCircle },
};

const DeploymentsPanel = ({ activeWorkspace }) => {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLogs, setActiveLogs] = useState({}); // { deploymentId: [log, ...] }
  const [showLogs, setShowLogs] = useState(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (!activeWorkspace?._id) return;
    fetch(`${BACKEND}/api/deployments/${activeWorkspace._id}`)
      .then(r => r.json())
      .then(data => setDeployments(data.deployments || []))
      .catch(err => console.error('Failed to fetch deployments:', err))
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  // Auto scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeLogs]);

  const streamLogs = (deploymentId) => {
    setShowLogs(deploymentId);
    setActiveLogs(prev => ({ ...prev, [deploymentId]: [] }));

    const evtSource = new EventSource(`${BACKEND}/api/deployments/${activeWorkspace._id}/logs/${deploymentId}`);

    evtSource.onmessage = (e) => {
      try {
        const log = JSON.parse(e.data);
        setActiveLogs(prev => ({
          ...prev,
          [deploymentId]: [...(prev[deploymentId] || []), log],
        }));

        if (log.type === 'done') {
          evtSource.close();
          const finalStatus = log.code === 0 ? 'active' : 'failed';
          setDeployments(prev => prev.map(d => d.id === deploymentId ? { ...d, status: finalStatus } : d));
        }
      } catch { /* noop */ }
    };

    evtSource.onerror = () => evtSource.close();
  };

  const handleNewDeployment = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/deployments/${activeWorkspace._id}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: activeWorkspace?.name || 'workspace-app', env: 'staging' }),
      });
      const data = await res.json();
      if (data.deployment) {
        setDeployments(prev => [data.deployment, ...prev]);
        // Auto-stream logs for the new deployment
        setTimeout(() => streamLogs(data.deployment.id), 300);
      }
    } catch (err) {
      console.error('Failed to start deployment:', err);
    }
  };

  return (
    <div className="w-full h-full bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">CI/CD & Deployments</h3>
        </div>
        <button
          onClick={handleNewDeployment}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-colors"
        >
          <Play className="w-3 h-3" />
          Deploy
        </button>
      </div>

      {/* Deployment List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
        ) : deployments.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-6 flex flex-col items-center gap-3">
            <Rocket className="w-10 h-10 opacity-20" />
            <p>No deployments yet.<br/>Click Deploy to trigger your first build.</p>
          </div>
        ) : (
          deployments.map(dep => {
            const cfg = statusConfig[dep.status] || statusConfig.building;
            const { Icon } = cfg;
            return (
              <div key={dep.id} className={`p-3 border rounded-xl ${cfg.bg}`}>
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${cfg.color} ${dep.status === 'building' ? 'animate-spin' : ''}`} />
                    <span className="text-xs font-bold text-white truncate">{dep.service || 'workspace-app'}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold shrink-0 ${cfg.badge}`}>
                    {dep.status}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 shrink-0" />
                    {dep.env} • {dep.commit || 'manual trigger'}
                  </p>
                  <button
                    onClick={() => setShowLogs(prev => prev === dep.id ? null : dep.id)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0"
                  >
                    <Terminal className="w-2.5 h-2.5" />
                    Logs
                  </button>
                </div>

                {/* Inline Live Logs */}
                {showLogs === dep.id && (
                  <div className="mt-3 bg-slate-950 rounded-lg border border-slate-800 p-3 max-h-48 overflow-y-auto font-mono text-[10px] space-y-0.5 custom-scrollbar">
                    {(activeLogs[dep.id] || []).length === 0 ? (
                      <p className="text-slate-500">Waiting for logs... <button onClick={() => streamLogs(dep.id)} className="text-indigo-400 hover:underline">Connect</button></p>
                    ) : (
                      (activeLogs[dep.id] || []).map((log, i) => (
                        <div key={i} className={log.type === 'stderr' ? 'text-rose-400' : log.type === 'done' ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                          {log.text}
                        </div>
                      ))
                    )}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DeploymentsPanel;
