'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      // Auto-redirect to invoice settings by default
      router.push('/settings/invoice');
    }
  }, [session, router]);

  if (!session) {
    return <div className="p-8">Please log in to access settings.</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
      
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors cursor-pointer">
          <div onClick={() => router.push('/settings/invoice')}>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Invoice Settings</h2>
            <p className="text-gray-600">
              Configure your contractor details, manage invoice templates, and set up client-specific billing rates.
            </p>
          </div>
        </div>

        {session.user?.role === 'ADMIN' && (
          <div className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors cursor-pointer">
            <div onClick={() => router.push('/settings/admin')}>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Admin Settings</h2>
              <p className="text-gray-600">
                Manage users, control access permissions, and configure system-wide settings.
              </p>
            </div>
          </div>
        )}

        <div className="border border-gray-200 rounded-lg p-6 opacity-50">
          <h2 className="text-xl font-semibold text-gray-400 mb-2">Profile Settings</h2>
          <p className="text-gray-400">
            Coming soon - Manage your profile information and preferences.
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 opacity-50">
          <h2 className="text-xl font-semibold text-gray-400 mb-2">Notification Settings</h2>
          <p className="text-gray-400">
            Coming soon - Configure email notifications and reminders.
          </p>
        </div>
      </div>
    </div>
  );
}