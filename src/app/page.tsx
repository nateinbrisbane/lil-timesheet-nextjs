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
  const [dataExists, setDataExists] = useState(false)
  const [loadingWeekData, setLoadingWeekData] = useState(false)

  const timeToMinutes = useCallback((time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }, [])

  const minutesToTime = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}:${mins.toString().padStart(2, '0')}`
  }, [])

  const calculateTotals = useCallback((data: WeekData) => {
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
  }, [timeToMinutes, minutesToTime])

  const loadWeekData = useCallback(async () => {
    if (!session) return
    
    setLoadingWeekData(true)
    const weekStart = format(currentWeek, 'yyyy-MM-dd')
    
    try {
      // Try to fetch existing data from database
      const response = await fetch(`/api/timesheet?weekStart=${weekStart}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // Data exists in database - use it
          const existingData = {
            weekStart: result.data.weekStart,
            weeklyTotal: result.data.weeklyTotal,
            data: result.data.data
          }
          setWeekData(existingData)
          setDataExists(true)
          calculateTotals(existingData)
          setLoadingWeekData(false)
          return
        }
      }
      
      // No data exists - initialize with defaults
      initializeWeekDefaults(weekStart)
      setDataExists(false)
    } catch (error) {
      console.error('Error loading week data:', error)
      // Fallback to defaults on error
      initializeWeekDefaults(weekStart)
      setDataExists(false)
    }
    
    setLoadingWeekData(false)
  }, [currentWeek, session, calculateTotals])

  const initializeWeekDefaults = useCallback((weekStart: string) => {
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
  }, [currentWeek, calculateTotals])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    
    // Check if user is inactive
    if (session?.user?.status === 'INACTIVE') {
      alert('Your account has been deactivated. Please contact an administrator.')
      signOut({ callbackUrl: '/login' })
      return
    }
    
    // Check if user is pending approval
    if (session?.user?.status === 'PENDING') {
      alert('Your account is pending approval. Please contact an administrator.')
      signOut({ callbackUrl: '/login' })
      return
    }
    
    loadWeekData()
  }, [status, router, session, loadWeekData])

  // Load data when week changes
  useEffect(() => {
    if (session) {
      loadWeekData()
    }
  }, [currentWeek, session, loadWeekData])


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

  const jumpToWeek = (weeksOffset: number) => {
    const newWeek = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weeksOffset)
    setCurrentWeek(newWeek)
  }

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(event.target.value)
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    setCurrentWeek(weekStart)
  }

  const hasWorkingHours = useCallback(() => {
    return Object.values(weekData.data).some(day => {
      return day.start && day.finish && day.start !== '' && day.finish !== ''
    })
  }, [weekData])

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
        setDataExists(true) // Mark as saved
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
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-3">
        {/* Week Info */}
        <div className="mb-3 flex justify-between items-center">
          <p className="text-gray-600 text-sm">Week starting {format(currentWeek, 'dd/MM/yyyy')}</p>
          <div className="flex items-center gap-2">
            {loadingWeekData && (
              <span className="text-blue-600 text-sm">Loading...</span>
            )}
            {!loadingWeekData && (
              <span className={`text-sm px-2 py-1 rounded-full ${
                dataExists 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {dataExists ? '✓ Saved in database' : '⚠ Not saved yet'}
              </span>
            )}
          </div>
        </div>

        {/* Week Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
          {/* Main Navigation */}
          <div className="flex justify-between items-center mb-3">
            <button
              onClick={() => navigateWeek('prev')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
            >
              ← Previous
            </button>
            <div className="text-lg font-semibold text-gray-700">
              {format(currentWeek, 'dd/MM/yyyy')} - {format(addDays(currentWeek, 6), 'dd/MM/yyyy')}
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
            >
              Next →
            </button>
          </div>
          
          {/* Quick Navigation */}
          <div className="border-t pt-3">
            <div className="flex flex-wrap justify-center gap-2 mb-3">
              <button
                onClick={() => jumpToWeek(-4)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                4 weeks ago
              </button>
              <button
                onClick={() => jumpToWeek(-2)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                2 weeks ago
              </button>
              <button
                onClick={() => jumpToWeek(-1)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Last week
              </button>
              <button
                onClick={() => jumpToWeek(0)}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors font-medium"
              >
                This week
              </button>
              <button
                onClick={() => jumpToWeek(1)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Next week
              </button>
              <button
                onClick={() => jumpToWeek(2)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                2 weeks ahead
              </button>
            </div>
            
            {/* Date Picker */}
            <div className="flex justify-center items-center gap-3">
              <label className="text-sm text-gray-600">Jump to specific week:</label>
              <input
                type="date"
                onChange={handleDateChange}
                value={format(currentWeek, 'yyyy-MM-dd')}
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Timesheet Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800 border-r border-gray-200">Day</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800 border-r border-gray-200">Date</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800 border-r border-gray-200">Start Time</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800 border-r border-gray-200">Break</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800 border-r border-gray-200">Finish Time</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dayNames.map((day, index) => (
                  <tr key={day} className={`${index >= 5 ? 'bg-blue-50' : 'bg-white'} hover:bg-gray-50 transition-colors`}>
                    <td className="px-4 py-2 font-semibold text-gray-900 border-r border-gray-200 bg-gray-50">{dayLabels[index]}</td>
                    <td className="px-4 py-2 text-gray-700 border-r border-gray-200 font-medium">{weekData.data[day]?.date}</td>
                    <td className="px-4 py-2 border-r border-gray-200">
                      <input
                        type="time"
                        value={weekData.data[day]?.start || ''}
                        onChange={(e) => handleInputChange(day, 'start', e.target.value)}
                        className="w-full px-2 py-1 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                      />
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200">
                      <div className="flex gap-1 items-center">
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={weekData.data[day]?.breakHours || ''}
                          onChange={(e) => handleInputChange(day, 'breakHours', e.target.value)}
                          className="w-14 px-1 py-1 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center transition-colors text-sm"
                        />
                        <span className="text-gray-600 font-medium text-xs">h</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={weekData.data[day]?.breakMinutes || ''}
                          onChange={(e) => handleInputChange(day, 'breakMinutes', e.target.value)}
                          className="w-14 px-1 py-1 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center transition-colors text-sm"
                        />
                        <span className="text-gray-600 font-medium text-xs">m</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200">
                      <input
                        type="time"
                        value={weekData.data[day]?.finish || ''}
                        onChange={(e) => handleInputChange(day, 'finish', e.target.value)}
                        className="w-full px-2 py-1 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                      />
                    </td>
                    <td className="px-4 py-2 font-mono text-base font-semibold text-blue-600">{weekData.data[day]?.total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right font-bold text-gray-900 border-r border-gray-200">
                    Weekly Total:
                  </td>
                  <td className="px-4 py-2 font-mono font-bold text-lg text-green-600">
                    {weekData.weeklyTotal}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3">
          <div className="flex justify-center gap-4">
            <button
              onClick={saveTimesheet}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {loading ? 'Saving...' : 'Save Timesheet'}
            </button>
            
            <button
              onClick={() => router.push(`/invoice?weekStart=${weekData.weekStart}`)}
              disabled={!weekData.weekStart || !dataExists || !hasWorkingHours()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              title={
                !dataExists 
                  ? 'Please save timesheet first' 
                  : !hasWorkingHours() 
                    ? 'No working hours entered' 
                    : 'Generate invoice for this week'
              }
            >
              Generate Invoice
            </button>
          </div>
          
          {/* Invoice Button Status Message */}
          {(!dataExists || !hasWorkingHours()) && (
            <div className="mt-2 text-center">
              <p className="text-sm text-gray-600">
                {!dataExists && !hasWorkingHours() && 'Enter working hours and save timesheet to generate invoice'}
                {!dataExists && hasWorkingHours() && 'Save timesheet first to generate invoice'}  
                {dataExists && !hasWorkingHours() && 'No working hours entered - cannot generate invoice'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
