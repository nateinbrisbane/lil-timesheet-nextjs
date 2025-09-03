'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns'
import Image from 'next/image'

interface DayData {
  date: string
  start: string
  breakHours: string
  breakMinutes: string  
  finish: string
  total: string
}

interface WeekData {
  weekStart: string
  weeklyTotal: string
  data: Record<string, DayData>
}

const dayNames = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [weekData, setWeekData] = useState<WeekData>({
    weekStart: '',
    weeklyTotal: '0:00',
    data: {}
  })
  const [loading, setLoading] = useState(false)

  const initializeWeek = useCallback(() => {
    const weekStart = format(currentWeek, 'yyyy-MM-dd')
    const newData: Record<string, DayData> = {}
    
    dayNames.forEach((day, index) => {
      const date = addDays(currentWeek, index)
      const isWeekend = index >= 5
      
      newData[day] = {
        date: format(date, 'dd/MM/yyyy'),
        start: isWeekend ? '' : '08:30',
        breakHours: isWeekend ? '' : '0',
        breakMinutes: isWeekend ? '' : '30',
        finish: isWeekend ? '' : '17:00',
        total: '0:00'
      }
    })

    const newWeekData = {
      weekStart,
      weeklyTotal: '0:00',
      data: newData
    }

    setWeekData(newWeekData)
    calculateTotals(newWeekData)
  }, [currentWeek])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    
    initializeWeek()
  }, [status, router, initializeWeek])

  const calculateTotals = (data: WeekData) => {
    let totalMinutes = 0

    const updatedData = { ...data }
    
    dayNames.forEach(day => {
      const dayData = updatedData.data[day]
      if (dayData.start && dayData.finish) {
        const startMinutes = timeToMinutes(dayData.start)
        const finishMinutes = timeToMinutes(dayData.finish)
        const breakMinutes = parseInt(dayData.breakHours || '0') * 60 + parseInt(dayData.breakMinutes || '0')
        
        const dailyMinutes = finishMinutes - startMinutes - breakMinutes
        if (dailyMinutes > 0) {
          totalMinutes += dailyMinutes
          dayData.total = minutesToTime(dailyMinutes)
        } else {
          dayData.total = '0:00'
        }
      } else {
        dayData.total = '0:00'
      }
    })

    updatedData.weeklyTotal = minutesToTime(totalMinutes)
    setWeekData(updatedData)
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}:${mins.toString().padStart(2, '0')}`
  }

  const handleInputChange = (day: string, field: keyof DayData, value: string) => {
    const newWeekData = {
      ...weekData,
      data: {
        ...weekData.data,
        [day]: {
          ...weekData.data[day],
          [field]: value
        }
      }
    }
    calculateTotals(newWeekData)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' 
      ? subWeeks(currentWeek, 1)
      : addWeeks(currentWeek, 1)
    setCurrentWeek(newWeek)
  }

  const saveTimesheet = async () => {
    if (!session) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/timesheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weekData)
      })
      
      if (response.ok) {
        alert('Timesheet saved successfully!')
      } else {
        alert('Failed to save timesheet')
      }
    } catch {
      alert('Error saving timesheet')
    }
    setLoading(false)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Lil Timesheet</h1>
              <p className="text-gray-600 mt-1">Week starting {format(currentWeek, 'dd/MM/yyyy')}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Image
                  src={session.user?.image || '/default-avatar.svg'}
                  alt={session.user?.name || 'User'}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-gray-700">{session.user?.name}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigateWeek('prev')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Previous Week
            </button>
            <div className="text-lg font-semibold text-gray-700">
              {format(currentWeek, 'dd/MM/yyyy')} - {format(addDays(currentWeek, 6), 'dd/MM/yyyy')}
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next Week →
            </button>
          </div>
        </div>

        {/* Timesheet Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Day</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Start Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Break</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Finish Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dayNames.map((day, index) => (
                  <tr key={day} className={index >= 5 ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-3 font-medium text-gray-900">{dayLabels[index]}</td>
                    <td className="px-4 py-3 text-gray-700">{weekData.data[day]?.date}</td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={weekData.data[day]?.start || ''}
                        onChange={(e) => handleInputChange(day, 'start', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 items-center">
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={weekData.data[day]?.breakHours || ''}
                          onChange={(e) => handleInputChange(day, 'breakHours', e.target.value)}
                          className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-500">h</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={weekData.data[day]?.breakMinutes || ''}
                          onChange={(e) => handleInputChange(day, 'breakMinutes', e.target.value)}
                          className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-500">m</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={weekData.data[day]?.finish || ''}
                        onChange={(e) => handleInputChange(day, 'finish', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-900">{weekData.data[day]?.total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right font-semibold text-gray-900">
                    Weekly Total:
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-lg text-blue-600">
                    {weekData.weeklyTotal}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={saveTimesheet}
            disabled={loading}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Timesheet'}
          </button>
        </div>
      </div>
    </div>
  )
}
