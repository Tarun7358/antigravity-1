import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar/Sidebar';
import MemberSidebar from '../components/Sidebar/MemberSidebar';
import ChatArea from '../components/Chat/ChatArea';
import TaskBoard from '../components/TaskBoard/TaskBoard';
import NotesEditor from '../components/Notes/NotesEditor';
import VoiceRoom from '../components/Voice/VoiceRoom';
import AIAssistant from '../components/AI/AIAssistant';
import CalendarView from '../components/Calendar/CalendarView';
import DeveloperHub from '../components/DeveloperHub/DeveloperHub';
import ProjectOverview from '../components/DeveloperHub/ProjectOverview';
import DMChat from '../components/Chat/DMChat';
import ForumView from '../components/Forum/ForumView';
import SnippetsLibrary from '../components/DeveloperHub/SnippetsLibrary';
import Discover from './Discover';
import CreateWorkspaceModal from '../components/Modals/CreateWorkspaceModal';
import CreateChannelModal from '../components/Modals/CreateChannelModal';
import InviteModal from '../components/Modals/InviteModal';
import ServerSettingsModal from '../components/Modals/ServerSettingsModal';
import SettingsModal from '../components/Modals/SettingsModal';
import { AuthContext } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, serverTimestamp, collectionGroup, limit } from 'firebase/firestore';
import { MessageSquare, Layout, FileText, Bot, Video, Calendar as CalendarIcon, Code2 } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeView, setActiveView] = useState('dashboard');
  const [activeChannel, setActiveChannel] = useState(null);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [activeDMUser, setActiveDMUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [notifications, setNotifications] = useState({}); // { channelId: count }
  // Modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsType, setSettingsType] = useState('user');
  const [isServerSettingsModalOpen, setIsServerSettingsModalOpen] = useState(false);
  const [channelTypeToCreate, setChannelTypeToCreate] = useState('text');
  const [userRole, setUserRole] = useState('Member');

  // Listen for DM user selections fired from the Sidebar
  useEffect(() => {
    const handleOpenDM = (e) => {
      setActiveDMUser(e.detail);
      setActiveView('dm');
    };
    window.addEventListener('ag:open-dm', handleOpenDM);
    return () => window.removeEventListener('ag:open-dm', handleOpenDM);
  }, []);

  // Presence Tracking
  useEffect(() => {
    if (!user?.uid) return;

    // Reset channel when workspace changes to avoid stale data
    setActiveChannel(null);

    if (!activeWorkspace?._id) return;

    const userRef = doc(db, 'users', user.uid);
    updateDoc(userRef, {
      status: 'online',
      lastSeen: serverTimestamp()
    });

    const q = query(collection(db, 'workspaces', activeWorkspace._id, 'members'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
    });

    return () => {
      updateDoc(userRef, { status: 'offline', lastSeen: serverTimestamp() });
      unsubscribe();
    };
  }, [user, activeWorkspace]);

  // Rich Presence Tracking
  useEffect(() => {
    if (!user?.uid || !activeWorkspace?._id) return;

    let presenceStatus = 'Browsing Workspace';
    if (activeView === 'chat' && activeChannel) {
      presenceStatus = `Chatting in #${activeChannel.name}`;
    } else if (activeView === 'voice' && activeChannel) {
      presenceStatus = `In Voice: ${activeChannel.name}`;
    } else if (activeView === 'forum' && activeChannel) {
      presenceStatus = `Browsing Forums: ${activeChannel.name}`;
    } else if (activeView === 'tasks') {
      presenceStatus = 'Organizing Tasks';
    } else if (activeView === 'devhub') {
      presenceStatus = 'Coding in Dev Hub';
    } else if (activeView === 'ai') {
      presenceStatus = 'Pair Programming with AI';
    }

    const memberRef = doc(db, 'workspaces', activeWorkspace._id, 'members', user.uid);
    updateDoc(memberRef, {
      customStatus: presenceStatus,
      updatedAt: serverTimestamp()
    }).catch(err => console.warn("Failed to update rich presence:", err));

  }, [activeView, activeChannel, activeWorkspace, user]);

  const openSettings = (type) => {
    if (type === 'workspace') {
      setIsServerSettingsModalOpen(true);
    } else {
      setSettingsType(type);
      setIsSettingsModalOpen(true);
    }
  };

  // Listen to channels when active workspace changes
  useEffect(() => {
    if (!activeWorkspace) {
      setChannels([]);
      return;
    }

    const q = query(
      collection(db, 'workspaces', activeWorkspace._id, 'channels'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const channelData = snapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));
      setChannels(channelData);
      
      if (channelData.length > 0 && !activeChannel) {
        const firstText = channelData.find(c => c.type === 'text');
        if (firstText) {
          setActiveChannel(firstText);
          // If we were just coming from a no-workspace state, maybe go to chat?
          // Or stay on dashboard. Let's stay on dashboard for now.
        }
      }
    }, (error) => {
      console.error("Error listening to channels:", error);
    });

    return () => unsubscribe();
  }, [activeWorkspace]);

  const openChannelModal = (type) => {
    setChannelTypeToCreate(type);
    setIsChannelModalOpen(true);
  };

  const handleWorkspaceCreated = (newWorkspace) => {
    setActiveWorkspace(newWorkspace);
  };

  const handleChannelCreated = (newChannel) => {
    setActiveChannel(newChannel);
    if (newChannel.type === 'voice') setActiveView('voice');
    else if (newChannel.type === 'forum') setActiveView('forum');
    else setActiveView('chat');
  };

  // Global Notification Listener
  useEffect(() => {
    let unsubscribe;
    if (!user?.uid) return;

    const setupNotifications = async () => {
      try {
        const q = query(collectionGroup(db, 'messages'), orderBy('createdAt', 'desc'), limit(1));
        unsubscribe = onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const msg = change.doc.data();
              if (msg.sender?.uid !== user.uid) {
                // New message notification
              }
            }
          });
        }, (error) => {
          console.warn("Notification system offline:", error.message);
        });
      } catch (err) {
        console.error("Failed to start notifications:", err);
      }
    };

    setupNotifications();
    return () => unsubscribe && unsubscribe();
  }, [user]);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <ProjectOverview activeWorkspace={activeWorkspace} workspaceName={activeWorkspace?.name || 'Workspace'} onAction={(action) => { if (action === 'settings') openSettings('workspace'); else setActiveView(action); }} />;
      case 'chat':
        return activeChannel ? <ChatArea activeChannel={activeChannel} activeWorkspace={activeWorkspace} /> : null;
      case 'forum':
        return activeChannel ? <ForumView channel={activeChannel} activeWorkspace={activeWorkspace} /> : null;
      case 'snippets':
        return <SnippetsLibrary activeWorkspace={activeWorkspace} />;
      case 'dm':
        return <DMChat activeDMUser={activeDMUser} />;
      case 'discover':
        return <Discover onWorkspaceSelected={(ws) => { setActiveWorkspace(ws); setActiveView('dashboard'); }} />;
      case 'tasks':
        return <TaskBoard activeWorkspace={activeWorkspace} />;
      case 'notes':
        return <NotesEditor activeWorkspace={activeWorkspace} />;
      case 'voice':
        return <VoiceRoom activeChannel={activeChannel} activeWorkspace={activeWorkspace} setActiveView={setActiveView} setActiveChannel={setActiveChannel} />;
      case 'ai':
        return <AIAssistant activeWorkspace={activeWorkspace} />;
      case 'calendar':
        return <CalendarView activeWorkspace={activeWorkspace} />;
      case 'devhub':
        if (!activeWorkspace) {
          return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-[#0f172a]">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                <Code2 className="w-10 h-10 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Select a Workspace</h2>
              <p className="text-slate-400 max-w-md">
                Open the Developer Hub by selecting a workspace from the sidebar first.
              </p>
            </div>
          );
        }
        return <DeveloperHub activeWorkspace={activeWorkspace} />;
      default:
        if (!activeWorkspace && activeView !== 'discover' && activeView !== 'dm') {
          return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-[#0f172a]">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                <Layout className="w-10 h-10 text-indigo-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Welcome to Anti Gravity</h2>
              <p className="text-slate-400 max-w-md mb-8">
                You don't have an active workspace. Create your own engineering team or join an existing public workspace to start collaborating.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsWorkspaceModalOpen(true)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg"
                >
                  Create Workspace
                </button>
                <button 
                  onClick={() => setActiveView('discover')}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all shadow-lg"
                >
                  Discover Communities
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <h2 className="text-3xl font-bold text-white mb-4">Welcome to Anti Gravity</h2>
            <p className="text-slate-400">Select a workspace or start a DM to begin.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0f172a] text-slate-200 overflow-hidden font-sans">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        setActiveChannel={setActiveChannel}
        activeChannel={activeChannel}
        activeWorkspace={activeWorkspace}
        setActiveWorkspace={setActiveWorkspace}
        channels={channels}
        onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        onOpenChannelModal={openChannelModal}
        onOpenUserSettings={() => openSettings('user')}
        onOpenWorkspaceSettings={() => openSettings('workspace')}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
             {renderContent()}
          </div>
          
          {/* Member Sidebar - Discord style right panel */}
          {(activeView === 'chat' || activeView === 'voice' || activeView === 'dashboard') && (
            <MemberSidebar 
              members={members} 
              onOpenInvite={() => setIsInviteModalOpen(true)}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onCreated={handleWorkspaceCreated}
      />
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        activeWorkspace={activeWorkspace}
      />
      <CreateChannelModal
        isOpen={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
        channelType={channelTypeToCreate}
        activeWorkspace={activeWorkspace}
        onCreated={handleChannelCreated}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        type={settingsType}
        activeWorkspace={activeWorkspace}
        setActiveWorkspace={setActiveWorkspace}
      />
      <ServerSettingsModal
        isOpen={isServerSettingsModalOpen}
        onClose={() => setIsServerSettingsModalOpen(false)}
        activeWorkspace={activeWorkspace}
        setActiveWorkspace={setActiveWorkspace}
      />
    </div>
  );
};

export default Dashboard;
