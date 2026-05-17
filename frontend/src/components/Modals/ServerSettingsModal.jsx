import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Settings, Users, Hash, Globe, Lock, Trash2
} from 'lucide-react';
import WorkspaceGeneralPanel from './SettingsPanels/WorkspaceGeneralPanel';
import RolesPanel from './SettingsPanels/RolesPanel';
import ChannelsPanel from './SettingsPanels/ChannelsPanel';
import IntegrationsPanel from './SettingsPanels/IntegrationsPanel';
import MembersPanel from './SettingsPanels/MembersPanel';
import InvitesPanel from './SettingsPanels/InvitesPanel';
import BansPanel from './SettingsPanels/BansPanel';
import AuditLogsPanel from './SettingsPanels/AuditLogsPanel';
import WorkspaceBoostPanel from './SettingsPanels/WorkspaceBoostPanel';
import { Rocket } from 'lucide-react';

const ServerSettingsModal = ({ isOpen, onClose, activeWorkspace, setActiveWorkspace }) => {
  const [activeTab, setActiveTab] = useState('Workspace Overview');

  if (!isOpen) return null;

  const workspaceTabs = [
    { name: 'WORKSPACE SETTINGS', isHeader: true },
    { name: 'Workspace Overview', icon: <Settings className="w-4 h-4" /> },
    { name: 'Roles', icon: <Users className="w-4 h-4" /> },
    { name: 'Channels', icon: <Hash className="w-4 h-4" /> },
    { name: 'Integrations', icon: <Globe className="w-4 h-4" /> },
    { name: 'Server Boost', icon: <Rocket className="w-4 h-4 text-fuchsia-400" /> },
    { name: 'USER MANAGEMENT', isHeader: true },
    { name: 'Members', icon: <Users className="w-4 h-4" /> },
    { name: 'Invites', icon: <Lock className="w-4 h-4" /> },
    { name: 'Bans', icon: <Trash2 className="w-4 h-4" /> },
    { name: 'Audit Logs', icon: <Settings className="w-4 h-4" /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Workspace Overview': return <WorkspaceGeneralPanel workspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} onClose={onClose} />;
      case 'Roles': return <RolesPanel workspace={activeWorkspace} />;
      case 'Channels': return <ChannelsPanel workspace={activeWorkspace} />;
      case 'Integrations': return <IntegrationsPanel workspace={activeWorkspace} />;
      case 'Server Boost': return <WorkspaceBoostPanel workspace={activeWorkspace} />;
      case 'Members': return <MembersPanel workspace={activeWorkspace} />;
      case 'Invites': return <InvitesPanel workspace={activeWorkspace} />;
      case 'Bans': return <BansPanel workspace={activeWorkspace} />;
      case 'Audit Logs': return <AuditLogsPanel workspace={activeWorkspace} />;
      default: return <WorkspaceGeneralPanel workspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} onClose={onClose} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center overflow-hidden"
    >
      <div className="w-full h-full flex relative">
        {/* Sidebar */}
        <div className="w-72 bg-slate-900 border-r border-slate-800 flex justify-end">
          <div className="w-60 py-12 px-4 overflow-y-auto custom-scrollbar">
            <div className="px-2 mb-4">
              <h2 className="text-white font-bold truncate">{activeWorkspace?.name}</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Server Settings</p>
            </div>

            {workspaceTabs.map((tab, idx) => (
              tab.isHeader ? (
                <h3 key={idx} className="text-[11px] font-bold text-slate-500 mt-6 mb-2 px-2 tracking-wider">
                  {tab.name}
                </h3>
              ) : (
                <button
                  key={idx}
                  onClick={() => setActiveTab(tab.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                    activeTab === tab.name 
                    ? 'bg-slate-800 text-white shadow-md' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              )
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#0f172a] flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-12 relative custom-scrollbar">
            <div className="max-w-4xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          
          {/* Close Button Floating */}
          <div className="absolute top-12 right-12 flex flex-col items-center gap-2">
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full border-2 border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all group shadow-lg"
            >
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            </button>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ESC</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ServerSettingsModal;
