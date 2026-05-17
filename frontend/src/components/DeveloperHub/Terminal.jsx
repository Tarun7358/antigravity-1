import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io } from 'socket.io-client';
import 'xterm/css/xterm.css';
import { Terminal as TerminalIcon, X, Maximize2, Trash2, Container } from 'lucide-react';

const RUNTIME_OPTIONS = [
  { label: 'Node.js', value: 'node' },
  { label: 'Python', value: 'python' },
  { label: 'React', value: 'react' },
  { label: 'Next.js', value: 'nextjs' },
];

const Terminal = ({ onClose, activeWorkspace }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const socketRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [status, setStatus] = useState('connecting'); // connecting | ready | error
  const [isDockerized, setIsDockerized] = useState(false);
  const [runtime, setRuntime] = useState('node');

  useEffect(() => {
    if (!terminalRef.current) return;

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const socket = io(backendUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      theme: {
        background: '#0f172a',
        foreground: '#cbd5e1',
        cursor: '#6366f1',
        selection: '#6366f144',
        black: '#1e293b',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#f8fafc',
      },
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // When connected, request a container session
    socket.on('connect', () => {
      term.writeln('\x1b[36m\x1b[1m🚀 Anti Gravity Dev Container\x1b[0m');
      term.writeln('\x1b[90mRequesting isolated runtime environment...\x1b[0m');
      term.writeln('');
      socket.emit('terminal-start', {
        workspaceId: activeWorkspace?._id || 'default',
        runtime,
      });
    });

    // Container is ready
    socket.on('terminal-ready', ({ dockerized, runtime: rt }) => {
      setIsDockerized(dockerized);
      setStatus('ready');
      if (dockerized) {
        term.writeln(`\x1b[32m✔ Docker container spawned (${rt} runtime)\x1b[0m`);
        term.writeln('\x1b[90mYou are inside an isolated sandbox. Type commands below:\x1b[0m');
      } else {
        term.writeln('\x1b[33m⚠ Docker unavailable — using local shell fallback\x1b[0m');
      }
      term.writeln('');
    });

    socket.on('terminal-error', ({ message }) => {
      setStatus('error');
      term.writeln(`\x1b[31m✘ Error: ${message}\x1b[0m`);
    });

    socket.on('terminal-exit', ({ code }) => {
      term.writeln(`\x1b[90m[Container exited with code ${code}]\x1b[0m`);
      setStatus('connecting');
    });

    // Stream data from PTY/Docker → terminal
    socket.on('terminal-data', (data) => {
      term.write(data);
    });

    // Send keyboard input → Docker container
    term.onData((data) => {
      socket.emit('terminal-input', data);
    });

    const handleResize = () => {
      fitAddon.fit();
      socket.emit('terminal-resize', {
        cols: term.cols,
        rows: term.rows,
      });
    };

    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);

    return () => {
      socket.disconnect();
      term.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, [activeWorkspace, runtime]);

  const statusConfig = {
    connecting: { color: 'text-amber-400', dot: 'bg-amber-400', label: 'CONNECTING' },
    ready:      { color: 'text-emerald-400', dot: 'bg-emerald-500 animate-pulse', label: isDockerized ? 'DOCKER CONTAINER' : 'LOCAL SHELL' },
    error:      { color: 'text-rose-400', dot: 'bg-rose-500', label: 'ERROR' },
  };
  const cfg = statusConfig[status];

  return (
    <div className="h-72 bg-slate-950 border-t border-slate-800 flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="h-9 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Dev Terminal</span>

          {/* Runtime Selector */}
          <select
            value={runtime}
            onChange={(e) => setRuntime(e.target.value)}
            className="ml-3 bg-slate-800 border border-slate-700 text-[10px] text-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-500"
          >
            {RUNTIME_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Status Badge */}
          <div className="flex items-center gap-1.5 ml-3">
            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            <span className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
          </div>

          {/* Docker badge */}
          {isDockerized && status === 'ready' && (
            <div className="flex items-center gap-1 ml-2 px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] font-bold text-blue-400 uppercase">
              <Container className="w-2.5 h-2.5" />
              Isolated
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-all" title="Maximize">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => xtermRef.current?.clear()} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-all" title="Clear">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400 transition-all" title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* xterm.js Terminal Canvas */}
      <div ref={terminalRef} className="flex-1 p-2" />
    </div>
  );
};

export default Terminal;
