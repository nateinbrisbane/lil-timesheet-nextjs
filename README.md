# Lil Timesheet

A simple, modern timesheet application built with Next.js and deployed on Vercel.

## Features

- ✅ Weekly timesheet tracking (Monday-Sunday)
- ✅ Automatic time calculations
- ✅ Google OAuth authentication
- ✅ Secure cloud data storage
- ✅ Responsive design with Tailwind CSS
- ✅ PostgreSQL database with Prisma ORM

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Authentication**: NextAuth.js with Google Provider
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your environment variables (see `.env.local`)
4. Set up the database: `npx prisma db push`
5. Run the development server: `npm run dev`

## Environment Variables

```env
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DATABASE_URL=your-database-url
```

## Database Setup

This app uses PostgreSQL with Prisma. The schema includes:
- User management with NextAuth
- Timesheet records per user per week
- Individual day entries with start/break/finish times

## Deployment

This app is optimized for Vercel deployment with:
- Serverless Next.js architecture
- NextAuth.js for serverless authentication
- Prisma for database management
