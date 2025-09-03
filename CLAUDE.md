# Lil Timesheet - Claude Code Documentation

## Project Overview
Lil Timesheet is a weekly timesheet tracking application built with Next.js 15, featuring multi-user support with Google OAuth authentication, admin controls, and comprehensive invoice generation capabilities.

## Features
- **Weekly Timesheet View**: Monday-Sunday layout with dd/MM/yyyy date format
- **Time Tracking**: Start time, break time (hours/minutes), finish time inputs
- **Automatic Calculations**: Daily and weekly totals computed automatically
- **Default Values**: Start 08:30, Break 0h 30m, Finish 17:00 (weekends empty)
- **Week Navigation**: Previous/next buttons for week browsing
- **Multi-User Support**: Google OAuth authentication with data isolation
- **Admin Dashboard**: User management with role/status controls
- **Invoice System**: Database-driven invoice generation with templates
- **Client-Specific Templates**: Multiple invoice templates with custom rates
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
enum UserRole {
  USER
  ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  PENDING
}

model User {
  id                    String                 @id @default(cuid())
  name                  String?
  email                 String                 @unique
  emailVerified         DateTime?
  image                 String?
  role                  UserRole               @default(USER)
  status                UserStatus             @default(PENDING)
  accounts              Account[]
  sessions              Session[]
  timesheets            Timesheet[]
  globalInvoiceSettings GlobalInvoiceSettings?
  invoiceTemplates      InvoiceTemplate[]
  createdAt             DateTime               @default(now())
  updatedAt             DateTime               @updatedAt @default(now())
  lastLoginAt           DateTime?
}

model Timesheet {
  id          String     @id @default(cuid())
  userId      String
  weekStart   DateTime
  weeklyTotal String?
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  dayEntries  DayEntry[]
  
  @@unique([userId, weekStart])
}

model DayEntry {
  id           String    @id @default(cuid())
  timesheetId  String
  dayName      String
  date         String
  startTime    String?
  breakHours   Int       @default(0)
  breakMinutes Int       @default(0)
  finishTime   String?
  totalHours   String?
  timesheet    Timesheet @relation(fields: [timesheetId], references: [id], onDelete: Cascade)
  
  @@unique([timesheetId, dayName])
}

model GlobalInvoiceSettings {
  id              String   @id @default(cuid())
  userId          String   @unique
  contractorName  String
  abn             String
  bankBsb         String
  bankAccount     String
  addressLine1    String
  addressLine2    String?
  city            String
  state           String
  postcode        String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model InvoiceTemplate {
  id              String   @id @default(cuid())
  userId          String
  templateName    String
  clientName      String
  dayRate         Float
  gstPercentage   Float    @default(0.10)
  
  // Optional overrides for global settings
  customContractorName  String?
  customAbn            String?
  customBankBsb        String?
  customBankAccount    String?
  customAddress        String?
  
  isDefault       Boolean  @default(false)
  isActive        Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, templateName])
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
- `npx prisma db push` - Sync schema to production database
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
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth configuration
│   │   ├── admin/users/        # Admin user management API
│   │   ├── invoice/            # Invoice API endpoints
│   │   │   ├── settings/       # Global invoice settings
│   │   │   └── templates/      # Invoice templates CRUD
│   │   └── timesheet/          # Timesheet CRUD API
│   ├── invoice/
│   │   └── page.tsx            # Invoice generation page
│   ├── settings/
│   │   ├── admin/page.tsx      # Admin user management
│   │   ├── invoice/page.tsx    # Invoice settings management
│   │   └── page.tsx            # Settings hub with tabs
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout with global navigation
│   └── page.tsx                # Main timesheet interface
├── components/
│   └── Navigation.tsx          # Shared navigation component
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
- Invoice settings and templates are user-specific

### Invoice System
- **Global Settings**: Store contractor details (name, ABN, bank details, address)
- **Invoice Templates**: Client-specific templates with custom rates and optional overrides
- **Template Flexibility**: Global settings can be overridden per template for different clients
- **Database-Driven**: All invoice data retrieved from database, no hardcoded values
- **Privacy-First**: No personal information stored in code or placeholders

### UI/UX Highlights
- **Navigation**: Unified navigation component with clickable title and right-aligned Settings
- **Settings Organization**: Tabbed settings interface (Invoice Settings, Admin Settings)
- **Professional Effects**: Hover animations on navigation and interactive elements
- **Compact Layout**: Optimized spacing to fit content without scrolling
- **Avatar System**: Robust fallback system with user initials for profile images
- **Responsive Design**: Mobile and desktop optimized layouts
- **Clean Styling**: Subtle borders, proper spacing, and consistent color scheme

## Development History
- Initially built with Express.js and SQLite
- Migrated to Next.js for better Vercel compatibility
- Added multi-user functionality and admin controls
- Enhanced UI with professional styling and hover effects
- Implemented comprehensive invoice system with database-driven templates
- Reorganized navigation and settings structure for better UX
- Removed all personal information from codebase for privacy
- Cleaned up legacy Express.js files for final deployment

## Support
For issues or feature requests, contact the development team or create issues in the GitHub repository.