import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Shield, Bell, Monitor, Volume2, 
  Code, Eye, Bot, LogOut
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import AccountPanel from './SettingsPanels/AccountPanel';
import ProfilePanel from './SettingsPanels/ProfilePanel';
import SecurityPanel from './SettingsPanels/SecurityPanel';
import NotificationsPanel from './SettingsPanels/NotificationsPanel';
import AppearancePanel from './SettingsPanels/AppearancePanel';
import VoiceVideoPanel from './SettingsPanels/VoiceVideoPanel';
import DeveloperSettingsPanel from './SettingsPanels/DeveloperSettingsPanel';
import AIPrefPanel from './SettingsPanels/AIPrefPanel';

const SettingsModal = ({ isOpen, onClose }) => {
  const { logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('My Account');

  if (!isOpen) return null;

  const userTabs = [
    { name: 'USER SETTINGS', isHeader: true },
    { name: 'My Account', icon: <User className="w-4 h-4" /> },
    { name: 'Profile', icon: <Eye className="w-4 h-4" /> },
    { name: 'Security', icon: <Shield className="w-4 h-4" /> },
    { name: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { name: 'APP SETTINGS', isHeader: true },
    { name: 'Appearance', icon: <Monitor className="w-4 h-4" /> },
    { name: 'Voice & Video', icon: <Volume2 className="w-4 h-4" /> },
    { name: 'Developer Hub', icon: <Code className="w-4 h-4" /> },
    { name: 'AI Preferences', icon: <Bot className="w-4 h-4" /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'My Account': return <AccountPanel />;
      case 'Profile': return <ProfilePanel />;
      case 'Security': return <SecurityPanel />;
      case 'Notifications': return <NotificationsPanel />;
      case 'Appearance': return <AppearancePanel />;
      case 'Voice & Video': return <VoiceVideoPanel />;
      case 'Developer Hub': return <DeveloperSettingsPanel />;
      case 'AI Preferences': return <AIPrefPanel />;
      default: return <AccountPanel />;
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
            {userTabs.map((tab, idx) => (
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
            
            <div className="mt-8 pt-4 border-t border-slate-800">
              <button 
                onClick={() => { logout(); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-400/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#0f172a] flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-12 relative custom-scrollbar">
            <div className="max-w-3xl">
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

export default SettingsModal;
