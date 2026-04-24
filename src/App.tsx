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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-rose-100 overflow-hidden flex flex-col h-screen">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-100 rounded-full blur-[120px] opacity-60" />
      </div>

      <nav className="relative z-10 px-8 py-4 flex items-center justify-between border-b border-slate-200 bg-white/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="space-y-0">
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 leading-none">
              {pet.name}
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Your Digital Companion</p>
          </div>
        </div>

        <div className="flex gap-6 items-center">
          <div className="hidden md:flex gap-4">
            <div className="text-center px-4 py-1 bg-white border border-slate-100 rounded-full shadow-sm">
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Sync Score</p>
              <p className="text-sm font-bold text-blue-500">{Math.round((pet.happiness + pet.discipline) / 2)}%</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2.5 bg-white border border-slate-100 rounded-full shadow-sm hover:shadow-md transition-all text-slate-400 hover:text-indigo-500"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden max-w-[1400px] mx-auto w-full">
        
        {/* Left Column: Habits & Metrics */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
          <HabitBoard 
            habits={habits} 
            onAdd={addHabit} 
            onToggle={toggleHabit} 
            onDelete={deleteHabit} 
          />

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex-1 overflow-y-auto custom-scrollbar">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
               Core Metrics
            </h2>
            <div className="space-y-5">
              <StatBar icon={<MessageSquare className="w-3 h-3" />} label="Happiness" value={pet.happiness} color="bg-pink-400" textColor="text-pink-500" />
              <StatBar icon={<Zap className="w-3 h-3" />} label="Vitality" value={pet.energy} color="bg-yellow-400" textColor="text-yellow-600" />
              <StatBar icon={<BookOpen className="w-3 h-3" />} label="Cognition" value={pet.intelligence} color="bg-indigo-400" textColor="text-indigo-500" />
              <StatBar icon={<Target className="w-3 h-3" />} label="Discipline" value={pet.discipline} color="bg-emerald-400" textColor="text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Right Column: Interaction Hub */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden h-full">
          
          {/* Pet Visualization & Chat */}
          <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
            
            {/* Pet Area (Integrated Header) */}
            <div className="h-[240px] relative flex items-center justify-center bg-gradient-to-b from-blue-50/50 to-transparent border-b border-slate-50 shrink-0">
               <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                 <div className="w-[80%] h-[80%] bg-blue-100 rounded-full blur-[60px]" />
               </div>
               <AuraPet pet={pet} onClick={() => setPet(prev => ({ ...prev, mood: 'excited' }))} />
               
               <div className="absolute bottom-4 flex gap-3">
                 {pet.traits.map(trait => (
                   <span key={trait} className="px-2 py-0.5 bg-white border border-slate-100 rounded-full text-[9px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
                     {trait}
                   </span>
                 ))}
               </div>
            </div>

            {/* Chat Area */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30">
              <AnimatePresence>
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 italic">
                    <p className="text-sm">Speak to {pet.name} to grow together.</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] px-5 py-3 rounded-[1.5rem] text-sm font-medium shadow-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-blue-500 text-white rounded-tr-none' 
                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-white px-5 py-3 rounded-[1.5rem] rounded-tl-none border border-slate-100">
                      <div className="flex gap-1.5 translate-y-1">
                        <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce delay-100" />
                        <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input bar inside the hub */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <div className="relative max-w-2xl mx-auto">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`Send a message to ${pet.name}...`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-full pl-6 pr-14 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || isTyping}
                  className="absolute right-2 top-1.5 p-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-full transition-all shadow-md active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-slate-800">Pet Settings</h2>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-300">✕</button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={pet.name} 
                    onChange={e => setPet(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-2">Visual Theme</label>
                  <div className="flex gap-3">
                    {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'].map(c => (
                      <button 
                        key={c}
                        onClick={() => setPet(prev => ({ ...prev, color: c }))}
                        className={`w-10 h-10 rounded-full border-4 transition-all ${pet.color === c ? 'border-blue-100 scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                   <button 
                    onClick={triggerEvolution}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all"
                   >
                     <Zap className="w-4 h-4" />
                     Evolve
                   </button>
                   <button 
                    onClick={() => { localStorage.clear(); window.location.reload(); }}
                    className="px-4 py-4 bg-rose-50 text-rose-500 rounded-2xl font-bold hover:bg-rose-100 transition-all"
                   >
                     Reset
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
      `}} />
    </div>
  );
}

function StatBar({ icon, label, value, color, textColor }: { icon: React.ReactNode, label: string, value: number, color: string, textColor: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
        <div className="flex items-center gap-2 text-slate-400">
          {icon}
          {label}
        </div>
        <span className={`${textColor} font-bold`}>{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${color}`} 
        />
      </div>
    </div>
  );
}

