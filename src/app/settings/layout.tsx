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
                className={tabClass('/settings/invoice')}
              >
                Invoice Settings
              </button>
              
              {session.user?.role === 'ADMIN' && (
                <button
                  onClick={() => router.push('/settings/admin')}
                  className={tabClass('/settings/admin')}
                >
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