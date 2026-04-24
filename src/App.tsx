/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Settings, Sparkles, MessageSquare, Zap, Target, BookOpen } from 'lucide-react';
import { PetState, Habit, InteractionMessage } from './types';
import AuraPet from './components/AuraPet';
import HabitBoard from './components/HabitBoard';
import { getPetResponse, evolvePet } from './services/geminiService';

const INITIAL_PET: PetState = {
  id: 'aura-001',
  name: 'Aura',
  personality: 'Curious, helpful, and highly adaptive. Loves to see the user grow.',
  mood: 'neutral',
  energy: 80,
  happiness: 70,
  intelligence: 50,
  discipline: 50,
  growthLevel: 1,
  color: '#6366f1',
  shape: 'blob',
  traits: ['Observer'],
  lastInteraction: Date.now()
};

export default function App() {
  const [pet, setPet] = useState<PetState>(() => {
    try {
      const saved = localStorage.getItem('aura-pet-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.error("Failed to load pet state", e);
    }
    return INITIAL_PET;
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem('aura-habits');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to load habits", e);
    }
    return [];
  });

  const [messages, setMessages] = useState<InteractionMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('aura-pet-state', JSON.stringify(pet));
  }, [pet]);

  useEffect(() => {
    localStorage.setItem('aura-habits', JSON.stringify(habits));
    // Calculate discipline based on habits
    if (habits.length > 0) {
      const completed = habits.filter(h => h.completed).length;
      const disciplineScore = Math.round((completed / habits.length) * 100);
      setPet(prev => ({ ...prev, discipline: disciplineScore }));
    }
  }, [habits]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newUserMessage: InteractionMessage = {
      role: 'user',
      content: userInput,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsTyping(true);

    const response = await getPetResponse(pet, userInput, messages.slice(-5), habits);
    
    setIsTyping(false);
    if (response) {
      const newPetMessage: InteractionMessage = {
        role: 'pet',
        content: response.message,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, newPetMessage]);
      
      setPet(prev => ({
        ...prev,
        mood: response.moodUpdate || prev.mood,
        happiness: Math.min(100, Math.max(0, prev.happiness + (response.statChange?.happiness || 0))),
        energy: Math.min(100, Math.max(0, prev.energy + (response.statChange?.energy || 0))),
        intelligence: Math.min(100, Math.max(0, prev.intelligence + (response.statChange?.intelligence || 2))),
        traits: response.newTrait && !prev.traits.includes(response.newTrait) 
          ? [...prev.traits, response.newTrait] 
          : prev.traits
      }));
    }
  };

  const addHabit = (text: string, type: Habit['type']) => {
    const newHabit: Habit = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      type,
      completed: false,
      timestamp: Date.now()
    };
    setHabits(prev => [newHabit, ...prev]);
  };

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const triggerEvolution = async () => {
    const update = await evolvePet(pet, habits);
    if (update) {
       setPet(prev => ({
         ...prev,
         growthLevel: update.growthLevel || prev.growthLevel,
         personality: update.personalityShift || prev.personality,
         traits: update.newTraits || prev.traits,
         shape: update.recommendedShape || prev.shape
       }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-hidden border-x-8 md:border-8 border-[#1A1A24] flex flex-col h-screen">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_0%,transparent_100%)]" />
      </div>

      <nav className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-slate-800 bg-black/20">
        <div className="flex items-center gap-4">
          <div className="space-y-0">
            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 leading-none">
              {pet.name.toUpperCase()}.v04
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-mono">Neural Companion // Adaptive Interface</p>
          </div>
        </div>

        <div className="flex gap-8 text-right hidden md:flex">
          <div className="group">
            <p className="text-[10px] text-slate-500 uppercase font-mono tracking-tighter">Synaptic Sync</p>
            <p className="text-xl font-mono text-cyan-400">{Math.round((pet.happiness + pet.discipline) / 2)}%</p>
          </div>
          <div className="group">
            <p className="text-[10px] text-slate-500 uppercase font-mono tracking-tighter">Evolution Phase</p>
            <p className="text-xl font-mono text-emerald-400">{pet.growthLevel >= 5 ? 'STABLE' : 'EVOLVING'}</p>
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 self-center hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 overflow-hidden">
        
        {/* Left Column: Vitality & Metrics */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          <HabitBoard 
            habits={habits} 
            onAdd={addHabit} 
            onToggle={toggleHabit} 
            onDelete={deleteHabit} 
          />

          <div className="bg-[#14141C] p-6 rounded-2xl border border-slate-800 flex-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
               <Target className="w-3 h-3 text-cyan-400" /> Core Metrics
            </h2>
            <div className="space-y-6">
              <StatBar icon={<MessageSquare className="w-3 h-3" />} label="Sentiment" value={pet.happiness} color="bg-cyan-400" textColor="text-cyan-400" />
              <StatBar icon={<Zap className="w-3 h-3" />} label="Empathy" value={Math.round(pet.intelligence * 0.8)} color="bg-pink-400" textColor="text-pink-400" />
              <StatBar icon={<BookOpen className="w-3 h-3" />} label="Neural Intelligence" value={pet.intelligence} color="bg-emerald-400" textColor="text-emerald-400" />
              <StatBar icon={<Target className="w-3 h-3" />} label="Discipline" value={pet.discipline} color="bg-orange-400" textColor="text-orange-400" />
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-800">
               <p className="text-[10px] text-slate-500 leading-relaxed italic font-mono uppercase tracking-tight">
                 "Your behavior directly influences my cognitive resonance. Keep syncing."
               </p>
            </div>
          </div>
        </div>

        {/* Center Column: Entity Visualization */}
        <div className="lg:col-span-6 flex flex-col relative">
          <div className="flex-1 relative flex items-center justify-center">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 aspect-square bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
               <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-emerald-400/10 rounded-full opacity-40 blur-xl animate-pulse" />
               <div className="absolute inset-8 rounded-full border border-dashed border-cyan-500/20" />
               
               <div className="w-full h-full rounded-full border-4 border-slate-800 flex items-center justify-center bg-[#0D0D14] overflow-hidden shadow-2xl relative z-10">
                 <AuraPet pet={pet} onClick={() => setPet(prev => ({ ...prev, mood: 'excited' }))} />
               </div>

               <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-2/3 h-4 bg-cyan-500/10 blur-xl rounded-full" />
            </div>
          </div>
          
          <div className="flex justify-center gap-8 text-[10px] font-mono tracking-widest mt-4">
             <span className="text-emerald-400 flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
               STATUS: {pet.mood.toUpperCase()}
             </span>
             <span className="text-slate-700">|</span>
             <span className="text-cyan-400">PHASE: {pet.growthLevel >= 10 ? 'ZENITH' : `RANK_${pet.growthLevel}`}</span>
          </div>
        </div>

        {/* Right Column: Evolution & Insights */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          <div className="bg-[#14141C] p-6 rounded-2xl border border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 font-mono">Evolution Log</h2>
            <div className="space-y-6">
              <div className="pl-3 border-l border-cyan-500 space-y-1">
                <p className="text-[10px] text-slate-500 font-mono">LATEST // Identity Shift</p>
                <p className="text-xs text-slate-300">Personality threshold reached: <span className="text-cyan-300">Level {pet.growthLevel}</span></p>
              </div>
              <div className="pl-3 border-l border-emerald-500 space-y-1">
                <p className="text-[10px] text-slate-500 font-mono">TRAITS // Active Subroutines</p>
                <div className="flex flex-wrap gap-2 pt-1">
                   {pet.traits.map(trait => (
                     <span key={trait} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-bold text-emerald-400">
                       {trait.toUpperCase()}
                     </span>
                   ))}
                </div>
              </div>
              {habits.slice(0, 2).map((h, i) => (
                <div key={h.id} className="pl-3 border-l border-slate-700 opacity-60 space-y-1">
                  <p className="text-[10px] text-slate-500 font-mono">LOG_${i} // Vitality Sync</p>
                  <p className="text-xs text-slate-400">{h.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#14141C] p-6 rounded-2xl border border-slate-800 flex-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 font-mono">Entity Config</h2>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setPet(prev => ({...prev, shape: 'blob'}))}
                className={`p-2 rounded-lg text-[10px] border transition-all ${pet.shape === 'blob' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
              >
                FORM: ADAPTIVE
              </button>
              <button 
                onClick={() => setPet(prev => ({...prev, shape: 'star'}))}
                className={`p-2 rounded-lg text-[10px] border transition-all ${pet.shape === 'star' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
              >
                FORM: CRYSTAL
              </button>
              <button 
                className="p-2 bg-slate-800 rounded-lg text-[10px] border border-slate-700 text-slate-500 cursor-not-allowed"
                disabled
              >
                FORM: GEOMETRIC
              </button>
              <button 
                onClick={triggerEvolution}
                className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[10px] text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all"
              >
                SYNAPTIC BURST
              </button>
            </div>

            <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
               <p className="text-[10px] text-cyan-200 mb-3 font-mono uppercase tracking-widest text-center">Neural Bank</p>
               <div className="flex justify-between gap-2">
                  <button onClick={() => alert('Autosaving to local buffer...')} className="flex-1 py-2 bg-cyan-500 text-slate-900 text-[10px] font-bold rounded uppercase tracking-tighter hover:bg-cyan-400 transition-all">Save Core</button>
                  <button onClick={() => window.location.reload()} className="flex-1 py-2 border border-cyan-500 text-cyan-500 text-[10px] font-bold rounded uppercase tracking-tighter hover:bg-cyan-500/10 transition-all">Restore</button>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer: Chat Interface */}
      <footer className="relative z-10 m-8 mt-0 flex items-center bg-[#14141C] rounded-2xl p-4 border border-slate-800 shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl mr-6 border border-slate-700 shrink-0">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
        </div>
        
        <div className="flex-1 mr-6 overflow-hidden">
          <p className="text-[10px] text-slate-500 mb-1 font-mono uppercase tracking-widest">Neural Link Output</p>
          <div className="text-sm text-slate-300 truncate font-mono italic">
            {messages.length > 0 ? messages[messages.length-1].content : `"Awaiting neural input. Your current resonance profile is stable."`}
          </div>
        </div>

        <div className="relative flex-1 max-w-xl group">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Input neural signal..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-emerald-500 text-slate-900 rounded-lg font-bold text-[10px] uppercase tracking-tighter hover:bg-emerald-400 transition-all disabled:opacity-50"
          >
            Transmit
          </button>
        </div>
      </footer>

      {/* Settings Modal (Minimal) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-[#111] border border-white/10 rounded-[2.5rem] p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">Model Configuration</h2>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40">✕</button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 block mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={pet.name} 
                    onChange={e => setPet(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 block mb-2">Core Color Theme</label>
                  <div className="flex gap-3">
                    {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'].map(c => (
                      <button 
                        key={c}
                        onClick={() => setPet(prev => ({ ...prev, color: c }))}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${pet.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="pt-4">
                   <button 
                    onClick={triggerEvolution}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                   >
                     <Zap className="w-5 h-5" />
                     Force Neural Evolution
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
}

function StatBar({ icon, label, value, color, textColor }: { icon: React.ReactNode, label: string, value: number, color: string, textColor: string }) {
  return (
    <div className="space-y-1.5 group">
      <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.2em]">
        <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-300 transition-colors">
          {icon}
          {label}
        </div>
        <span className={`${textColor} font-bold`}>LV.{value}</span>
      </div>
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${color} shadow-[0_0_10px_currentColor]`} 
        />
      </div>
    </div>
  );
}

