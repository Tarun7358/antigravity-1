import React, { useState } from 'react';
import { Monitor, Moon, Sun, Smartphone, Type, Palette } from 'lucide-react';

const AppearancePanel = () => {
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState(14);
  const [uiDensity, setUiDensity] = useState('comfortable');

  const themes = [
    { id: 'dark', name: 'Dark', icon: <Moon className="w-5 h-5" />, color: 'bg-slate-900' },
    { id: 'light', name: 'Light', icon: <Sun className="w-5 h-5" />, color: 'bg-white' },
    { id: 'amoled', name: 'AMOLED', icon: <Smartphone className="w-5 h-5" />, color: 'bg-black' },
  ];

  const densities = ['Comfortable', 'Compact', 'Relaxed'];

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Appearance</h2>
        <p className="text-slate-400 text-sm">Customize how Anti Gravity looks and feels for you.</p>
      </div>

      {/* Theme Section */}
      <section className="space-y-4">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Theme</label>
        <div className="grid grid-cols-3 gap-4">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
                theme === t.id 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-slate-800 bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.id === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-800 text-white'}`}>
                {t.icon}
              </div>
              <span className={`font-semibold text-sm ${theme === t.id ? 'text-white' : 'text-slate-400'}`}>{t.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Scale Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Font Size ({fontSize}px)</label>
          <Type className="w-4 h-4 text-slate-500" />
        </div>
        <input 
          type="range" 
          min="12" 
          max="24" 
          step="1"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
          <span>Small</span>
          <span>Medium</span>
          <span>Large</span>
        </div>
      </section>

      {/* Density Section */}
      <section className="space-y-4">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Interface Density</label>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {densities.map((d, idx) => (
            <button
              key={d}
              onClick={() => setUiDensity(d.toLowerCase())}
              className={`w-full flex items-center justify-between px-6 py-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-all ${
                uiDensity === d.toLowerCase() ? 'text-white' : 'text-slate-400'
              }`}
            >
              <span className="font-medium">{d}</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                uiDensity === d.toLowerCase() ? 'border-indigo-500' : 'border-slate-700'
              }`}>
                {uiDensity === d.toLowerCase() && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Accent Color */}
      <section className="space-y-4">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Accent Color</label>
        <div className="flex gap-4">
          {['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#10b981', '#0ea5e9'].map((color) => (
            <button
              key={color}
              className="w-8 h-8 rounded-full border-2 border-slate-900 transition-transform hover:scale-125"
              style={{ backgroundColor: color }}
            />
          ))}
          <button className="w-8 h-8 rounded-full border-2 border-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-all">
            <Palette className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default AppearancePanel;
