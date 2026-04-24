/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { PetState } from '../types';
import { useMemo } from 'react';

interface Props {
  pet: PetState;
  onClick?: () => void;
}

export default function AuraPet({ pet, onClick }: Props) {
  const { mood, color, shape } = pet;

  const eyes = useMemo(() => {
    switch (mood) {
      case 'happy': return 'M 35 45 Q 40 40 45 45 M 55 45 Q 60 40 65 45'; 
      case 'sad': return 'M 35 50 Q 40 55 45 50 M 55 50 Q 60 55 65 50';
      case 'tired': return 'M 35 48 H 45 M 55 48 H 65';
      case 'excited': return 'M 38 45 A 3 3 0 1 1 42 45 M 58 45 A 3 3 0 1 1 62 45';
      case 'focused': return 'M 35 45 H 45 M 55 45 H 65';
      default: return 'M 38 48 A 2 2 0 1 1 42 48 M 58 48 A 2 2 0 1 1 62 48';
    }
  }, [mood]);

  const mouth = useMemo(() => {
    switch (mood) {
      case 'happy': return 'M 40 65 Q 50 75 60 65';
      case 'sad': return 'M 40 70 Q 50 60 60 70';
      case 'excited': return 'M 40 65 Q 50 85 60 65 L 40 65';
      case 'tired': return 'M 45 68 H 55';
      default: return 'M 45 70 Q 50 72 55 70';
    }
  }, [mood]);

  const shapePath = useMemo(() => {
    switch (shape) {
      case 'square': return 'M 20 20 H 80 V 80 H 20 Z';
      case 'star': return 'M 50 10 L 61 40 L 90 40 L 66 60 L 76 90 L 50 70 L 24 90 L 34 60 L 10 40 L 39 40 Z';
      case 'blob': return 'M 50 10 C 80 10 90 40 90 60 C 90 100 20 100 10 60 C 10 40 20 10 50 10';
      default: return 'M 50 50 m -40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0';
    }
  }, [shape]);

  return (
    <motion.div
      id="pet-container"
      className="relative cursor-pointer flex items-center justify-center w-48 h-48 mx-auto"
      animate={{
        scale: mood === 'excited' ? [1, 1.05, 1] : 1,
        rotate: mood === 'focused' ? [0, 1, -1, 0] : 0
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-50 to-white rounded-full opacity-40 mix-blend-multiply blur-2xl animate-pulse" />
      
      <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-sm">
        <motion.path
          d={shapePath}
          fill={color}
          className="opacity-95"
          initial={false}
          animate={{ d: shapePath }}
          transition={{ duration: 0.8, type: 'spring' }}
          style={{ filter: `drop-shadow(0 4px 6px ${color}33)` }}
        />
        
        {/* Face */}
        <motion.path
          d={eyes}
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          animate={{ d: eyes }}
          transition={{ duration: 0.3 }}
        />
        <motion.path
          d={mouth}
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          animate={{ d: mouth }}
          transition={{ duration: 0.3 }}
        />

        {/* Reflections */}
        <ellipse cx="30" cy="30" rx="10" ry="6" fill="white" fillOpacity="0.1" transform="rotate(-45 30 30)" />
        <circle cx="70" cy="70" r="5" fill="white" fillOpacity="0.05" />

        {/* Floating particles if excited */}
        {mood === 'excited' && (
           <motion.g animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
              <circle cx="20" cy="20" r="2" fill="white" />
              <circle cx="80" cy="30" r="2" fill="white" />
              <circle cx="50" cy="5" r="2" fill="white" />
           </motion.g>
        )}
      </svg>
      
      {/* Name Label */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="px-3 py-1 bg-white shadow-sm border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 tracking-widest uppercase">
          {pet.name} · GEN {pet.growthLevel}
        </span>
      </div>
    </motion.div>
  );
}
