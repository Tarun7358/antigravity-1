import React, { useState } from 'react';
import { 
  Folder, File, ChevronRight, ChevronDown, 
  Plus, FolderPlus, Search, MoreVertical, 
  FileCode, FileJson, FileText, Layout,
  Lock, ShieldCheck, User as UserIcon
} from 'lucide-react';
import { canEditPath, getRoleColor } from '../../utils/devPermissions';

const FileExplorer = ({ files, onFileSelect, activeFileId, userRole, onNewFile, onNewFolder }) => {
  const [expandedFolders, setExpandedFolders] = useState(['root', 'frontend', 'backend']);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId) 
        : [...prev, folderId]
    );
  };

  const getFileIcon = (fileName) => {
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return <FileCode className="w-4 h-4 text-yellow-400" />;
    if (fileName.endsWith('.json')) return <FileJson className="w-4 h-4 text-emerald-400" />;
    if (fileName.endsWith('.css')) return <Layout className="w-4 h-4 text-sky-400" />;
    if (fileName.endsWith('.html')) return <Layout className="w-4 h-4 text-orange-400" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  const renderTree = (items, parentPath = '') => {
    return items.map(item => {
      const isExpanded = expandedFolders.includes(item.id);
      const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      const editable = canEditPath(userRole, currentPath);
      
      if (item.type === 'folder') {
        return (
          <div key={item.id} className="select-none">
            <div 
              onClick={() => toggleFolder(item.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-800/50 cursor-pointer text-slate-300 group transition-colors relative"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <Folder className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
              <span className="text-sm font-medium">{item.name}</span>
              {!editable && <Lock className="w-3 h-3 text-slate-600 ml-auto" />}
            </div>
            {isExpanded && (
              <div className="ml-4 border-l border-slate-800/50">
                {renderTree(item.children || [], currentPath)}
              </div>
            )}
          </div>
        );
      }

      return (
        <div 
          key={item.id}
          onClick={() => onFileSelect(item, currentPath)}
          className={`flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800/50 cursor-pointer group transition-colors relative ${
            activeFileId === item.id ? 'bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-500' : 'text-slate-400'
          }`}
        >
          <div className="w-4 shrink-0" />
          {getFileIcon(item.name)}
          <span className="text-sm truncate">{item.name}</span>
          {!editable && <Lock className="w-3 h-3 text-slate-600 ml-auto opacity-50" />}
        </div>
      );
    });
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            Team Explorer
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          </h3>
          <div className="flex items-center gap-1">
            <button onClick={onNewFile} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="New File">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={onNewFolder} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="New Folder">
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        {/* User Role Badge */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getRoleColor(userRole) }} />
          <span className="text-xs font-bold text-slate-200 truncate">{userRole}</span>
        </div>
      </div>

      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search team files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
        {renderTree(files[0].children)}
      </div>

      {/* Team Ownership Indicators */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Modular Ownership</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px]">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-slate-400">frontend/</span>
            <span className="text-slate-500 ml-auto">Frontend Team</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">backend/</span>
            <span className="text-slate-500 ml-auto">Backend Team</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;
