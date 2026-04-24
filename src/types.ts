/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PetState {
  id: string;
  name: string;
  personality: string;
  mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'tired' | 'focused';
  energy: number; // 0-100
  happiness: number; // 0-100
  intelligence: number; // 0-100
  discipline: number; // 0-100 (linked to user habits)
  growthLevel: number; // 1-10
  color: string;
  shape: 'circle' | 'square' | 'blob' | 'star';
  traits: string[];
  lastInteraction: number;
}

export interface Habit {
  id: string;
  text: string;
  completed: boolean;
  type: 'health' | 'productivity' | 'learning' | 'social';
  timestamp: number;
}

export interface InteractionMessage {
  role: 'user' | 'pet';
  content: string;
  timestamp: number;
}
