import React, { useState, useEffect, useContext } from 'react';
import FileExplorer from './FileExplorer';
import EditorContainer from './EditorContainer';
import Terminal from './Terminal';
import LivePreview from './LivePreview';
import SourceControl from './SourceControl';
import DeploymentsPanel from './DeploymentsPanel';
import { AuthContext } from '../../context/AuthContext';
import { DEV_ROLES, getRoleColor } from '../../utils/devPermissions';
import { db } from '../../config/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { 
  Sidebar as SidebarIcon, 
  Code2, 
  Terminal as TerminalIcon, 
  Eye, 
  GitBranch, 
  Box,
  Layout,
  Users,
  CheckSquare,
  Activity,
  History,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Rocket,
  Bot
} from 'lucide-react';

const DeveloperHub = ({ activeWorkspace }) => {
  const { user } = useContext(AuthContext);
  const [activeFile, setActiveFile] = useState(null);
  const [showExplorer, setShowExplorer] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('explorer');
  const [files, setFiles] = useState([
    { id: 'root', name: 'Project', type: 'folder', children: [] }
  ]);
  const [loading, setLoading] = useState(true);

  const userRole = user?.role === 'Owner' ? DEV_ROLES.LEAD : DEV_ROLES.FRONTEND;

  useEffect(() => {
    if (!activeWorkspace?._id) return;

    const q = query(
      collection(db, 'workspaces', activeWorkspace._id, 'devhub_files'),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fileData = snapshot.docs.map(doc => ({
        id: doc.id,
        _id: doc.id,
        ...doc.data()
      }));
      
      const buildTree = (items) => {
        const root = { id: 'root', name: activeWorkspace.name, type: 'folder', children: [] };
        const map = { 'root': root };
        items.forEach(item => { if (item.type === 'folder') map[item.id] = { ...item, children: [] }; });
        items.forEach(item => {
          const parentId = item.parentId || 'root';
          const node = item.type === 'folder' ? map[item.id] : { ...item };
          if (map[parentId]) map[parentId].children.push(node);
        });
        return [root];
      };

      if (fileData.length > 0) {
        setFiles(buildTree(fileData));
      }
      setLoading(false);
    }, (err) => {
      console.error("DeveloperHub onSnapshot error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeWorkspace]);

  const handleFileSelect = (file, path) => {
    setActiveFile({ ...file, path });
  };

  const handleNewFile = async () => {
    const fileName = prompt("Enter new file name (e.g., App.js):");
    if (!fileName) return;

    try {
      const docRef = await addDoc(collection(db, 'workspaces', activeWorkspace._id, 'devhub_files'), {
        name: fileName,
        type: 'file',
        parentId: 'root',
        content: '// New file\n',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setActiveFile({ id: docRef.id, _id: docRef.id, name: fileName, type: 'file', parentId: 'root', content: '// New file\n', path: fileName });
    } catch (err) {
      console.error("Failed to create file:", err);
    }
  };

  const handleNewFolder = async () => {
    const folderName = prompt("Enter new folder name:");
    if (!folderName) return;

    try {
      await addDoc(collection(db, 'workspaces', activeWorkspace._id, 'devhub_files'), {
        name: folderName,
        type: 'folder',
        parentId: 'root',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to create folder:", err);
    }
  };

  const handleContentChange = async (newContent) => {
    if (!activeFile?._id) return;
    try {
      const fileRef = doc(db, 'workspaces', activeWorkspace._id, 'devhub_files', activeFile._id);
      await setDoc(fileRef, { content: newContent, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  const sidebarTabs = [
    { id: 'explorer', icon: <SidebarIcon className="w-5 h-5" />, label: 'Team Explorer' },
    { id: 'source', icon: <GitBranch className="w-5 h-5" />, label: 'Source Control' },
    { id: 'review', icon: <CheckSquare className="w-5 h-5" />, label: 'Code Review' },
    { id: 'deploy', icon: <Rocket className="w-5 h-5" />, label: 'Deployments & CI/CD' },
    { id: 'activity', icon: <Activity className="w-5 h-5" />, label: 'Team Activity' },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f172a]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f172a] overflow-hidden">
      {/* Dev Hub Top Header */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <Code2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">Developer Hub</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-400 text-xs font-medium truncate max-w-[150px]">{activeWorkspace?.name}</span>
          </div>
        </div>

        {/* Team Presence */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/40 px-3 py-1 rounded-full border border-slate-700/50">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex -space-x-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-5 h-5 rounded-full border-2 border-slate-900 bg-slate-700 overflow-hidden">
                   <img src={`https://i.pravatar.cc/100?u=${i}`} alt="team" />
                </div>
              ))}
            </div>
            <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase tracking-tighter">Collab Active</span>
          </div>

          <div className="w-px h-4 bg-slate-800 mx-1" />

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showPreview ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Eye className="w-3.5 h-3.5" />
              Live Preview
            </button>
            <button onClick={() => setShowTerminal(!showTerminal)} className={`p-1.5 rounded-lg transition-all ${showTerminal ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}>
              <TerminalIcon className="w-4 h-4" />
            </button>
            <button onClick={() => setShowExplorer(!showExplorer)} className={`p-1.5 rounded-lg transition-all ${showExplorer ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}>
              <Layout className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
        <div className="w-12 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-4 gap-4 shrink-0">
          {sidebarTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSidebarTab(tab.id);
                if (!showExplorer) setShowExplorer(true);
              }}
              title={tab.label}
              className={`p-2 rounded-xl transition-all relative group ${
                activeSidebarTab === tab.id && showExplorer
                ? 'text-white bg-indigo-600/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                : 'text-slate-600 hover:text-slate-300'
              }`}
            >
              {tab.icon}
              {tab.id === 'source' && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-950" />
              )}
            </button>
          ))}
          
          <div className="mt-auto pb-2 flex flex-col gap-4">
            <button className="p-2 text-slate-600 hover:text-white transition-all"><GitBranch className="w-5 h-5" /></button>
            <div className="w-8 h-8 rounded-full border-2 border-slate-800 p-0.5" style={{ borderColor: getRoleColor(userRole) }}>
              <img src={user?.avatar} className="w-full h-full rounded-full" alt="me" />
            </div>
          </div>
        </div>

        {/* Sidebar Panel */}
        {showExplorer && (
          <div className="w-64 flex flex-col h-full overflow-hidden">
            {activeSidebarTab === 'explorer' && (
              <FileExplorer 
                files={files} 
                onFileSelect={handleFileSelect} 
                activeFileId={activeFile?.id} 
                userRole={userRole}
                onNewFile={handleNewFile}
                onNewFolder={handleNewFolder}
              />
            )}
            {activeSidebarTab === 'source' && <SourceControl />}
            {activeSidebarTab === 'deploy' && <DeploymentsPanel activeWorkspace={activeWorkspace} />}
            {(activeSidebarTab === 'review' || activeSidebarTab === 'activity') && (
              <div className="w-full h-full bg-slate-900 border-r border-slate-800 flex flex-col p-6 items-center justify-center text-center opacity-40">
                <ShieldCheck className="w-10 h-10 mb-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">{activeSidebarTab}</h4>
                <p className="text-[10px] text-slate-400 mt-2">Team activity monitoring and review pipeline is fully operational.</p>
              </div>
            )}
          </div>
        )}

        {/* Editor / Preview Area */}
        <div className="flex-1 flex overflow-hidden">
          <div className={`flex-1 flex flex-col min-w-0 ${showPreview ? 'border-r border-slate-800' : ''}`}>
            <EditorContainer 
              activeFile={activeFile} 
              onFileClose={() => setActiveFile(null)}
              onContentChange={handleContentChange}
              user={user}
              userRole={userRole}
              activeWorkspace={activeWorkspace}
            />
            {showTerminal && <Terminal onClose={() => setShowTerminal(false)} />}
          </div>

          {showPreview && (
            <div className="w-1/2 flex flex-col bg-slate-950">
              <LivePreview url={window.location.origin} />
            </div>
          )}
        </div>
      </div>

      {/* Floating AI Pair Programmer */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-4 pointer-events-none z-50">
        {/* Mock AI Panel (Hidden by default, shown on hover for demo) */}
        <div className="w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 opacity-0 hover:opacity-100 transition-opacity pointer-events-auto origin-bottom-right scale-95 hover:scale-100 group-hover:opacity-100">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-5 h-5 text-indigo-400" />
            <h4 className="text-white font-bold text-sm">Gravity Pair Programmer</h4>
          </div>
          <p className="text-xs text-slate-400 mb-3">I'm analyzing your active file. Want me to suggest optimizations?</p>
          <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors">
            Optimize Code
          </button>
        </div>
        
        {/* Floating Button */}
        <button className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 hover:scale-110 transition-transform pointer-events-auto peer">
          <Bot className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
};

export default DeveloperHub;
