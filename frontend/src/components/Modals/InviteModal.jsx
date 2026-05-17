import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Link as LinkIcon, Copy, 
  Check, QrCode, Globe, Clock, 
  ShieldCheck, AlertCircle, Share2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const InviteModal = ({ isOpen, onClose, activeWorkspace }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generateInvite = async () => {
    setIsLoading(true);
    // Generate a random 8-character code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    try {
      await addDoc(collection(db, 'workspaces', activeWorkspace._id, 'invites'), {
        code,
        createdBy: activeWorkspace.ownerId,
        createdAt: serverTimestamp(),
        expiresAt: null, // Permanent for now
        uses: 0
      });
      setInviteCode(code);
    } catch (error) {
      console.error("Error generating invite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const inviteUrl = `${window.location.origin}/invite/${inviteCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Share2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-white font-bold">Invite to Workspace</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{activeWorkspace?.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-8 space-y-6">
            {!inviteCode ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center mx-auto border border-slate-700 shadow-xl">
                  <Globe className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Ready to expand?</h3>
                  <p className="text-sm text-slate-500 max-w-[250px] mx-auto mt-1">Generate a secure link to invite your team to this workspace.</p>
                </div>
                <button 
                  onClick={generateInvite}
                  disabled={isLoading}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 mx-auto"
                >
                  {isLoading ? 'Generating...' : 'Generate Invite Link'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Invite Link</label>
                  <div className="flex gap-2">
                    <div className="flex-1 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center px-4 overflow-hidden">
                      <span className="text-sm text-indigo-400 truncate">{inviteUrl}</span>
                    </div>
                    <button 
                      onClick={copyToClipboard}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isCopied ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                      {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowQR(!showQR)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border font-bold text-xs transition-all ${showQR ? 'bg-white text-slate-900 border-white' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                  >
                    <QrCode className="w-4 h-4" />
                    {showQR ? 'Hide QR Code' : 'Show QR Code'}
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs hover:bg-slate-700 transition-all">
                    <Clock className="w-4 h-4" />
                    Set Expiry
                  </button>
                </div>

                {showQR && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center p-6 bg-white rounded-3xl space-y-4 shadow-2xl"
                  >
                    <QRCodeSVG value={inviteUrl} size={180} />
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scan to join</p>
                      <p className="text-xs font-bold text-slate-900">{activeWorkspace?.name}</p>
                    </div>
                  </motion.div>
                )}

                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-start gap-3">
                   <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                   <div>
                     <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">End-to-End Secure</p>
                     <p className="text-[11px] text-slate-400 mt-0.5">This link gives full member access. Share only with trusted teammates.</p>
                   </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InviteModal;
