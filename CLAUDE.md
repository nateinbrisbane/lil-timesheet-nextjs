# Lil Timesheet - Claude Code Documentation

## Project Overview
Lil Timesheet is a weekly timesheet tracking application built with Next.js 15, featuring multi-user support with Google OAuth authentication and admin controls.

## Features
- **Weekly Timesheet View**: Monday-Sunday layout with dd/MM/yyyy date format
- **Time Tracking**: Start time, break time (hours/minutes), finish time inputs
- **Automatic Calculations**: Daily and weekly totals computed automatically
- **Default Values**: Start 08:30, Break 0h 30m, Finish 17:00 (weekends empty)
- **Week Navigation**: Previous/next buttons for week browsing
- **Multi-User Support**: Google OAuth authentication with data isolation
- **Admin Dashboard**: User management with role/status controls
- **Professional UI**: Hover effects, compact spacing, responsive design

## Tech Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Google OAuth 2.0
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Deployment**: Vercel
- **Version Control**: Git/GitHub

## Admin Account
- Admin email: `me@nathanli.net`
- Admin users can manage all users (activate, deactivate, change roles)
- Regular users start with PENDING status and need admin approval

## Database Schema
```prisma
model User {
  id          String      @id @default(cuid())
  email       String      @unique
  name        String?
  image       String?
  role        UserRole    @default(USER)
  status      UserStatus  @default(PENDING)
  timesheets  Timesheet[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Timesheet {
  id       String     @id @default(cuid())
  userId   String
  weekStart DateTime
  user     User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  days     DayEntry[]
}

model DayEntry {
  id           String    @id @default(cuid())
  timesheetId  String
  date         DateTime
  startTime    String?
  breakHours   Int?
  breakMinutes Int?
  finishTime   String?
  timesheet    Timesheet @relation(fields: [timesheetId], references: [id], onDelete: Cascade)
}
```

## Environment Variables
```
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
NEXTAUTH_URL=https://lil-timesheet-nextjs.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret
DATABASE_URL=your_postgresql_connection_string
```

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Run database migrations
- `npx prisma studio` - Open Prisma Studio

## Deployment
- **Platform**: Vercel
- **URL**: https://lil-timesheet-nextjs.vercel.app
- **Database**: Neon PostgreSQL
- **Auto-deployment**: Connected to GitHub main branch

## Project Structure
```
src/
├── app/
│   ├── admin/page.tsx          # Admin dashboard
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth configuration
│   │   ├── admin/users/        # Admin user management API
│   │   └── timesheet/          # Timesheet CRUD API
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout with providers
│   └── page.tsx                # Main timesheet interface
├── lib/
│   └── auth.ts                 # Auth configuration
└── prisma/
    └── schema.prisma           # Database schema
```

## Key Features Implementation

### Authentication Flow
- Google OAuth 2.0 via NextAuth.js
- Automatic user creation on first login
- Admin users (me@nathanli.net) get ACTIVE status immediately
- Regular users start as PENDING and need admin approval

### Data Isolation
- All timesheet data is scoped to the authenticated user
- Database queries include user ID filtering
- Admin can only manage users, not view their timesheet data

### UI/UX Highlights
- Professional hover effects on navigation and buttons
- Compact spacing to fit save button without scrolling
- Avatar fallback system with user initials
- Responsive design for mobile and desktop
- Clean table styling with subtle borders

## Development History
- Initially built with Express.js and SQLite
- Migrated to Next.js for better Vercel compatibility
- Added multi-user functionality and admin controls
- Enhanced UI with professional styling and hover effects
- Cleaned up legacy Express.js files for final deployment

## Support
For issues or feature requests, contact the development team or create issues in the GitHub repository.