/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect } from 'react';
import { Heart, User, ShieldCheck } from 'lucide-react';
import { useStore } from '../../store';
import { GameStatus, CASINO_COLORS, TARGET_WORD } from '../../types';
import { audio } from '../System/Audio';

export const HUD: React.FC = () => {
  const { score, lives, maxLives, collectedLetters, status, restartGame, startGame, playedToday, checkDailyStatus } = useStore();

  useEffect(() => {
    checkDailyStatus();
  }, []);

  if (status === GameStatus.MENU) {
      return (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-[100] bg-black text-white p-8 pointer-events-auto">
              <div className="absolute top-8 left-8 flex items-center space-x-2 text-cyan-400 opacity-80">
                  <User className="w-5 h-5" />
                  <span className="font-mono text-sm tracking-widest uppercase">@farcaster_user</span>
              </div>
              
              <h1 className="text-7xl font-black mb-2 font-cyber text-cyan-400 drop-shadow-[0_0_20px_cyan]">BETR CAT</h1>
              <p className="text-xl mb-12 tracking-[0.3em] text-red-500 font-bold uppercase">Collect B-E-T-R to Win</p>
              
              {playedToday ? (
                <div className="flex flex-col items-center space-y-6">
                    <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-2xl flex flex-col items-center text-center max-w-sm">
                        <ShieldCheck className="w-12 h-12 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold text-red-400 uppercase mb-2">Daily Limit Reached</h2>
                        <p className="text-gray-400 text-sm">You've already taken your shot today. Come back tomorrow to climb the leaderboard!</p>
                    </div>
                    <button 
                      onClick={() => { audio.init(); startGame(); }}
                      className="px-10 py-3 border-2 border-cyan-500 text-cyan-500 rounded-full hover:bg-cyan-500 hover:text-black transition-all font-bold"
                    >
                        DEBUG: PLAY AGAIN
                    </button>
                </div>
              ) : (
                <button 
                  onClick={() => { audio.init(); startGame(); }}
                  className="px-16 py-5 bg-white text-black font-black text-3xl rounded-full hover:scale-110 active:scale-95 transition-all shadow-[0_0_40px_#fff]"
                >
                    ENTER ARENA
                </button>
              )}
              
              <div className="mt-12 text-gray-600 text-xs uppercase tracking-widest">Powered by BETR x Farcaster</div>
          </div>
      );
  }

  if (status === GameStatus.GAME_OVER) {
    return (
        <div className="absolute inset-0 bg-black/98 z-[100] text-white flex flex-col items-center justify-center p-4 pointer-events-auto">
            <h1 className="text-7xl font-black text-red-600 mb-4 font-cyber animate-pulse">GAME OVER</h1>
            <div className="text-4xl mb-12 font-mono text-cyan-400">SCORE: {score.toLocaleString()}</div>
            <div className="flex space-x-4">
                <button onClick={restartGame} className="px-10 py-4 bg-white text-black font-black rounded-full hover:bg-gray-200 transition-all">RETRY SESSION</button>
                <button onClick={() => window.location.reload()} className="px-10 py-4 border-2 border-gray-700 text-gray-500 font-bold rounded-full">EXIT</button>
            </div>
        </div>
    );
  }

  if (status === GameStatus.VICTORY) {
    return (
        <div className="absolute inset-0 bg-cyan-500 z-[100] text-black flex flex-col items-center justify-center p-4 pointer-events-auto">
            <h1 className="text-8xl font-black mb-4 font-cyber uppercase italic text-center">MISSION COMPLETE</h1>
            <div className="text-3xl mb-12 font-mono font-bold text-center">ALL LETTERS COLLECTED! SCORE: {score.toLocaleString()}</div>
            <button onClick={() => window.location.reload()} className="px-16 py-6 bg-black text-white font-black rounded-full text-2xl shadow-2xl">SUBMIT TO FARCASTER</button>
        </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none p-6 md:p-10 z-50 flex flex-col justify-between">
        <div className="flex justify-between items-start">
            <div className="flex flex-col">
                <span className="text-xs text-cyan-600 font-bold uppercase tracking-widest mb-1">Total Payout</span>
                <div className="text-5xl font-black text-white font-cyber drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                    {score.toLocaleString()}
                </div>
            </div>
            {/* Reduced heart size to fit 7 comfortably */}
            <div className="flex space-x-1.5 bg-black/40 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                {[...Array(maxLives)].map((_, i) => (
                    <Heart key={i} className={`w-6 h-6 md:w-8 md:h-8 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-900'}`} />
                ))}
            </div>
        </div>

        <div className="absolute top-24 left-1/2 -translate-x-1/2 flex space-x-3">
            {TARGET_WORD.map((char, idx) => {
                const collected = collectedLetters.includes(idx);
                return (
                    <div 
                        key={idx}
                        className={`w-12 h-16 border-2 flex items-center justify-center font-black text-3xl rounded-xl transition-all duration-300
                            ${collected ? 'bg-white text-black scale-110 rotate-3' : 'border-white/10 text-white/10'}`}
                        style={{ 
                            borderColor: collected ? CASINO_COLORS[idx] : undefined, 
                            boxShadow: collected ? `0 0 25px ${CASINO_COLORS[idx]}` : 'none' 
                        }}
                    >
                        {char}
                    </div>
                );
            })}
        </div>

        <div className="flex justify-end items-end text-cyan-500 font-black text-xl italic uppercase tracking-tighter">
            <div className="bg-black/40 px-4 py-2 rounded-lg border-r-4 border-red-500">HI-STAKES MODE</div>
        </div>
    </div>
  );
};
