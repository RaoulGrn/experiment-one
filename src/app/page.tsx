'use client';

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth } from '@/services/api';

interface User {
  username: string;
  email: string;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check authentication status on mount and after login
    const checkAuth = () => {
      const currentUser = auth.getUser();
      setUser(currentUser);
    };

    checkAuth();

    // Listen for storage changes (login/logout events)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'token') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="grid grid-rows-[1fr_auto] min-h-screen">
      <main className="flex flex-col items-center justify-center p-8 gap-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4">Welcome to the Arena!</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Challenge players worldwide in the ultimate game of Rock Paper Scissors.
            Climb the leaderboards and become the champion!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          <div className="p-6 rounded-xl bg-gray-800 border border-gray-700 hover:border-purple-500 transition-colors">
            <h3 className="text-xl font-bold mb-2">Quick Match</h3>
            <p className="text-gray-400 mb-4">Find an opponent and start playing immediately</p>
            {user ? (
              <Link 
                href="/play"
                className="block w-full text-center py-3 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors"
              >
                Play Now
              </Link>
            ) : (
              <Link 
                href="/login"
                className="block w-full text-center py-3 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors"
              >
                Login to Play
              </Link>
            )}
          </div>

          <div className="p-6 rounded-xl bg-gray-800 border border-gray-700 hover:border-purple-500 transition-colors">
            <h3 className="text-xl font-bold mb-2">Leaderboards</h3>
            <p className="text-gray-400 mb-4">Check the top players and your ranking</p>
            {user ? (
              <Link 
                href="/leaderboard"
                className="block w-full text-center py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                View Rankings
              </Link>
            ) : (
              <Link 
                href="/login"
                className="block w-full text-center py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Login to View
              </Link>
            )}
          </div>
        </div>
      </main>

      <footer className="p-6 text-center border-t border-gray-700">
        <p className="text-gray-400">© 2024 Rock Paper Scissors Arena. All rights reserved.</p>
      </footer>
    </div>
  );
}
