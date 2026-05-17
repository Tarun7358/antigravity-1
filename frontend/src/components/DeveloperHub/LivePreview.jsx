import React, { useState } from 'react';
import { 
  RotateCcw, ExternalLink, Smartphone, 
  Tablet, Monitor, Globe, ChevronLeft, 
  ChevronRight, Lock, Shield
} from 'lucide-react';

const LivePreview = ({ url = 'http://localhost:5174' }) => {
  const [device, setDevice] = useState('desktop');
  const [iframeKey, setIframeKey] = useState(0);

  const deviceConfig = {
    desktop: { width: '100%', height: '100%', scale: 1 },
    tablet: { width: '768px', height: '1024px', scale: 0.8 },
    mobile: { width: '375px', height: '667px', scale: 0.9 },
  };

  const reload = () => setIframeKey(prev => prev + 1);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f172a] overflow-hidden">
      {/* Browser Bar */}
      <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-4 shrink-0">
        <div className="flex items-center gap-1.5">
          <button className="p-1 text-slate-500 hover:text-white transition-all"><ChevronLeft className="w-4 h-4" /></button>
          <button className="p-1 text-slate-500 hover:text-white transition-all"><ChevronRight className="w-4 h-4" /></button>
          <button onClick={reload} className="p-1 text-slate-500 hover:text-white transition-all ml-1"><RotateCcw className="w-3.5 h-3.5" /></button>
        </div>

        <div className="flex-1 max-w-xl h-7 bg-slate-950 border border-slate-800 rounded-lg flex items-center px-3 gap-2 group focus-within:border-indigo-500 transition-all">
          <Lock className="w-3 h-3 text-emerald-500" />
          <span className="text-[10px] text-slate-400 font-medium truncate flex-1">{url}</span>
          <Shield className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100" />
        </div>

        <div className="flex items-center gap-1 border-l border-slate-800 pl-4 h-6">
          <button 
            onClick={() => setDevice('mobile')}
            className={`p-1 rounded transition-all ${device === 'mobile' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-white'}`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setDevice('tablet')}
            className={`p-1 rounded transition-all ${device === 'tablet' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-white'}`}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setDevice('desktop')}
            className={`p-1 rounded transition-all ${device === 'desktop' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-white'}`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <a href={url} target="_blank" rel="noreferrer" className="p-1 text-slate-500 hover:text-white ml-2">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Iframe Viewport Area */}
      <div className="flex-1 bg-slate-950/50 flex items-center justify-center p-8 overflow-auto pattern-grid">
        <div 
          className="bg-white rounded-lg shadow-2xl transition-all duration-300 origin-center overflow-hidden border-8 border-slate-900"
          style={{ 
            width: deviceConfig[device].width,
            height: deviceConfig[device].height,
            maxHeight: '100%',
            maxWidth: '100%'
          }}
        >
          <iframe 
            key={iframeKey}
            src={url} 
            className="w-full h-full border-none"
            title="Live Preview"
            sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts"
          />
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="h-6 bg-slate-900 border-t border-slate-800 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Preview Active</span>
        </div>
        <span className="text-[9px] font-bold text-slate-500">RES: {deviceConfig[device].width} x {deviceConfig[device].height}</span>
      </div>
    </div>
  );
};

export default LivePreview;
