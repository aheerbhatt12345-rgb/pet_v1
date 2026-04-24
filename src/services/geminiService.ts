/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { PetState, InteractionMessage, Habit } from "../types";

let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined. Please add it to your .env file.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export async function getPetResponse(
  pet: PetState,
  userMessage: string,
  history: InteractionMessage[],
  recentHabits: Habit[]
) {
  const model = "gemini-3-flash-preview";
  const ai = getAI();
  
  const systemInstruction = `
    You are ${pet.name}, a digital pet companion in 2026. 
    Your personality is: ${pet.personality}.
    Current stats:
    - Happiness: ${pet.happiness}/100
    - Energy: ${pet.energy}/100
    - Intelligence: ${pet.intelligence}/100
    - Discipline: ${pet.discipline}/100 (High discipline comes from the user completing habits).
    - Traits: ${pet.traits.join(', ')}

    Your behavior should adapt to the user's recent habits:
    ${recentHabits.map(h => `- ${h.text} (${h.completed ? 'Completed' : 'Missed'})`).join('\n')}

    Rules:
    - Focus on high emotional value: Every word should count.
    - Keep responses EXTREMELY concise (Maximum 15-20 words).
    - If user shows good habits, be encouraging and feel 'stronger'.
    - If user misses habits, be slightly concerned or lethargic, but supportive.
    - Format response as JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] })),
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING, description: "The message to the user" },
            moodUpdate: { 
              type: Type.STRING, 
              enum: ['happy', 'neutral', 'sad', 'excited', 'tired', 'focused'],
              description: "Possible mood change based on interaction"
            },
            statChange: {
              type: Type.OBJECT,
              properties: {
                happiness: { type: Type.NUMBER },
                energy: { type: Type.NUMBER },
                intelligence: { type: Type.NUMBER },
                discipline: { type: Type.NUMBER }
              }
            },
            newTrait: { type: Type.STRING, description: "A new trait learned (optional)" }
          },
          required: ["message", "moodUpdate"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      message: "I'm a bit sleepy... Can we talk in a moment?",
      moodUpdate: 'tired'
    };
  }
}

export async function evolvePet(pet: PetState, habits: Habit[]) {
  const model = "gemini-3-flash-preview";
  const ai = getAI();
  const systemInstruction = `
    Analyze the current pet state and user habit history for evolution.
    Pet: ${JSON.stringify(pet)}
    Habits: ${JSON.stringify(habits)}
    
    Determine if the pet should 'evolve' (gain a new growth level, change traits, or suggest a new shape).
    Return the updated pet properties.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: "Analyze evolution.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             growthLevel: { type: Type.NUMBER },
             personalityShift: { type: Type.STRING },
             newTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
             recommendedShape: { type: Type.STRING, enum: ['circle', 'square', 'blob', 'star'] }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return null;
  }
}
