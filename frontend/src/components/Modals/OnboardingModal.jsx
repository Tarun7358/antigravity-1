import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

const SKILL_OPTIONS = [
  'Frontend',
  'Backend',
  'Full Stack',
  'DevOps',
  'AI/ML',
  'UI/UX',
  'Mobile',
  'Game Dev',
  'Open Source',
];

const OnboardingModal = ({ isOpen, workspace, onCancel, onComplete }) => {
  const [nickname, setNickname] = useState('');
  const [skills, setSkills] = useState([]);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const rulesEnabled = !!workspace?.rules?.enabled;
  const rulesText = workspace?.rules?.text || '';

  const canContinue = useMemo(() => {
    if (rulesEnabled && !accepted) return false;
    return true;
  }, [accepted, rulesEnabled]);

  const toggleSkill = (skill) => {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  };

  const handleComplete = async () => {
    if (!canContinue || submitting) return;
    setSubmitting(true);
    try {
      await onComplete({ nickname, skills });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 12 }}
          className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-white font-bold">Join {workspace?.name || 'Workspace'}</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Onboarding</p>
              </div>
            </div>
            <button onClick={onCancel} className="p-2 text-slate-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Your profile</div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nickname (optional)</label>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. tarun_dev"
                />

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Skills</div>
                    <div className="text-[10px] text-slate-600">{skills.length}/5</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => (skills.length >= 5 && !skills.includes(s) ? null : toggleSkill(s))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                          skills.includes(s)
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Checklist</div>
                <div className="space-y-2">
                  {(workspace?.onboarding?.checklist || ['Pick your skills', 'Read the rules', 'Say hello in #general']).slice(0, 6).map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-slate-700" />
                      <span className="text-slate-400">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Rules</div>
                </div>
                {rulesEnabled ? (
                  <>
                    <div className="max-h-[220px] overflow-auto text-sm text-slate-300 whitespace-pre-wrap bg-slate-900 border border-slate-800 rounded-2xl p-4 custom-scrollbar">
                      {rulesText || 'This workspace requires rules acceptance.'}
                    </div>
                    <label className="mt-4 flex items-center gap-2 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600"
                      />
                      <span className="text-sm text-slate-300">I accept the workspace rules</span>
                    </label>
                  </>
                ) : (
                  <div className="text-sm text-slate-500">This workspace does not require rules acceptance.</div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!canContinue || submitting}
                  onClick={handleComplete}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Joining…' : 'Join Workspace'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OnboardingModal;

