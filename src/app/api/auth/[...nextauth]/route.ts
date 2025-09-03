import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  events: {
    createUser: async ({ user }) => {
      // Set admin role for me@nathanli.net
      const isAdmin = user.email === 'me@nathanli.net'
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: isAdmin ? 'ADMIN' : 'USER',
          status: isAdmin ? 'ACTIVE' : 'PENDING',
        },
      })
    },
    signIn: async ({ user, isNewUser }) => {
      if (!isNewUser) {
        // Update last login time
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
          },
        })
      }
    },
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.sub!
        
        // Get user role and status from database
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub! },
          select: { role: true, status: true }
        })
        
        if (dbUser) {
          session.user.role = dbUser.role
          session.user.status = dbUser.status
        }
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.sub = user.id
      }
      return token
    },
    signIn: async ({ user }) => {
      // Check if user is active (unless it's the admin)
      if (user.email !== 'me@nathanli.net') {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { status: true }
        })
        
        if (dbUser?.status === 'INACTIVE') {
          return false // Block inactive users
        }
      }
      
      return true
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
})

export { handler as GET, handler as POST }