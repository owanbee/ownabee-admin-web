# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Ownabee Admin Web** - a Next.js 14 admin portal for managing institutions, classes, students, and portfolios. It serves as the administrative interface for the Ownabee platform, enabling operators, institution admins, and teachers to manage educational content.

## Development Commands

```bash
# Install dependencies
yarn install

# Development server
yarn dev              # Start Next.js dev server on port 3000

# Production build
yarn build            # Build for production

# Start production server
yarn start            # Start production server

# Linting
yarn lint             # Run ESLint

# Formatting
yarn format           # Format code with Prettier
```

## Architecture

### Tech Stack

- **Next.js 14** with App Router
- **TypeScript** with strict mode
- **Tailwind CSS** for styling
- **Zustand** for state management (auth store)
- **@react-oauth/google** for Google Sign-In
- **Lucide React** for icons

### Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with Google OAuth provider
│   ├── page.tsx                 # Home page (redirects)
│   ├── login/                   # Login page
│   ├── dashboard/               # Main dashboard
│   ├── classes/                 # Class management for portfolios
│   │   └── [classId]/          # Class details with students
│   ├── students/
│   │   └── [profileId]/
│   │       └── portfolios/     # Student portfolios
│   ├── portfolios/
│   │   ├── new/                # Create portfolio
│   │   └── [id]/edit/         # Edit portfolio
│   └── admin/                   # Operator-only pages
│       ├── institutions/       # Institution management
│       ├── classes/            # Class management
│       ├── student-codes/      # Student code generation
│       └── members/            # Member and teacher management
├── components/
│   ├── layout/                  # Layout components
│   │   ├── DashboardLayout.tsx # Main authenticated layout
│   │   ├── AdminLayout.tsx     # Operator-only layout
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── Header.tsx          # Top header with user menu
│   │   └── PageHeader.tsx      # Page title and breadcrumbs
│   ├── ui/                      # Reusable UI components
│   │   ├── button.tsx          # Button with variants
│   │   ├── input.tsx           # Form input
│   │   ├── select.tsx          # Select dropdown
│   │   ├── textarea.tsx        # Textarea input
│   │   ├── card.tsx            # Card container
│   │   ├── badge.tsx           # Status badge
│   │   ├── avatar.tsx          # User avatar
│   │   ├── modal.tsx           # Modal dialog
│   │   ├── table.tsx           # Data table
│   │   ├── empty-state.tsx     # Empty state display
│   │   └── loading.tsx         # Loading spinners
│   └── forms/
│       └── PortfolioForm.tsx   # Portfolio create/edit form
├── hooks/
│   └── useApi.ts               # API fetching hooks
├── lib/
│   ├── api.ts                  # API client with auth handling
│   └── utils.ts                # Utility functions
├── stores/
│   └── authStore.ts            # Zustand auth store
└── types/
    └── index.ts                # TypeScript type definitions
```

### User Roles and Access

1. **Operator** (globalRole: "OPERATOR")
   - Full access to all admin features
   - Can manage institutions, classes, student codes
   - Can assign roles and teacher-class assignments

2. **Institution Admin** (institutionRole: "INSTITUTION_ADMIN")
   - Can view all classes in their institution
   - Can manage portfolios for all students in their institution

3. **Teacher** (institutionRole: "TEACHER")
   - Can view only assigned classes
   - Can manage portfolios for students in assigned classes

### Backend API Integration

The frontend connects to the backend API via environment variable:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Key API endpoints used:

- `/api/auth/google/token` - Google Sign-In
- `/api/portal/*` - Portal APIs (classes, students, portfolios for non-operators)
- `/api/admin/*` - Admin APIs (institutions, classes, members - operators only)
- `/api/portfolio/*` - Portfolio CRUD operations

### Authentication Flow

1. User clicks "Sign in with Google" on login page
2. Google returns ID token via GSI
3. ID token sent to backend `/api/auth/google/token`
4. Backend validates token and returns JWT access/refresh tokens
5. Tokens stored in Zustand (persisted to localStorage)
6. API client automatically adds Authorization header
7. Token refresh handled automatically on 401 responses

## Development Notes

- All pages under `/admin/*` require Operator role
- Portfolio management is available to all authenticated users with institution access
- The API client handles token refresh automatically
- Use `useIsOperator()` hook to check for operator access
- Use `useHasInstitutionAccess()` hook to check for any institution role
- Components use Tailwind CSS with custom primary color (orange)
- Modal components handle escape key and overlay click for closing

## Environment Variables

```bash
# Required
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Testing Locally

1. Ensure backend is running on port 3001
2. Copy `.env.local.example` to `.env.local` and fill in values
3. Run `yarn install`
4. Run `yarn dev`
5. Open http://localhost:3000
