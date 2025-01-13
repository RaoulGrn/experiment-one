'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/services/api';
import Navbar from '@/components/Navbar';

const publicPaths = ['/login', '/register'];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isPublicPath = publicPaths.includes(pathname);
      const isAuthenticated = auth.isAuthenticated();

      // Allow access to public paths even when authenticated
      if (isPublicPath) {
        setIsLoading(false);
        return;
      }

      // Redirect to login if not authenticated and trying to access protected path
      if (!isAuthenticated && !isPublicPath) {
        router.replace('/login');
        return;
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white">
      {!publicPaths.includes(pathname) && <Navbar />}
      {children}
    </div>
  );
} 