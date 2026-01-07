/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { create } from 'zustand';
import { GameStatus, RUN_SPEED_BASE, TARGET_WORD } from './types';

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
}

interface UserStats {
  totalGames: number;
  highScore: number;
  completions: number;
}

interface LeaderboardEntry {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  highScore: number;
  totalGames: number;
  rank: number;
}

interface GameState {
  status: GameStatus;
  score: number;
  lives: number;
  maxLives: number;
  speed: number;
  collectedLetters: number[]; 
  laneCount: number;
  distance: number;
  elapsedMs: number;
  playedToday: boolean;
  
  // Farcaster User Data
  user: FarcasterUser | null;
  userStats: UserStats | null;
  leaderboard: LeaderboardEntry[];
  isAuthenticated: boolean;
  isLoading: boolean;
  
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
  setUser: (user: FarcasterUser, stats: UserStats) => void;
  fetchLeaderboard: () => Promise<void>;
  recordGameSession: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const useStore = create<GameState>((set, get) => ({
  status: GameStatus.MENU,
  score: 0,
  lives: 7,
  maxLives: 7,
  speed: 0,
  collectedLetters: [],
  laneCount: 3,
  distance: 0,
  elapsedMs: 0,
  playedToday: false,
  
  // Farcaster User Data
  user: null,
  userStats: null,
  leaderboard: [],
  isAuthenticated: false,
  isLoading: false,
  
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
      elapsedMs: 0,
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
      elapsedMs: 0,
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
      // Record game session when game ends
      setTimeout(() => get().recordGameSession(), 100);
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
      
      // Speed up significantly per letter to maintain challenge
      const nextSpeed = speed + (RUN_SPEED_BASE * 0.40);

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
        // Record game session when player wins
        setTimeout(() => get().recordGameSession(), 100);
      }
    }
  },

  setStatus: (status) => set({ status }),

  setUser: (user, stats) => set({ 
    user, 
    userStats: stats, 
    isAuthenticated: true 
  }),

  setLoading: (loading) => set({ isLoading: loading }),

  fetchLeaderboard: async () => {
    try {
      const { user } = get();
      const url = user 
        ? `${API_BASE_URL}/api/leaderboard?limit=100&fid=${user.fid}`
        : `${API_BASE_URL}/api/leaderboard?limit=100`;
      
      console.log('[Store] Fetching leaderboard from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        console.error('[Store] Leaderboard fetch failed with status:', response.status);
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await response.json();
      console.log('[Store] Leaderboard fetched:', data.leaderboard?.length || 0, 'entries');
      set({ leaderboard: data.leaderboard });
    } catch (error) {
      console.error('[Store] Error fetching leaderboard:', error);
    }
  },

  recordGameSession: async () => {
    const { user, score, distance, collectedLetters, status } = get();
    
    if (!user) {
      console.warn('[Store] Cannot record game session: user not authenticated');
      return;
    }

    try {
      console.log('[Store] Recording game session:', {
        fid: user.fid,
        score,
        distance,
        lettersCollected: collectedLetters.length,
        completed: status === GameStatus.VICTORY
      });
      
      const response = await fetch(`${API_BASE_URL}/api/game-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: user.fid,
          score,
          distance,
          collectedLetters: TARGET_WORD.filter((_, i) => collectedLetters.includes(i)),
          completed: status === GameStatus.VICTORY
        })
      });

      if (!response.ok) {
        console.error('[Store] Failed to record game session, status:', response.status);
        throw new Error('Failed to record game session');
      }
      
      console.log('[Store] Game session recorded successfully');
      
      // Refresh user stats and leaderboard after recording
      console.log('[Store] Refreshing user stats...');
      const authResponse = await fetch(`${API_BASE_URL}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: user.fid,
          username: user.username,
          displayName: user.displayName,
          pfpUrl: user.pfpUrl
        })
      });

      if (authResponse.ok) {
        const data = await authResponse.json();
        console.log('[Store] User stats refreshed:', data.stats);
        set({ userStats: data.stats });
      }

      // Refresh leaderboard
      console.log('[Store] Refreshing leaderboard...');
      await get().fetchLeaderboard();
    } catch (error) {
      console.error('[Store] Error recording game session:', error);
    }
  },
}));
