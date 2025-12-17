# Artifex Archive

A canonical library for AI-generated media — images, music, video, games, and beyond.

## Project Overview

Artifex Archive is a modern, full-stack web application for discovering, sharing, and organizing AI-generated media. Built with Next.js 14, it features:

- **Full-text search** with PostgreSQL and optimized ranking
- **Direct-to-R2 uploads** for scalable file storage
- **User authentication** with NextAuth.js
- **Real-time ratings and saves** with optimistic UI updates
- **Admin dashboard** for content moderation
- **Responsive design** with mobile-first approach
- **Accessibility** with keyboard navigation and ARIA labels
- **Rate limiting** to prevent abuse

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **API:** tRPC
- **State Management:** TanStack Query (React Query)
- **File Storage:** Cloudflare R2 (S3-compatible)
- **Deployment:** Vercel (recommended)

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended for production)
- Cloudflare account with R2 bucket (for file uploads)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Required

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/artifex_archive?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32

# Cloudflare R2 (for file uploads)
R2_ACCOUNT_ID="your-r2-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_PUBLIC_BUCKET="your-bucket-name"
R2_PUBLIC_URL="https://your-bucket-name.r2.dev"  # Optional, defaults to R2.dev URL
```

### Optional

```env
# Admin Access (comma-separated list of admin emails)
ADMIN_EMAILS="admin@example.com,another-admin@example.com"
```

## Setup Steps

### 1. Clone and Install

```bash
git clone <repository-url>
cd artifex-archive
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

### 3. Set Up Database

#### Local PostgreSQL

```bash
# Create database
createdb artifex_archive

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

#### Neon (Cloud PostgreSQL)

1. Create a Neon account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL`
4. Run migrations:

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Set Up Cloudflare R2

1. Create a Cloudflare account
2. Go to R2 → Create bucket
3. Generate API tokens: R2 → Manage R2 API Tokens → Create API token
4. Set bucket to public access (or configure custom domain)
5. Add R2 credentials to `.env.local`

### 5. Seed Database (Optional)

To populate with demo data:

```bash
npm run prisma:seed
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment Instructions

### Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables (see below)

3. **Set Environment Variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - For `NEXTAUTH_URL`, use your Vercel deployment URL
   - For `DATABASE_URL`, use your Neon connection string

4. **Configure Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

5. **Deploy:**
   - Vercel will automatically deploy on push
   - Or click "Deploy" in the dashboard

### Deploy Database (Neon)

1. **Create Neon Project:**
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string

2. **Run Migrations:**
   ```bash
   # Set DATABASE_URL to Neon connection string
   export DATABASE_URL="postgresql://..."
   npx prisma migrate deploy
   ```

3. **Update Vercel Environment:**
   - Add `DATABASE_URL` to Vercel environment variables
   - Use the Neon connection string

### Deploy R2 Bucket

1. **Create Bucket:**
   - In Cloudflare dashboard, go to R2
   - Create a new bucket
   - Note the bucket name

2. **Configure Public Access:**
   - Go to bucket settings
   - Enable public access or configure custom domain
   - Update `R2_PUBLIC_URL` if using custom domain

3. **Generate API Tokens:**
   - R2 → Manage R2 API Tokens
   - Create token with read/write permissions
   - Add credentials to Vercel environment variables

### Post-Deployment Checklist

- [ ] Verify database migrations ran successfully
- [ ] Test file uploads to R2
- [ ] Verify authentication works
- [ ] Test search functionality
- [ ] Check admin routes (if configured)
- [ ] Verify rate limiting works
- [ ] Test mobile responsiveness
- [ ] Check accessibility (keyboard navigation)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed the database with demo data
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Project Structure

```
artifex-archive/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Database seed script
│   └── migrations/          # Database migrations
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── account/         # User account pages
│   │   ├── admin/           # Admin dashboard
│   │   ├── item/            # Media item detail pages
│   │   ├── library/         # Media library by type
│   │   ├── search/          # Search page
│   │   └── upload/           # Upload page
│   ├── components/          # React components
│   │   ├── layout/          # Layout components
│   │   ├── media/            # Media-related components
│   │   └── ui/              # shadcn/ui components
│   ├── lib/                 # Utilities and configurations
│   │   ├── trpc/            # tRPC setup
│   │   ├── rate-limit.ts    # Rate limiting utility
│   │   └── r2.ts            # R2 file upload utilities
│   ├── server/              # Server-side code
│   │   └── trpc/            # tRPC routers
│   └── types/               # TypeScript type definitions
└── public/                  # Static assets
```

## Features

### User Features
- **Browse by Category:** Images, Videos, Music, Games, Text
- **Full-Text Search:** Search titles, descriptions, tags, and AI models
- **Upload Media:** Direct-to-R2 uploads with progress tracking
- **Rate & Save:** Rate items (1-5 stars) and save favorites
- **User Profiles:** Edit username, bio, and view stats
- **Responsive Design:** Works on mobile, tablet, and desktop

### Admin Features
- **Content Moderation:** Toggle visibility, soft delete items
- **User Management:** Ban/unban users, view user stats
- **Report Queue:** Placeholder for future reporting system

### Technical Features
- **Rate Limiting:** In-memory rate limiting (Upstash Redis ready)
- **Full-Text Search:** PostgreSQL FTS with optimized ranking
- **Image Optimization:** Next.js Image component with lazy loading
- **Accessibility:** Keyboard navigation, ARIA labels, focus management
- **SEO:** Metadata, sitemap, robots.txt

## Testing End-to-End Flow

1. **Sign In:**
   - Navigate to `/login`
   - Sign in with your provider

2. **Upload File:**
   - Go to `/upload`
   - Select a file (image, video, etc.)
   - Fill in metadata
   - Upload directly to R2
   - Item appears in library

3. **Rate & Save:**
   - Open item detail page
   - Rate the item (1-5 stars)
   - Save the item
   - Item ranking updates

4. **Search:**
   - Use search bar in header
   - Search by title, description, tags
   - Verify item appears in results

5. **Verify Ranking:**
   - Item with higher ratings/saves appears higher
   - Check library sorting (Top Rated, Trending, Newest)

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if database is accessible
- Ensure migrations have run

### R2 Upload Failures
- Verify R2 credentials are correct
- Check bucket permissions
- Verify `R2_PUBLIC_URL` is set correctly

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches deployment URL
- Ensure OAuth provider credentials are correct

### Rate Limiting Issues
- Rate limits reset after the window period
- For production, consider using Upstash Redis
- Check rate limit settings in `src/lib/trpc/init.ts`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license here]

## Deployment

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions to Vercel with Neon Postgres and Cloudflare R2.

### Quick Deploy Checklist

1. Push code to GitHub
2. Create Neon Postgres database
3. Create Cloudflare R2 bucket
4. Deploy to Vercel
5. Set environment variables in Vercel dashboard
6. Run migrations: `npx prisma migrate deploy`
7. Enable Vercel Analytics & Speed Insights

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [tRPC Documentation](https://trpc.io)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2)
- [Neon Documentation](https://neon.tech/docs)
- [Vercel Documentation](https://vercel.com/docs)
