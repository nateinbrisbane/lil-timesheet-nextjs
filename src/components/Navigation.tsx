'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Navigation() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (!session) return null;

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const navLinkClass = (path: string) => 
    `text-sm font-medium px-3 py-1 rounded-md underline decoration-2 underline-offset-4 transition-all duration-200 ease-in-out transform hover:scale-105 ${
      isActive(path)
        ? 'text-blue-700 bg-blue-50 border-blue-300'
        : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
    }`;

  return (
    <div className="bg-white rounded-lg shadow-sm mb-3">
      <div className="flex justify-between items-center p-3 border-b border-gray-100">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push('/')}
            className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
          >
            Lil Timesheet
          </button>
          
          <nav className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className={navLinkClass('/')}
            >
              Timesheet
            </button>
            
            <button
              onClick={() => router.push('/settings')}
              className={navLinkClass('/settings')}
            >
              Settings
            </button>
            
            {session.user?.role === 'ADMIN' && (
              <button
                onClick={() => router.push('/settings/admin')}
                className="text-sm font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-3 py-1 rounded-md underline decoration-2 underline-offset-4 transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                Admin Panel
              </button>
            )}
          </nav>
        </div>
        
        {/* User Profile & Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 hover:bg-gray-50 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center transition-all duration-200 hover:bg-blue-200 hover:scale-105 border-2 border-gray-200 hover:border-blue-300">
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user?.name || 'User'}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-blue-700 text-sm font-medium">${session.user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>`;
                    }
                  }}
                />
              ) : (
                <span className="text-blue-700 text-sm font-medium">
                  {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 leading-tight">
                {session.user?.name || 'User'}
              </span>
              <span className="text-xs text-gray-500 leading-tight">
                {session.user?.email}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => signOut()}
            className="text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-md underline decoration-2 underline-offset-4 transition-all duration-200 ease-in-out transform hover:scale-105"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}