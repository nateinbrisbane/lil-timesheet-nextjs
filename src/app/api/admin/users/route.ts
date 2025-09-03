import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAdminAccess() {
  const session = await getServerSession()
  
  if (!session || !session.user?.email) {
    return false
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  return user?.role === 'ADMIN'
}

export async function GET() {
  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            timesheets: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ users })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' }, 
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, role, status } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const updateData: {
      role?: 'USER' | 'ADMIN'
      status?: 'ACTIVE' | 'INACTIVE' | 'PENDING'
    } = {}
    if (role && ['USER', 'ADMIN'].includes(role)) {
      updateData.role = role
    }
    if (status && ['ACTIVE', 'INACTIVE', 'PENDING'].includes(status)) {
      updateData.status = status
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully',
      user: updatedUser 
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' }, 
      { status: 500 }
    )
  }
}