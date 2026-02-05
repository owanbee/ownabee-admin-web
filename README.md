# Ownabee Admin Web

Admin portal for managing institutions, classes, students, and portfolios in the Ownabee platform.

## Features

### Portfolio Management (All Users)

- View accessible classes based on role
- View students in each class
- Create, edit, and delete student portfolios
- Support for IMAGE, PDF, and AUDIOBOOK content types

### System Administration (Operators Only)

- Institution CRUD operations
- Class management across institutions
- Student code generation (single and batch)
- Member management with role assignment
- Teacher-class assignment

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **@react-oauth/google** - Google Sign-In

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running (ownabee-backend)
- Google OAuth Client ID

### Installation

```bash
# Install dependencies
yarn install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local with your configuration
```

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Development

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
yarn build
yarn start
```

## User Roles

| Role              | Access                                                             |
| ----------------- | ------------------------------------------------------------------ |
| Operator          | Full admin access + all portfolio management                       |
| Institution Admin | All classes in institution + portfolio management                  |
| Teacher           | Assigned classes only + portfolio management for assigned students |

## Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── admin/             # Operator-only admin pages
│   ├── classes/           # Class and student views
│   ├── dashboard/         # Main dashboard
│   ├── login/             # Authentication
│   ├── portfolios/        # Portfolio editor
│   └── students/          # Student portfolios
├── components/            # React components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── ui/               # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and API client
├── stores/                # Zustand stores
└── types/                 # TypeScript types
```

## License

Private - Ownabee/Myibook
