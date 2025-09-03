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
- **Mobile-Responsive Design**: Fully optimized for all screen sizes with touch-friendly interactions
- **Professional UI**: Hover effects, compact spacing, adaptive layouts

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
- **Auto Invoice Numbers**: Unique YYMMDDXX format with current date + random 2-digit suffix
- **Professional Output**: Clean print view with navigation hidden for PDF generation
- **Privacy-First**: No personal information stored in code or placeholders

### UI/UX Highlights
- **Navigation**: Unified navigation component with merged Settings/user profile and touch-friendly interactions
- **Settings Organization**: Tabbed settings interface (Invoice Settings, Admin Settings) with mobile-friendly navigation
- **Professional Effects**: Hover animations, background shading for mobile clickability, and smooth transitions
- **Responsive Design**: Comprehensive mobile-first design with adaptive layouts and progressive disclosure
- **Mobile Optimization**: Touch-friendly buttons, horizontal scrolling tables, and condensed mobile layouts
- **Typography Scaling**: Responsive text sizing (text-xs sm:text-sm, text-lg sm:text-2xl) across all components
- **Flexible Layouts**: Elements stack vertically on mobile, horizontally on desktop for optimal space usage
- **Avatar System**: Robust fallback system with user initials for profile images
- **Clean Styling**: Subtle borders, proper spacing, and consistent color scheme

## Development History
- Initially built with Express.js and SQLite
- Migrated to Next.js for better Vercel compatibility
- Added multi-user functionality and admin controls
- Enhanced UI with professional styling and hover effects
- Implemented comprehensive invoice system with database-driven templates
- Added prominent icons throughout application (navigation, buttons, tabs)
- Reorganized navigation structure with merged Settings/user profile
- Implemented comprehensive mobile-responsive design across entire application
- Optimized touch interactions with background shading and proper sizing
- Added progressive disclosure for mobile tables and adaptive layouts
- Removed all personal information from codebase for privacy
- Cleaned up legacy Express.js files for final deployment

## Mobile Responsiveness Features
- **Responsive Breakpoints**: Consistent use of sm:640px+, md:768px+, lg:1024px+ breakpoints
- **Progressive Disclosure**: Hide less critical information on smaller screens (timesheets count, dates, etc.)
- **Touch-Friendly Interactions**: Larger buttons, background shading for clickable areas
- **Adaptive Navigation**: Week navigation with abbreviated mobile labels (-4w, -2w, Now, +1w, +2w)
- **Horizontal Scrolling**: Complex tables maintain functionality while being mobile-accessible
- **Responsive Forms**: Full-width inputs on mobile, adaptive modal behavior
- **Mobile-First Typography**: Scaling text sizes and spacing for optimal readability
- **Flexible Button Layouts**: Stack vertically on mobile, arrange horizontally on desktop

## Invoice Number Generation

The application automatically generates unique invoice numbers using a date-based format:

### **Format: `YYMMDDXX`**
- **YY**: Last 2 digits of current year (e.g., "25" for 2025)
- **MM**: Current month with leading zero (e.g., "01" for January)  
- **DD**: Current day with leading zero (e.g., "15" for the 15th)
- **XX**: Random 2-digit number from 00-99 for uniqueness

### **Examples:**
- Generated on January 15, 2025: `25011543`
- Generated on December 3, 2025: `25120317`

### **Generation Logic:**
- Automatically generated when invoice page loads
- Based on current date (not timesheet week date)
- New random suffix ensures uniqueness on page refresh
- Chronological organization for easy reference and sorting

## Support
For issues or feature requests, contact the development team or create issues in the GitHub repository.