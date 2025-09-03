'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Navigation() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (!session) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm mb-3">
      <div className="flex justify-between items-center p-3 border-b border-gray-100">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 text-2xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
          >
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Lil Timesheet
          </button>
        </div>
        
        {/* User Profile & Logout */}
        <div className="flex items-center gap-4">
          {/* User Profile - Clickable to Settings */}
          <button
            onClick={() => router.push('/settings')}
            className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer group border border-gray-200 hover:border-blue-300"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center transition-all duration-200 group-hover:bg-blue-200 group-hover:scale-105 border-2 border-gray-200 group-hover:border-blue-300">
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
              <span className="text-sm font-medium text-gray-900 leading-tight group-hover:text-blue-700 transition-colors">
                {session.user?.name || 'User'}
              </span>
              <span className="text-xs text-gray-500 leading-tight group-hover:text-blue-600 transition-colors">
                Settings & Account
              </span>
            </div>
            <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </button>
          
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 bg-gray-50 hover:bg-red-50 px-3 py-2 rounded-md transition-all duration-200 ease-in-out border border-gray-200 hover:border-red-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}