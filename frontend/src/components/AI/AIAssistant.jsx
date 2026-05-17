import React, { useState, useRef, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, FileText, CheckSquare, Zap, Loader2, Code2, Heart, ChevronDown, Copy, Check, Cpu, Brain, Activity } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const PROVIDERS = [
  { id: 'auto',   label: 'Auto',   icon: '⚡', description: 'Best available' },
  { id: 'gemini', label: 'Gemini', icon: '✦',  description: 'Google AI' },
  { id: 'openai', label: 'GPT-4',  icon: '○',  description: 'OpenAI' },
  { id: 'claude', label: 'Claude', icon: '◆',  description: 'Anthropic' },
];

const MODES = [
  { id: 'chat',     label: 'Chat',         icon: <Bot className="w-3.5 h-3.5" />,      endpoint: '/api/ai/query' },
  { id: 'code',     label: 'Pair Program', icon: <Code2 className="w-3.5 h-3.5" />,    endpoint: '/api/ai/pair-program' },
  { id: 'health',   label: 'Workspace',    icon: <Activity className="w-3.5 h-3.5" />, endpoint: '/api/ai/workspace-health' },
];

// Render message content with code block support
const MessageContent = ({ content }) => {
  const [copied, setCopied] = useState(false);
  const parts = content.split(/(```[\s\S]*?```)/g);
  
  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="text-sm leading-relaxed space-y-3">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
          const lang = match?.[1] || 'code';
          const code = match?.[2]?.trim() || part;
          return (
            <div key={i} className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang}</span>
                <button onClick={() => copyCode(code)} className="text-slate-500 hover:text-white transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="p-3 text-[11px] text-slate-300 overflow-x-auto font-mono leading-relaxed">{code}</pre>
            </div>
          );
        }
        // Render bold (**text**) and inline code (`code`)
        return (
          <p key={i} className="text-slate-200 whitespace-pre-wrap">
            {part.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((chunk, j) => {
              if (chunk.startsWith('**') && chunk.endsWith('**')) {
                return <strong key={j} className="text-white font-semibold">{chunk.slice(2, -2)}</strong>;
              }
              if (chunk.startsWith('`') && chunk.endsWith('`')) {
                return <code key={j} className="bg-slate-800 text-purple-300 px-1.5 py-0.5 rounded text-[11px] font-mono">{chunk.slice(1, -1)}</code>;
              }
              return chunk;
            })}
          </p>
        );
      })}
    </div>
  );
};

const AIAssistant = ({ activeWorkspace }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hello! I'm **Gravity AI**, your intelligent developer assistant.\n\nI can help with coding, code review, project analysis, and workspace health. Select a mode below and ask anything.",
      timestamp: new Date(),
      provider: 'system',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('auto');
  const [activeMode, setActiveMode] = useState('chat');
  const [availableProviders, setAvailableProviders] = useState([]);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Fetch available providers from backend
  useEffect(() => {
    axios.get(`${BACKEND}/api/ai/providers`).then(({ data }) => {
      setAvailableProviders(data.available || []);
    }).catch(() => {});
  }, []);

  const buildPayload = (prompt) => {
    const base = {
      prompt,
      provider: selectedProvider,
      context: {
        workspaceId: activeWorkspace?._id,
        workspaceName: activeWorkspace?.name,
        username: user?.username,
        module: activeMode,
      },
    };
    if (activeMode === 'code') {
      return { ...base, task: prompt, code: '', language: 'javascript' };
    }
    return base;
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { id: Date.now(), role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const prompt = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const mode = MODES.find(m => m.id === activeMode);
      const payload = buildPayload(prompt);
      const { data } = await axios.post(`${BACKEND}${mode.endpoint}`, payload);

      const responseText = data.response || data.analysis || 'No response received.';
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        provider: data.provider || selectedProvider,
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: "I'm having trouble connecting. Please ensure the backend is running (`npm run dev` in the backend directory).",
        timestamp: new Date(),
        provider: 'error',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    { icon: <FileText className="w-4 h-4" />, text: "Analyze my workspace", action: "Give me a comprehensive analysis of this workspace's productivity and health." },
    { icon: <Code2 className="w-4 h-4" />, text: "Write a REST API", action: "Write a complete Express.js REST API with CRUD operations for a Task model." },
    { icon: <CheckSquare className="w-4 h-4" />, text: "Generate sprint tasks", action: "Generate 5 sprint tasks for building a real-time chat feature in a React app." },
    { icon: <Zap className="w-4 h-4" />, text: "Review my architecture", action: "What are the best practices for a Discord-inspired collaborative coding platform architecture?" },
  ];

  const activeProviderInfo = availableProviders.find(p => p.id === selectedProvider) || null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-[#0f172a] overflow-hidden">
      
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 relative">
            <Bot className="w-5 h-5 text-purple-400" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <h2 className="text-white font-bold flex items-center gap-2">
              Gravity AI <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-400">Multi-provider intelligent assistant</p>
          </div>
        </div>

        {/* Provider Selector */}
        <div className="relative">
          <button
            onClick={() => setShowProviderDropdown(p => !p)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-slate-300 transition-all"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-bold">{PROVIDERS.find(p => p.id === selectedProvider)?.label || 'Auto'}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          <AnimatePresence>
            {showProviderDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 top-10 z-50 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="p-2 space-y-0.5">
                  {PROVIDERS.map(p => {
                    const backendInfo = availableProviders.find(bp => bp.id === p.id);
                    const isActive = p.id === 'auto' || backendInfo?.active;
                    return (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedProvider(p.id); setShowProviderDropdown(false); }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-colors text-xs ${
                          selectedProvider === p.id ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{p.icon}</span>
                          <div className="text-left">
                            <div className="font-bold">{p.label}</div>
                            <div className="text-[10px] text-slate-500">{p.description}</div>
                          </div>
                        </div>
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      </button>
                    );
                  })}
                </div>

                {availableProviders.length > 0 && (
                  <div className="px-3 pb-2 pt-1 border-t border-slate-800 text-[10px] text-slate-500">
                    {availableProviders.filter(p => p.active).length} providers active
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800 bg-slate-900/30 shrink-0">
        {MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMode === mode.id
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            {mode.icon}
            {mode.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar" onClick={() => setShowProviderDropdown(false)}>
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-indigo-600' : 'bg-purple-600/20 border border-purple-500/30'
              }`}>
                {msg.role === 'user'
                  ? <span className="text-[10px] font-bold text-white">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
                  : <Bot className="w-4 h-4 text-purple-400" />}
              </div>

              <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-tl-none'
                }`}>
                  {msg.role === 'user'
                    ? <p className="text-sm">{msg.content}</p>
                    : <MessageContent content={msg.content} />}
                </div>
                {msg.provider && msg.provider !== 'system' && msg.provider !== 'error' && (
                  <span className="text-[10px] text-slate-500 px-1">via {msg.provider}</span>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 rounded-tl-none flex items-center gap-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <span className="text-xs text-slate-400">Generating response...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 shrink-0">
        <div className="max-w-3xl mx-auto">
          {messages.length === 1 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(item.action)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl text-xs text-slate-300 transition-all text-left"
                >
                  <span className="text-purple-400 shrink-0">{item.icon}</span>
                  <span className="truncate">{item.text}</span>
                </button>
              ))}
            </div>
          )}

          <div className="relative flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeMode === 'code' ? "Describe what you want to build..." : "Ask Gravity AI anything..."}
              rows={1}
              className="flex-1 bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none resize-none transition-all custom-scrollbar"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-all active:scale-95"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-500 mt-2">
            <span className="font-bold text-purple-500">Shift+Enter</span> for new line • <span className="font-bold">Enter</span> to send
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
