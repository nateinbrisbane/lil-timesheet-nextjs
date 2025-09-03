'use client'

import { signIn, getSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push('/')
      }
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Lil Timesheet</h1>
          <p className="text-gray-600">Simple time tracking for everyone</p>
        </div>

        <div className="mb-8">
          <p className="text-gray-700 text-center">
            Track your work hours with ease. Sign in with your Google account to get started.
          </p>
        </div>

        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Track weekly timesheets Monday to Sunday
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Automatic time calculations
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Secure cloud data storage
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Access from any device
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Privacy-focused - your data stays yours
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}