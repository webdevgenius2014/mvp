# Agency Portal MVP

A complete SaaS platform for agencies to manage projects, tasks, clients, and billing with AI-powered features and white-label capabilities.

## Features

### Core Features ✅
- **User Authentication**: Email/password + OAuth (Google)
- **Role-Based Access**: Admin, Team Member, Client roles
- **Client Portal**: Project list, file upload/download, approvals
- **Project Management**: CRUD operations, status tracking (Draft/Active/Completed)
- **Task Management**: Assignment, due dates, priorities, status tracking
- **In-App Messaging**: Threaded messages per project
- **Team Dashboard**: Active projects, tasks due, recent activity
- **AI Features**:
  - Auto-summary of project updates
  - AI task suggestions from project brief
  - AI-generated proposal templates
- **Stripe Billing**: Subscription management + license redemption
- **White-Label**: Logo upload, brand color customization
- **Admin Panel**: User management, usage metrics, invoices

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Payments**: Stripe
- **AI**: OpenAI API
- **File Upload**: Local storage (upgradeable to S3)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Stripe account
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd mvp
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Your app URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: OAuth credentials (optional)
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`: Stripe API keys
- `OPENAI_API_KEY`: OpenAI API key

4. **Set up the database**

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations (production)
npm run db:migrate
```

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
mvp/
├── app/                      # Next.js app directory
│   ├── (dashboard)/         # Dashboard routes (protected)
│   │   ├── projects/        # Projects pages
│   │   └── settings/        # Settings page
│   ├── api/                 # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── projects/        # Project CRUD
│   │   ├── tasks/           # Task management
│   │   ├── messages/        # Messaging
│   │   ├── ai/              # AI features
│   │   ├── stripe/          # Billing
│   │   ├── admin/           # Admin endpoints
│   │   └── white-label/     # White-label settings
│   ├── auth/                # Auth pages (signin/signup)
│   ├── dashboard/           # Dashboard page
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── ui/                  # UI components
│   └── layout/              # Layout components
├── lib/                     # Utilities
│   ├── prisma.ts            # Prisma client
│   ├── auth.ts              # NextAuth config
│   └── utils.ts             # Helper functions
├── prisma/
│   └── schema.prisma        # Database schema
└── types/                   # TypeScript types
```

## Database Schema

The application includes comprehensive data models:

- **User**: Authentication and user profiles
- **Organization**: Multi-tenant organization management
- **Project**: Project tracking with statuses
- **Task**: Task management with assignments
- **Message**: Threaded messaging system
- **File**: File upload tracking
- **Approval**: Client approval workflow
- **Subscription**: Stripe subscription management
- **License**: One-time license system
- **WhiteLabel**: Branding customization
- **Activity**: Activity tracking for dashboard

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project details
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### AI Features
- `POST /api/ai/project-summary` - Generate project summary
- `POST /api/ai/task-suggestions` - Get AI task suggestions
- `POST /api/ai/proposal-template` - Generate proposal

### Billing
- `POST /api/stripe/create-checkout` - Create checkout session
- `POST /api/stripe/webhook` - Stripe webhooks
- `POST /api/license/redeem` - Redeem license key

### Admin
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PATCH /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user
- `GET /api/admin/metrics` - Get usage metrics

## Pricing Tiers

### SaaS Subscriptions
- **Starter**: ₹499/month - 1 team member, 5 projects, 100 AI tokens
- **Pro**: ₹1,499/month - 5 team members, unlimited projects, 1,000 AI tokens
- **Agency**: ₹3,499/month - Unlimited team, white-label, 10,000 AI tokens

### Lifetime Licenses
- **Single-site**: ₹18,000
- **Developer**: ₹45,000
- **Enterprise**: ₹90,000

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Railway/Render

1. Connect GitHub repository
2. Add PostgreSQL database
3. Set environment variables
4. Deploy

### Docker (Optional)

```bash
# Build
docker build -t agency-portal .

# Run
docker run -p 3000:3000 agency-portal
```

## Environment Variables for Production

Ensure these are set in production:

- `NODE_ENV=production`
- `DATABASE_URL`: Production PostgreSQL URL
- `NEXTAUTH_URL`: Production domain
- `NEXTAUTH_SECRET`: Strong random secret
- `STRIPE_SECRET_KEY`: Live Stripe key
- `STRIPE_WEBHOOK_SECRET`: Live webhook secret
- `OPENAI_API_KEY`: Production OpenAI key

## License

This is a proprietary SaaS product. See LICENSE for details.

## Support

For support, email support@agencyportal.com or visit our documentation at docs.agencyportal.com
