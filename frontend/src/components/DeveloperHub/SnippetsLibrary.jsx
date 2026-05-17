import React, { useState, useEffect, useContext } from 'react';
import { db } from '../../config/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { AuthContext } from '../../context/AuthContext';
import { Code2, Search, Plus, Copy, Trash2, Loader2, Bot, CheckCircle2 } from 'lucide-react';
import { Editor } from '@monaco-editor/react';

const LANGUAGES = ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'bash', 'markdown'];

const SnippetsLibrary = ({ activeWorkspace }) => {
  const { user } = useContext(AuthContext);
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // New snippet state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');

  useEffect(() => {
    if (!activeWorkspace?._id) return;
    
    const q = query(
      collection(db, 'workspaces', activeWorkspace._id, 'snippets'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSnippets(data);
      setLoading(false);
    }, (err) => {
      console.error("Snippets onSnapshot error:", err);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [activeWorkspace]);

  const filteredSnippets = snippets.filter(s => 
    s.title?.toLowerCase().includes(search.toLowerCase()) || 
    s.description?.toLowerCase().includes(search.toLowerCase()) ||
    s.language?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveSnippet = async (e) => {
    e.preventDefault();
    if (!title.trim() || !code.trim() || !activeWorkspace?._id) return;
    
    try {
      await addDoc(collection(db, 'workspaces', activeWorkspace._id, 'snippets'), {
        title,
        description,
        code,
        language,
        authorId: user.uid,
        authorName: user.username || user.displayName || 'User',
        authorAvatar: user.avatar || '',
        createdAt: serverTimestamp()
      });
      setIsCreating(false);
      setTitle('');
      setDescription('');
      setCode('');
    } catch (err) {
      console.error("Failed to save snippet", err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!activeWorkspace?._id) return;
    try {
      await deleteDoc(doc(db, 'workspaces', activeWorkspace._id, 'snippets', id));
      if (selectedSnippet?.id === id) setSelectedSnippet(null);
    } catch (err) {
      console.error("Failed to delete snippet", err);
    }
  };

  const copyToClipboard = (text, id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f172a]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f172a] overflow-hidden">
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <Code2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-white font-bold">Snippets Library</h2>
            <p className="text-xs text-slate-400">Save and share reusable code, utilities, and APIs</p>
          </div>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Snippet</span>
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - List */}
        <div className="w-80 border-r border-slate-800 bg-slate-900/30 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search snippets..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filteredSnippets.length > 0 ? (
              filteredSnippets.map(snippet => (
                <div 
                  key={snippet.id} 
                  onClick={() => { setSelectedSnippet(snippet); setIsCreating(false); }}
                  className={`p-3 rounded-xl cursor-pointer border transition-all ${selectedSnippet?.id === snippet.id && !isCreating ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-transparent border-transparent hover:bg-slate-800/50'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-white font-semibold text-sm truncate">{snippet.title}</h4>
                    <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 py-0.5 bg-slate-800 rounded">{snippet.language}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{snippet.description || 'No description'}</p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">No snippets found.</div>
            )}
          </div>
        </div>

        {/* Right Area - Editor/View */}
        <div className="flex-1 flex flex-col bg-[#0f172a] overflow-hidden relative">
          {isCreating ? (
            <form onSubmit={handleSaveSnippet} className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar">
              <div className="max-w-4xl mx-auto w-full space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Create New Snippet</h3>
                  <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white font-medium text-sm">Cancel</button>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Title</label>
                    <input 
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. Firebase Auth Hook"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Language</label>
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                    >
                      {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</label>
                  <input 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="What does this code do?"
                  />
                </div>

                <div className="flex-1 min-h-[400px] border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex flex-col">
                  <div className="bg-slate-900 border-b border-slate-800 p-2 flex justify-between items-center">
                    <div className="text-xs font-bold text-slate-500 ml-2">Code</div>
                  </div>
                  <div className="flex-1">
                    <Editor
                      height="100%"
                      language={language}
                      theme="vs-dark"
                      value={code}
                      onChange={setCode}
                      options={{ minimap: { enabled: false }, padding: { top: 16 } }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={!code.trim() || !title.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg">
                    Save Snippet
                  </button>
                </div>
              </div>
            </form>
          ) : selectedSnippet ? (
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col h-full space-y-6">
                <div className="flex items-start justify-between bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">{selectedSnippet.title}</h3>
                      <span className="text-[10px] uppercase font-bold text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded-md border border-indigo-500/30">
                        {selectedSnippet.language}
                      </span>
                    </div>
                    <p className="text-slate-400">{selectedSnippet.description || 'No description provided.'}</p>
                    <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
                      <img src={selectedSnippet.authorAvatar || `https://ui-avatars.com/api/?name=${selectedSnippet.authorName}`} className="w-5 h-5 rounded-full" alt="author" />
                      <span>{selectedSnippet.authorName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => copyToClipboard(selectedSnippet.code, selectedSnippet.id, e)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700 flex items-center gap-2 text-sm font-medium"
                    >
                      {copiedId === selectedSnippet.id ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copiedId === selectedSnippet.id ? 'Copied!' : 'Copy Code'}
                    </button>
                    {(selectedSnippet.authorId === user?.uid || user?.role === 'Owner') && (
                      <button 
                        onClick={(e) => handleDelete(selectedSnippet.id, e)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all border border-rose-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-2xl relative group">
                  <Editor
                    height="100%"
                    language={selectedSnippet.language}
                    theme="vs-dark"
                    value={selectedSnippet.code}
                    options={{ 
                      minimap: { enabled: false }, 
                      padding: { top: 16 },
                      readOnly: true,
                      scrollBeyondLastLine: false
                    }}
                  />
                  {/* AI Suggestion Hook - Mock UI for phase 3 */}
                  <div className="absolute bottom-4 right-4 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <button className="bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-500">
                      <Bot className="w-4 h-4" /> Optimize with AI
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Code2 className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a snippet from the library or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SnippetsLibrary;
