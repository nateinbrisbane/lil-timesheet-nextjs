'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface User {
  id: string
  name: string | null
  email: string
  role: 'USER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  _count: {
    timesheets: number
  }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else if (response.status === 403) {
        router.push('/')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    
    fetchUsers()
  }, [status, router, fetchUsers])


  const updateUser = async (userId: string, field: 'role' | 'status', value: string) => {
    setUpdating(userId)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          [field]: value 
        })
      })

      if (response.ok) {
        await fetchUsers()
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
    setUpdating(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-red-100 text-red-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    return role === 'ADMIN' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">User Management & System Overview</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Timesheet
              </button>
              <div className="flex items-center gap-2">
                <Image
                  src={session?.user?.image || '/default-avatar.svg'}
                  alt={session?.user?.name || 'User'}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-gray-700">{session?.user?.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{users.length}</div>
            <div className="text-gray-600">Total Users</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.status === 'ACTIVE').length}
            </div>
            <div className="text-gray-600">Active Users</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">
              {users.filter(u => u.status === 'PENDING').length}
            </div>
            <div className="text-gray-600">Pending Users</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {users.reduce((sum, u) => sum + u._count.timesheets, 0)}
            </div>
            <div className="text-gray-600">Total Timesheets</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">User</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Timesheets</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Joined</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium text-gray-900">{user.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => updateUser(user.id, 'role', e.target.value)}
                        disabled={updating === user.id}
                        className="text-sm rounded-full px-3 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.status}
                        onChange={(e) => updateUser(user.id, 'status', e.target.value)}
                        disabled={updating === user.id}
                        className="text-sm rounded-full px-3 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user._count.timesheets}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}