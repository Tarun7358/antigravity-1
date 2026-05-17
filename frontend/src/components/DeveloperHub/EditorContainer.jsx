import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { WebrtcProvider } from 'y-webrtc';
import { X, Save, Play, Code, Zap, Sparkles, Loader2, Lock, History, CheckCircle2 } from 'lucide-react';
import { canEditPath } from '../../utils/devPermissions';
import ProjectOverview from './ProjectOverview';

const EditorContainer = ({ activeFile, onFileClose, onContentChange, user, userRole, activeWorkspace }) => {
  const editorRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [provider, setProvider] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [content, setContent] = useState(activeFile?.content || '');

  useEffect(() => {
    if (!activeFile) return;
    
    // Check permissions
    const editable = canEditPath(userRole || 'Guest Viewer', activeFile.path);
    setIsReadOnly(!editable);
    setContent(activeFile.content || '');
  }, [activeFile, userRole]);

  useEffect(() => {
    if (!activeFile || !editorRef.current || isReadOnly) return;

    // Set up Real-time Collaboration (Yjs) - Only if editable
    const ydoc = new Y.Doc();
    const roomName = `antigravity-editor-${activeFile.id}`;
    const newProvider = new WebrtcProvider(roomName, ydoc);
    
    newProvider.awareness.setLocalStateField('user', {
      name: user?.username || 'Anonymous',
      color: user?.color || '#6366f1'
    });

    const ytext = ydoc.getText('monaco');
    const binding = new MonacoBinding(
      ytext, 
      editorRef.current.getModel(), 
      new Set([editorRef.current]), 
      newProvider.awareness
    );

    setProvider(newProvider);

    return () => {
      binding.destroy();
      newProvider.disconnect();
      ydoc.destroy();
    };
  }, [activeFile, user, isReadOnly]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value) => {
    setContent(value);
    if (onContentChange) {
      onContentChange(value);
    }
  };

  const getLanguage = (fileName) => {
    if (!fileName) return 'plaintext';
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return 'javascript';
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return 'typescript';
    if (fileName.endsWith('.css')) return 'css';
    if (fileName.endsWith('.html')) return 'html';
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.py')) return 'python';
    return 'plaintext';
  };

  if (!activeFile) {
    return (
      <ProjectOverview 
        workspaceName={activeWorkspace?.name || 'My Project'} 
        onAction={(action) => console.log('Action:', action)} 
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
      {/* Editor Header / Tabs */}
      <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-1 shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center h-full">
          <div className="flex items-center gap-2 px-4 h-full border-r border-slate-800 bg-[#1e1e1e] text-slate-200 text-xs font-medium cursor-pointer min-w-[120px] max-w-[250px]">
             {isReadOnly ? <Lock className="w-3.5 h-3.5 text-slate-500" /> : <Zap className="w-3.5 h-3.5 text-yellow-400" />}
             <span className="truncate">{activeFile.name}</span>
             {isReadOnly && <span className="text-[9px] bg-slate-800 text-slate-500 px-1 rounded ml-1">READ ONLY</span>}
             <X className="w-3 h-3 text-slate-500 hover:text-white ml-auto" onClick={() => onFileClose(activeFile.id)} />
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-auto px-4">
          {!isReadOnly && (
            <>
              <div className="flex -space-x-2 mr-4">
                 <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg" title={user?.username}>
                   {user?.username?.[0] || 'U'}
                 </div>
              </div>
              <button onClick={() => setIsSaving(true)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all" title="Submit for Review">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all" title="View History">
            <History className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all" title="Run Code">
            <Play className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative group">
        <Editor
          height="100%"
          language={getLanguage(activeFile.name)}
          theme="vs-dark"
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly: isReadOnly,
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16 },
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            cursorBlinking: 'smooth',
            renderLineHighlight: 'all',
            domReadOnly: isReadOnly,
          }}
        />
        
        {isReadOnly && (
          <div className="absolute top-4 right-4 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-lg flex items-center gap-2 text-xs text-slate-400 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
            <Lock className="w-3.5 h-3.5" />
            <span>This module is locked for your role. Contact a Lead Developer to request access.</span>
          </div>
        )}

        <button 
          onClick={async () => {
            if (!content) return alert("Editor is empty.");
            try {
              const res = await fetch('http://localhost:5000/api/ai/analyze-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: content, filename: activeFile.name, language: getLanguage(activeFile.name) })
              });
              const data = await res.json();
              alert(data.analysis || data.response || "No analysis available.");
            } catch (err) {
              alert("Error reaching backend: " + err.message);
            }
          }}
          className="absolute bottom-6 right-6 p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-2xl shadow-indigo-600/40 flex items-center gap-2 transition-all group active:scale-95 z-20"
        >
          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="text-sm font-semibold pr-1">Ask Gravity AI</span>
        </button>
      </div>
    </div>
  );
};

export default EditorContainer;
