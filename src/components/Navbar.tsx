'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth } from '@/services/api';
import { FaUser, FaCog } from 'react-icons/fa';
import ProfileSettings from './ProfileSettings';

export default function Navbar() {
  const router = useRouter();
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const user = auth.getUser();

  const handleLogout = () => {
    auth.logout();
    router.push('/login');
  };

  return (
    <>
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-purple-500">
            RPS Game
          </Link>

          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="relative group">
                  {user.avatarUrl ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}${user.avatarUrl}`}
                        alt="Profile avatar"
                        width={40}
                        height={40}
                        className="cursor-pointer"
                        onClick={() => setShowProfileSettings(true)}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowProfileSettings(true)}
                      className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center hover:bg-purple-700 transition-colors"
                    >
                      <FaUser size={20} />
                    </button>
                  )}
                  <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-2">
                      <button
                        onClick={() => setShowProfileSettings(true)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-600 rounded flex items-center space-x-2"
                      >
                        <FaCog size={16} />
                        <span>Profile Settings</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 hover:bg-gray-600 rounded text-red-400 hover:text-red-300"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
                <span className="font-semibold">{user.username}</span>
              </div>
            </div>
          ) : (
            <div className="space-x-4">
              <Link
                href="/login"
                className="text-purple-500 hover:text-purple-400 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </nav>

      <ProfileSettings
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
      />
    </>
  );
} 