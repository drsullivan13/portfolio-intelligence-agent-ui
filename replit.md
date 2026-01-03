# Portfolio Intelligence Agent

## Overview

A real-time portfolio monitoring dashboard for investment professionals. The system displays market-moving events (SEC 8-K filings, news sentiment) with AI-powered analysis. Think Bloomberg Terminal meets modern fintech — professional, data-dense, dark mode interface optimized for all-day monitoring.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state, with 60-second auto-refresh intervals for real-time feel
- **Styling**: Tailwind CSS v4 with custom dark theme optimized for financial terminals
- **UI Components**: shadcn/ui component library (New York style) with Radix UI primitives
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Build**: Custom build script using esbuild for server, Vite for client
- **API Pattern**: RESTful endpoints under `/api/` prefix
- **Static Serving**: Production serves built client from `dist/public`
- **Authentication**: Session-based with bcrypt password hashing (12 salt rounds)
  - Sessions stored in PostgreSQL via connect-pg-simple
  - Protected routes use requireAuth middleware
  - User-scoped data filtering on all event/watchlist queries

### Data Storage
- **Primary Database**: PostgreSQL via Drizzle ORM for user data
- **Event Storage**: AWS DynamoDB for portfolio events (news, SEC filings)
  - Uses Global Secondary Indexes (GSI) for querying by ticker and user
  - Tables: `portfolio-events` and `user-watchlists`
- **Schema Location**: `shared/schema.ts` contains Drizzle table definitions

### Key Design Patterns
- **Shared Types**: Common types and schemas in `shared/` directory accessible by both client and server
- **API Layer**: Client uses dedicated API functions in `client/src/lib/api.ts` for all backend communication
- **Component Structure**: Reusable UI components in `components/ui/`, feature components at `components/` root

## External Dependencies

### Cloud Services
- **AWS DynamoDB**: Primary storage for portfolio events and watchlists
  - Requires `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
  - Table names configurable via `DYNAMODB_TABLE_NAME`, `WATCHLIST_DYNAMODB_TABLE_NAME`

### Database
- **PostgreSQL**: User authentication and settings
  - Connection via `DATABASE_URL` environment variable
  - Migrations stored in `migrations/` directory
  - Push schema with `npm run db:push`
  - `SESSION_SECRET` environment variable required for production (secure session cookies)

### Key NPM Packages
- **@tanstack/react-query**: Server state management
- **drizzle-orm** + **drizzle-zod**: Database ORM with Zod validation
- **date-fns**: Date formatting and manipulation
- **lucide-react**: Icon library
- **wouter**: Lightweight client-side routing