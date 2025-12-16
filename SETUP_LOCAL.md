# Local Development Setup Guide

## Quick Start Steps

### 1. Create `.env.local` file

Create a file named `.env.local` in the `artifex-archive` directory with the following content:

```env
# Database - REQUIRED
# Option 1: Local PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/artifex_archive?schema=public"

# Option 2: Neon (Free cloud PostgreSQL) - Recommended for quick setup
# Get connection string from: https://neon.tech
# DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/artifex_archive?sslmode=require"

# NextAuth - REQUIRED
NEXTAUTH_URL="http://localhost:3000"
# Generate a secret with: openssl rand -base64 32
# Or use this online tool: https://generate-secret.vercel.app/32
NEXTAUTH_SECRET="your-random-secret-key-here-change-this"

# Google OAuth (Optional - for Google sign-in)
# Get credentials from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email Provider (Optional - for email sign-in)
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT=""
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM=""

# Cloudflare R2 (Optional - needed for file uploads)
# Get from: https://dash.cloudflare.com -> R2 -> Manage R2 API Tokens
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_PUBLIC_BUCKET=""
R2_PUBLIC_URL=""

# Admin Access (Optional)
ADMIN_EMAILS=""
```

### 2. Set up Database

#### Option A: Use Neon (Easiest - Free cloud PostgreSQL)
1. Go to https://neon.tech and sign up
2. Create a new project
3. Copy the connection string
4. Paste it as `DATABASE_URL` in `.env.local`

#### Option B: Use Local PostgreSQL
1. Install PostgreSQL on your machine
2. Create a database: `createdb artifex_archive`
3. Update `DATABASE_URL` in `.env.local` with your local credentials

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Run Database Migrations

```bash
npm run prisma:migrate
```

### 5. (Optional) Seed Database with Demo Data

```bash
npm run prisma:seed
```

### 6. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser!

## Minimum Required Setup

For the app to start, you need at minimum:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Set to `http://localhost:3000`
- `NEXTAUTH_SECRET` - Any random string (generate with `openssl rand -base64 32`)

The app will work without:
- Google OAuth (you can skip sign-in or use email)
- Email provider (you can skip sign-in)
- R2 (file uploads won't work, but browsing will)

## Troubleshooting

### Prisma Generate Error
If you get a Prisma validation error, make sure:
1. `.env.local` exists with `DATABASE_URL` set
2. The database connection string is valid
3. Try running: `npx prisma generate` directly

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- For Neon: Make sure to use the connection string with `?sslmode=require`
- For local PostgreSQL: Make sure PostgreSQL is running

### Port Already in Use
If port 3000 is busy, you can change it:
```bash
npm run dev -- -p 3001
```

