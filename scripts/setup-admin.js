const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupAdmin() {
  try {
    // Update me@nathanli.net to be an admin
    const adminUser = await prisma.user.updateMany({
      where: {
        email: 'me@nathanli.net'
      },
      data: {
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    })

    console.log('Admin user setup complete:', adminUser)

    // Show current users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    })

    console.log('Current users:')
    console.table(users)

  } catch (error) {
    console.error('Error setting up admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupAdmin()