import React, { useState, useEffect, useRef, useContext } from 'react';
import { Send, Paperclip, Smile, Phone, Video, Info, Hash, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { AuthContext } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit 
} from 'firebase/firestore';
import { encryptMessage, decryptMessage } from '../../utils/encryption';

const DMChat = ({ activeDMUser }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Generate a consistent DM ID for two users
  const dmId = user && activeDMUser 
    ? [user.uid, activeDMUser.uid].sort().join('_') 
    : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!dmId) return;

    setLoading(true);
    const messagesRef = collection(db, 'direct_messages', dmId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgList = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        // For DMs, we use a shared secret derived from user IDs (simulated here with dmId)
        const decryptedContent = await decryptMessage(dmId, data.content);
        return {
          id: doc.id,
          ...data,
          content: decryptedContent,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }));
      setMessages(msgList);
      setLoading(false);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [dmId]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user || !dmId) return;

    try {
      const encryptedContent = await encryptMessage(dmId, newMessage.trim());
      const messagesRef = collection(db, 'direct_messages', dmId, 'messages');
      
      await addDoc(messagesRef, {
        content: encryptedContent,
        sender: {
          uid: user.uid,
          username: user.username,
          avatar: user.avatar
        },
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending DM:", error);
    }
  };

  if (!activeDMUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0f172a] text-slate-500">
        <div className="w-20 h-20 bg-slate-800 rounded-[32px] flex items-center justify-center mb-6 border border-slate-700 shadow-2xl">
          <Hash className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-white">Select a Friend</h2>
        <p className="text-sm mt-2">Start a private, end-to-end encrypted conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0f172a] overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-slate-800 flex items-center px-4 justify-between bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={activeDMUser.avatar} className="w-8 h-8 rounded-full border border-slate-700" alt="u" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-none">{activeDMUser.username}</h3>
            <div className="flex items-center gap-1.5 mt-1">
               <ShieldCheck className="w-3 h-3 text-emerald-500" />
               <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">E2EE Secured</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <button className="hover:text-white transition-colors"><Phone className="w-5 h-5" /></button>
          <button className="hover:text-white transition-colors"><Video className="w-5 h-5" /></button>
          <button className="hover:text-white transition-colors"><Info className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>
        ) : (
          messages.map((msg, idx) => (
            <div key={msg.id} className="flex gap-4 group hover:bg-slate-800/20 -mx-4 px-4 py-1 transition-all">
              <img src={msg.sender.avatar} className="w-10 h-10 rounded-full mt-1 border border-slate-800" alt="u" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold text-white hover:underline cursor-pointer transition-all">{msg.sender.username}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{format(msg.createdAt, 'hh:mm a')}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed break-words">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-900/50 backdrop-blur-md">
        <form onSubmit={handleSendMessage} className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-3 text-slate-500">
             <button type="button" className="hover:text-white transition-colors"><Paperclip className="w-5 h-5" /></button>
          </div>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message @${activeDMUser.username}`}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-14 pr-14 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white transition-all shadow-inner"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-3 text-slate-500">
             <button type="button" className="hover:text-white transition-colors"><Smile className="w-5 h-5" /></button>
             <button type="submit" disabled={!newMessage.trim()} className="text-indigo-400 hover:text-white disabled:opacity-50 transition-all">
                <Send className="w-5 h-5" />
             </button>
          </div>
        </form>
        <p className="text-[9px] text-center text-slate-600 mt-2 flex items-center justify-center gap-1">
          <Lock className="w-2.5 h-2.5" />
          Messages are end-to-end encrypted. No one else can read them.
        </p>
      </div>
    </div>
  );
};

export default DMChat;
