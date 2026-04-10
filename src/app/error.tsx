'use client';

import { useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { logout } = useAuth();
  
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Next.js Dashboard Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-slate-400 mb-6 max-w-md">
        {error.message || 'An unexpected error occurred while rendering this page.'}
      </p>
      
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="btn-primary"
        >
          Try again
        </button>
        <button
          onClick={() => {
            sessionStorage.clear();
            localStorage.clear();
            logout();
          }}
          className="btn bg-white/5 text-slate-300 hover:bg-white/10"
        >
          <LogOut size={16} /> Logout / Clear Session
        </button>
      </div>
    </div>
  );
}
