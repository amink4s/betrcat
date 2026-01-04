/**
 * Leaderboard component
 */
import React from 'react';
import { useStore } from '../../store';

export const Leaderboard: React.FC = () => {
  const { leaderboard, user, userStats } = useStore();

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 p-4">
      <div className="bg-gradient-to-b from-purple-900 to-black border-4 border-cyan-400 rounded-lg p-8 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <h2 className="text-4xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
          🏆 Leaderboard 🏆
        </h2>

        {user && userStats && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg border-2 border-yellow-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.pfpUrl && (
                  <img 
                    src={user.pfpUrl} 
                    alt={user.displayName} 
                    className="w-12 h-12 rounded-full border-2 border-white"
                  />
                )}
                <div>
                  <div className="text-white font-bold text-lg">{user.displayName}</div>
                  <div className="text-yellow-200 text-sm">@{user.username}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold text-2xl">{userStats.highScore}</div>
                <div className="text-yellow-200 text-sm">High Score</div>
                <div className="text-yellow-200 text-xs">{userStats.totalGames} games played</div>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 space-y-2">
          {leaderboard.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No scores yet. Be the first to play!
            </div>
          ) : (
            leaderboard.map((entry, index) => {
              const isCurrentUser = user && entry.fid === user.fid;
              const rankColor = 
                entry.rank === 1 ? 'from-yellow-400 to-yellow-600' :
                entry.rank === 2 ? 'from-gray-300 to-gray-400' :
                entry.rank === 3 ? 'from-orange-400 to-orange-600' :
                'from-gray-700 to-gray-800';

              return (
                <div
                  key={entry.fid}
                  className={`
                    flex items-center justify-between p-3 rounded-lg
                    bg-gradient-to-r ${rankColor}
                    ${isCurrentUser ? 'ring-4 ring-cyan-400' : ''}
                    transition-all hover:scale-102
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      text-2xl font-bold w-10 text-center
                      ${entry.rank <= 3 ? 'text-white' : 'text-gray-300'}
                    `}>
                      {entry.rank === 1 ? '🥇' : 
                       entry.rank === 2 ? '🥈' :
                       entry.rank === 3 ? '🥉' :
                       `#${entry.rank}`}
                    </div>
                    {entry.pfpUrl && (
                      <img 
                        src={entry.pfpUrl} 
                        alt={entry.displayName} 
                        className="w-10 h-10 rounded-full border-2 border-white"
                      />
                    )}
                    <div>
                      <div className={`font-bold ${entry.rank <= 3 ? 'text-white' : 'text-gray-200'}`}>
                        {entry.displayName}
                        {isCurrentUser && <span className="ml-2 text-cyan-300">(You)</span>}
                      </div>
                      <div className={`text-sm ${entry.rank <= 3 ? 'text-white' : 'text-gray-400'}`}>
                        @{entry.username} • {entry.totalGames} games
                      </div>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${entry.rank <= 3 ? 'text-white' : 'text-gray-200'}`}>
                    {entry.highScore}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
