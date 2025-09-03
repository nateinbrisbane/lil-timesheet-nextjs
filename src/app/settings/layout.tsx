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
    `px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out ${
      isActive(path)
        ? 'bg-blue-600 text-white'
        : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
    }`;

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
        
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg inline-flex">
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
          </div>
        </div>

        {/* Content Area */}
        {children}
      </div>
    </div>
  );
}