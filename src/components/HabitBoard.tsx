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
    <div id="habit-board" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
           <Activity className="w-3 h-3 text-emerald-400" /> Daily Habits
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-slate-300 font-bold">Resonance</span>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative group">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Log your progress..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100/30 focus:border-blue-200 transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1.5 p-1.5 text-blue-400 hover:text-blue-500 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </form>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {habits.map((habit) => (
            <motion.div
              layout
              key={habit.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => onToggle(habit.id)}
              className={`group flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                habit.completed 
                  ? 'bg-emerald-50 border-emerald-100 opacity-60' 
                  : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                 <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                   habit.completed ? 'bg-emerald-400 border-emerald-400 text-white' : 'border-slate-200 text-transparent'
                 }`}>
                   <Check className="w-3 h-3" strokeWidth={4} />
                 </div>
                 <span className={`text-sm font-bold transition-all ${
                   habit.completed ? 'text-slate-400 line-through' : 'text-slate-600'
                 }`}>
                   {habit.text}
                 </span>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onDelete(habit.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-400 transition-all rounded-lg hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
