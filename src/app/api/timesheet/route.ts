import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { weekStart, weeklyTotal, data } = body

    if (!weekStart || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create or update timesheet
    const timesheet = await prisma.timesheet.upsert({
      where: {
        userId_weekStart: {
          userId: user.id,
          weekStart: new Date(weekStart)
        }
      },
      update: {
        weeklyTotal: weeklyTotal,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        weekStart: new Date(weekStart),
        weeklyTotal: weeklyTotal
      }
    })

    // Delete existing day entries
    await prisma.dayEntry.deleteMany({
      where: { timesheetId: timesheet.id }
    })

    // Create new day entries
    const dayNames = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    const dayEntries = dayNames.map(day => ({
      timesheetId: timesheet.id,
      dayName: day,
      date: data[day].date,
      startTime: data[day].start || null,
      breakHours: parseInt(data[day].breakHours) || 0,
      breakMinutes: parseInt(data[day].breakMinutes) || 0,
      finishTime: data[day].finish || null,
      totalHours: data[day].total || '0:00'
    }))

    await prisma.dayEntry.createMany({
      data: dayEntries
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Timesheet saved successfully',
      id: timesheet.id 
    })

  } catch (error) {
    console.error('Error saving timesheet:', error)
    return NextResponse.json(
      { error: 'Failed to save timesheet' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const weekStart = searchParams.get('weekStart')

    if (!weekStart) {
      return NextResponse.json({ error: 'weekStart parameter required' }, { status: 400 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get timesheet with day entries
    const timesheet = await prisma.timesheet.findUnique({
      where: {
        userId_weekStart: {
          userId: user.id,
          weekStart: new Date(weekStart)
        }
      },
      include: {
        dayEntries: true
      }
    })

    if (!timesheet) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 })
    }

    // Format response
    const data: any = {}
    timesheet.dayEntries.forEach(entry => {
      data[entry.dayName] = {
        date: entry.date,
        start: entry.startTime,
        breakHours: entry.breakHours.toString(),
        breakMinutes: entry.breakMinutes.toString(),
        finish: entry.finishTime,
        total: entry.totalHours
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        weekStart: timesheet.weekStart.toISOString().split('T')[0],
        weeklyTotal: timesheet.weeklyTotal,
        data
      }
    })

  } catch (error) {
    console.error('Error fetching timesheet:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timesheet' }, 
      { status: 500 }
    )
  }
}