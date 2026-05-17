import React, { useState, useEffect, useRef, useContext } from 'react';
import { Send, Paperclip, Smile, Users, Shield, Hash, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { AuthContext } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  limit 
} from 'firebase/firestore';
import { encryptMessage, decryptMessage } from '../../utils/encryption';

const ChatArea = ({ activeChannel, activeWorkspace }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [showMembers, setShowMembers] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen to messages for the active channel
  useEffect(() => {
    if (!activeWorkspace?._id || !activeChannel?._id) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const messagesRef = collection(db, 'workspaces', activeWorkspace._id, 'channels', activeChannel._id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgList = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        // Decrypt the message content
        const decryptedContent = await decryptMessage(activeWorkspace._id, data.content);
        return {
          id: doc.id,
          ...data,
          content: decryptedContent,
          // Convert Firestore timestamp to JS Date for formatting
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }));
      setMessages(msgList);
      setLoading(false);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [activeChannel, activeWorkspace]);

  const handleSlashCommand = async (commandString) => {
    const args = commandString.slice(1).split(' ');
    const command = args[0].toLowerCase();
    const payload = args.slice(1).join(' ');

    const messagesRef = collection(db, 'workspaces', activeWorkspace._id, 'channels', activeChannel._id, 'messages');

    let botResponse = '';
    let isBotCommand = true;

    if (command === 'clear') {
      botResponse = 'Chat history cleared for you locally (Mock).';
    } else if (command === 'deploy') {
      botResponse = `🚀 **Deploying to Production**\nService: ${payload || 'core-api'}\nStatus: Building... [View Logs]`;
    } else if (command === 'bot') {
      try {
        const res = await fetch('http://localhost:5000/api/ai/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: payload, context: { workspace: activeWorkspace.name } })
        });
        const data = await res.json();
        botResponse = `🤖 **Gravity AI**\n${data.response}`;
      } catch (err) {
        botResponse = `🤖 **Gravity AI**\nError reaching backend: ${err.message}`;
      }
    } else {
      botResponse = `Unknown command: /${command}. Try /bot, /deploy, or /clear.`;
    }

    if (isBotCommand) {
      // Write the bot response to the chat
      const encryptedContent = await encryptMessage(activeWorkspace._id, botResponse);
      await addDoc(messagesRef, {
        content: encryptedContent,
        sender: {
          uid: 'bot-1',
          username: 'Gravity AI',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=gravity'
        },
        createdAt: serverTimestamp(),
        isSystem: true
      });
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const content = newMessage.trim();
    setNewMessage('');

    if (content.startsWith('/')) {
      await handleSlashCommand(content);
      return;
    }

    try {
      // Encrypt message content before sending
      const encryptedContent = await encryptMessage(activeWorkspace._id, content);

      const messagesRef = collection(db, 'workspaces', activeWorkspace._id, 'channels', activeChannel._id, 'messages');
      await addDoc(messagesRef, {
        content: encryptedContent,
        sender: {
          uid: user.uid,
          username: user.username,
          avatar: user.avatar
        },
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending encrypted message:", error);
    }
  };

  // Mock members for now (could be fetched from a 'members' collection later)
  const memberGroups = [
    {
      name: 'Online',
      members: [
        { name: user?.username || 'You', status: 'Online', avatar: user?.avatar, role: 'Owner' },
        { name: 'AntiGravity Bot', status: 'Online', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=gravity', role: 'AI Assistant' },
      ]
    }
  ];

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0f172a]">
      {/* Main Chat Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <Hash className="w-5 h-5 text-slate-400" />
            <div>
              <h2 className="text-white font-bold leading-tight">{activeChannel?.name || 'select-a-channel'}</h2>
              <p className="text-xs text-slate-400">Welcome to the #{activeChannel?.name} channel!</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button 
              onClick={() => setShowMembers(!showMembers)}
              className={`hover:text-white transition-colors ${showMembers ? 'text-indigo-400' : ''}`}
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                <Hash className="w-8 h-8 text-slate-500" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">Welcome to #{activeChannel?.name}!</h3>
                <p className="text-slate-400 max-w-xs">This is the start of the #{activeChannel?.name} channel. Send a message to get things started.</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className="flex gap-4 group hover:bg-slate-800/30 -mx-6 px-6 py-1 transition-colors">
                <img src={msg.sender?.avatar} alt={msg.sender?.username} className="w-10 h-10 rounded-full bg-slate-700 shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-white hover:underline cursor-pointer">{msg.sender?.username}</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {msg.createdAt && format(msg.createdAt, 'hh:mm a')}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed break-words">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-6 pt-0">
          <form 
            onSubmit={handleSendMessage}
            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl flex flex-col focus-within:border-indigo-500/50 transition-colors"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message #${activeChannel?.name}`}
              className="w-full bg-transparent border-none text-white px-5 py-4 focus:outline-none placeholder-slate-500"
            />
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex gap-1">
                <button type="button" className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 rounded-lg transition-all"><Paperclip className="w-4 h-4" /></button>
                <button type="button" className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 rounded-lg transition-all"><Smile className="w-4 h-4" /></button>
              </div>
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:bg-slate-700 shadow-lg shadow-indigo-600/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Members Sidebar */}
      {showMembers && (
        <div className="w-60 bg-slate-900 border-l border-slate-800 shrink-0 overflow-y-auto hidden lg:block">
          <div className="p-6">
            {memberGroups.map((group, idx) => (
              <div key={idx} className="mb-6">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                  {group.name} — {group.members.length}
                </h3>
                <div className="space-y-1">
                  {group.members.map((member, mIdx) => (
                    <div key={mIdx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors group">
                      <div className="relative">
                        <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full bg-slate-700" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-slate-300 group-hover:text-white truncate">{member.name}</span>
                          {member.role === 'Owner' && <Shield className="w-3 h-3 text-indigo-400" />}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{member.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;
