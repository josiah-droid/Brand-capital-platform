# Brand Capital Platform

The **Brand Capital Platform** is a modern web application built for managing brand capital, deals, and tasks.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + Lucide Icons
- **Backend/Auth**: [Supabase](https://supabase.com/)
- **Database ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **State Management**: React Query

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Copy `.env.local.example` to `.env.local` and add your Supabase credentials:
   ```bash
   cp .env.local.example .env.local
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Scripts

- `npm run dev`: Runs the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint checks.
- `npm run db:generate`: Generates Drizzle migrations.
- `npm run db:migrate`: Applies Drizzle migrations.
