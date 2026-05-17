import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react';

const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate processing OAuth tokens and syncing with Firebase
    const processAuth = async () => {
      // In a real implementation, we would extract the code/token from the URL,
      // exchange it for a Firebase credential, and sign in.
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigate('/app');
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-indigo-500/10 rounded-[32px] flex items-center justify-center border border-indigo-500/20 shadow-2xl">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        </div>
        <div className="absolute -top-2 -right-2">
          <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
        </div>
      </div>
      
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Authenticating with Gravity</h1>
        <p className="text-slate-400 max-w-sm mx-auto text-lg leading-relaxed">
          Establishing a secure, end-to-end encrypted session. Please wait while we sync your developer profile.
        </p>
      </div>

      <div className="mt-12 flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Secure Handshake in Progress</span>
      </div>
    </div>
  );
};

export default OAuthCallback;
