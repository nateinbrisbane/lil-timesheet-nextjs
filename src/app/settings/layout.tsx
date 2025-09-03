'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (!session) {
    return <div className="p-8">Please log in to access settings.</div>;
  }

  const isActive = (path: string) => pathname === path;

  const tabClass = (path: string) => 
    `py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ease-in-out ${
      isActive(path)
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
        
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => router.push('/settings/invoice')}
                className={`flex items-center gap-2 ${tabClass('/settings/invoice')}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Invoice Settings
              </button>
              
              {session.user?.role === 'ADMIN' && (
                <button
                  onClick={() => router.push('/settings/admin')}
                  className={`flex items-center gap-2 ${tabClass('/settings/admin')}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Admin Settings
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        {children}
      </div>
    </div>
  );
}