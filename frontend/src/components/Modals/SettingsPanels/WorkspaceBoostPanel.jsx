import React, { useState } from 'react';
import { Rocket, Sparkles, Zap, Star } from 'lucide-react';

const WorkspaceBoostPanel = ({ workspace }) => {
  const [boosted, setBoosted] = useState(false);

  const handleBoost = () => {
    setBoosted(true);
    setTimeout(() => setBoosted(false), 3000); // Reset animation after 3s
  };

  return (
    <div className="space-y-8 relative">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-fuchsia-400" />
          Server Boost
        </h2>
        <p className="text-slate-400 text-sm">Boost this workspace to unlock premium features and increase server limits.</p>
      </div>

      <div className="bg-gradient-to-br from-fuchsia-600/20 to-purple-600/20 border border-fuchsia-500/30 rounded-3xl p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[80px] rounded-full mix-blend-screen" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
          <div className="w-32 h-32 rounded-full bg-slate-900 border-4 border-fuchsia-500 flex items-center justify-center shrink-0 shadow-[0_0_40px_rgba(217,70,239,0.3)]">
            <Rocket className={`w-16 h-16 text-fuchsia-400 ${boosted ? 'animate-bounce' : ''}`} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-white mb-2">Level 1 Perks Unlocked!</h3>
            <p className="text-slate-300 text-sm mb-4">This workspace currently has 0 boosts. Boost it to reach Level 2 and unlock better voice quality, more emoji slots, and larger file uploads!</p>
            <button 
              onClick={handleBoost}
              className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg text-white flex items-center justify-center gap-2 mx-auto md:mx-0 ${
                boosted ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-fuchsia-600 hover:bg-fuchsia-500 hover:scale-105'
              }`}
            >
              {boosted ? <><Zap className="w-5 h-5" /> Boosted!</> : <><Sparkles className="w-5 h-5" /> Boost This Server</>}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { level: 1, boosts: 2, perks: ['+50 Emoji Slots', '128 Kbps Audio Quality', 'Animated Server Icon'] },
          { level: 2, boosts: 7, perks: ['+50 Emoji Slots (100 total)', '256 Kbps Audio Quality', '50MB Upload Limit'] },
          { level: 3, boosts: 14, perks: ['+100 Emoji Slots (250 total)', '384 Kbps Audio Quality', '100MB Upload Limit'] }
        ].map((tier, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative">
            {idx === 0 && <div className="absolute -top-3 -right-3 w-8 h-8 bg-fuchsia-500 rounded-full flex items-center justify-center shadow-lg"><Star className="w-4 h-4 text-white" /></div>}
            <h4 className="text-white font-bold text-lg mb-1">Level {tier.level}</h4>
            <p className="text-fuchsia-400 text-sm font-medium mb-4">{tier.boosts} Server Boosts</p>
            <ul className="space-y-2">
              {tier.perks.map((perk, i) => (
                <li key={i} className="text-slate-400 text-xs flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkspaceBoostPanel;
