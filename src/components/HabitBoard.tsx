/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plus, Check, Trash2, Activity, Book, Shield, Users } from 'lucide-react';
import { Habit } from '../types';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  habits: Habit[];
  onAdd: (text: string, type: Habit['type']) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TYPE_ICONS = {
  health: <Activity className="w-4 h-4" />,
  learning: <Book className="w-4 h-4" />,
  productivity: <Shield className="w-4 h-4" />,
  social: <Users className="w-4 h-4" />,
};

const TYPE_COLORS = {
  health: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  learning: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  productivity: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  social: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

export default function HabitBoard({ habits, onAdd, onToggle, onDelete }: Props) {
  const [newText, setNewText] = useState('');
  const [type, setType] = useState<Habit['type']>('productivity');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAdd(newText, type);
    setNewText('');
  };

  return (
    <div id="habit-board" className="bg-[#14141C] p-6 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
           <span className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span> Vitality Inputs
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-slate-600 font-mono">Neural Sync</span>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative group">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add vitality task..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
          />
          <button
            type="submit"
            className="absolute right-2 top-1.5 p-1 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {habits.map((habit) => (
            <motion.div
              layout
              key={habit.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => onToggle(habit.id)}
              className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                habit.completed 
                  ? 'bg-slate-800/50 border-emerald-500/30' 
                  : 'bg-slate-900 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                 <div className={`w-3 h-3 rounded-sm border transition-all ${
                   habit.completed ? 'bg-emerald-400 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'border-slate-600'
                 }`} />
                 <span className={`text-[11px] font-medium transition-all ${
                   habit.completed ? 'text-slate-400' : 'text-slate-300'
                 }`}>
                   {habit.text}
                 </span>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onDelete(habit.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-pink-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
