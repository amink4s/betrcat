/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { create } from 'zustand';
import { GameStatus, RUN_SPEED_BASE, TARGET_WORD } from './types';

interface GameState {
  status: GameStatus;
  score: number;
  lives: number;
  maxLives: number;
  speed: number;
  collectedLetters: number[]; 
  laneCount: number;
  distance: number;
  playedToday: boolean;
  
  // Inventory / Abilities
  hasDoubleJump: boolean;
  isImmortalityActive: boolean;

  // Actions
  startGame: () => void;
  restartGame: () => void;
  takeDamage: () => void;
  collectGem: (value: number) => void;
  collectLetter: (index: number) => void;
  setStatus: (status: GameStatus) => void;
  checkDailyStatus: () => void;
}

export const useStore = create<GameState>((set, get) => ({
  status: GameStatus.MENU,
  score: 0,
  lives: 7, // Updated to 7 lives
  maxLives: 7,
  speed: 0,
  collectedLetters: [],
  laneCount: 3,
  distance: 0,
  playedToday: false,
  
  hasDoubleJump: false,
  isImmortalityActive: false,

  checkDailyStatus: () => {
    const lastPlayed = localStorage.getItem('betr_last_played');
    const today = new Date().toDateString();
    if (lastPlayed === today) {
      set({ playedToday: true });
    }
  },

  startGame: () => {
    const today = new Date().toDateString();
    localStorage.setItem('betr_last_played', today);

    set({ 
      status: GameStatus.PLAYING, 
      score: 0, 
      lives: 7, 
      maxLives: 7,
      speed: RUN_SPEED_BASE,
      collectedLetters: [],
      laneCount: 3,
      distance: 0,
      playedToday: true,
      hasDoubleJump: false,
      isImmortalityActive: false
    });
  },

  restartGame: () => {
    set({ 
      status: GameStatus.PLAYING, 
      score: 0, 
      lives: 7, 
      speed: RUN_SPEED_BASE,
      collectedLetters: [],
      distance: 0,
      laneCount: 3,
      isImmortalityActive: false
    });
  },

  takeDamage: () => {
    const { lives, isImmortalityActive, status } = get();
    if (isImmortalityActive || status !== GameStatus.PLAYING) return; 

    if (lives > 1) {
      set({ lives: lives - 1 });
    } else {
      set({ lives: 0, status: GameStatus.GAME_OVER, speed: 0 });
    }
  },

  collectGem: (value) => set((state) => ({ 
    score: state.score + value
  })),

  collectLetter: (index) => {
    const { collectedLetters, speed, status } = get();
    if (status !== GameStatus.PLAYING) return;
    
    if (!collectedLetters.includes(index)) {
      const newLetters = [...collectedLetters, index];
      
      // Speed up slightly per letter to maintain challenge
      const nextSpeed = speed + (RUN_SPEED_BASE * 0.15);

      set({ 
        collectedLetters: newLetters,
        speed: nextSpeed
      });

      // Win condition: All 4 letters collected
      if (newLetters.length === TARGET_WORD.length) {
        set({
          status: GameStatus.VICTORY,
          speed: 0,
          score: get().score + 5000
        });
      }
    }
  },

  setStatus: (status) => set({ status }),
}));
