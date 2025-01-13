'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, game } from '@/services/api';

interface PlayerStats {
  rank: number;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchLeaderboard();
  }, [router]);

  const fetchLeaderboard = async () => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await game.getLeaderboard();
      setPlayers(data);
    } catch (error) {
      console.error('Leaderboard error:', error);
      if (error instanceof Error && error.message === 'Session expired') {
        router.push('/login');
      } else {
        setError('Failed to load leaderboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-purple-500">
            Leaderboard
          </h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-purple-500">
            Leaderboard
          </h1>
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-purple-500">
          Leaderboard
        </h1>
        
        <div className="bg-gray-800 bg-opacity-50 rounded-lg overflow-hidden">
          <div className="grid grid-cols-6 gap-4 p-4 bg-purple-900 bg-opacity-50 font-bold">
            <div className="text-center">Rank</div>
            <div className="col-span-2">Player</div>
            <div className="text-center">Win Rate</div>
            <div className="text-center">Wins/Losses</div>
            <div className="text-center">Games</div>
          </div>
          
          <div className="divide-y divide-gray-700">
            {players.map((player) => (
              <div
                key={player.username}
                className="grid grid-cols-6 gap-4 p-4 hover:bg-gray-700 hover:bg-opacity-50 transition-colors"
              >
                <div className="text-center flex items-center justify-center">
                  {player.rank === 1 && '🥇'}
                  {player.rank === 2 && '🥈'}
                  {player.rank === 3 && '🥉'}
                  {player.rank > 3 && `#${player.rank}`}
                </div>
                <div className="col-span-2 flex items-center">
                  {player.username}
                </div>
                <div className="text-center flex items-center justify-center">
                  <div className="w-full bg-gray-700 rounded-full h-2.5 mr-2">
                    <div
                      className="bg-purple-600 h-2.5 rounded-full"
                      style={{ width: `${player.winRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm">{player.winRate}%</span>
                </div>
                <div className="text-center flex items-center justify-center">
                  <span className="text-green-500">{player.wins}</span>
                  <span className="mx-1">/</span>
                  <span className="text-red-500">{player.losses}</span>
                </div>
                <div className="text-center flex items-center justify-center">
                  {player.gamesPlayed}
                </div>
              </div>
            ))}
          </div>
        </div>

        {players.length === 0 && (
          <div className="text-center mt-8 text-gray-400">
            No players have played any games yet.
          </div>
        )}

        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
} 