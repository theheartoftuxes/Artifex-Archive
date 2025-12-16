# Deployment Guide - Vercel + Neon + R2

This guide walks you through deploying Artifex Archive to Vercel with Neon Postgres and Cloudflare R2.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Neon account (free tier works)
- Cloudflare account (free tier works)

## Step 1: Push to GitHub

```bash
git add .
git commit -m "chore: phase-4-polish - search, uploads, admin, deploy-ready"
git push origin main
```

## Step 2: Set Up Neon Postgres

1. **Create Neon Account:**
   - Go to [neon.tech](https://neon.tech)
   - Sign up for free account
   - Create a new project

2. **Get Connection String:**
   - In Neon dashboard, go to your project
   - Click "Connection Details"
   - Copy the connection string (it will look like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)

3. **Enable Connection Pooling:**
   - Neon automatically provides connection pooling
   - For Vercel, use the pooled connection string (adds `?pgbouncer=true`)
   - Or use the direct connection string (Neon handles pooling automatically)

4. **Run Migrations:**
   ```bash
   # Set your Neon connection string
   export DATABASE_URL="postgresql://..."
   
   # Run migrations
   npx prisma migrate deploy
   
   # Generate Prisma Client
   npx prisma generate
   ```

## Step 3: Set Up Cloudflare R2

1. **Create R2 Bucket:**
   - Go to Cloudflare Dashboard → R2
   - Click "Create bucket"
   - Name it (e.g., `artifex-archive-media`)
   - Set it to public access (or configure custom domain later)

2. **Generate API Tokens:**
   - Go to R2 → Manage R2 API Tokens
   - Click "Create API token"
   - Give it a name (e.g., "Vercel Deployment")
   - Set permissions: Object Read & Write
   - Copy the Access Key ID and Secret Access Key

3. **Get Account ID:**
   - In Cloudflare Dashboard, go to any page
   - Your Account ID is in the right sidebar

4. **Set Public URL:**
   - If using default R2.dev URL: `https://your-bucket-name.r2.dev`
   - If using custom domain: Your custom domain URL

## Step 4: Deploy to Vercel

1. **Import Project:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository

2. **Configure Build Settings:**
   - Framework Preset: Next.js
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next` (default)
   - Install Command: `npm install`

3. **Set Environment Variables:**
   
   Go to Project Settings → Environment Variables and add:

   ### Database
   ```
   DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
   **Note:** For Neon, you can use either the direct connection string or the pooled one. Neon handles connection pooling automatically.

   ### NextAuth
   ```
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-secret-key-here
   ```
   Generate secret: `openssl rand -base64 32`

   ### OAuth Providers (Google)
   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```
   Get from [Google Cloud Console](https://console.cloud.google.com)

   ### Cloudflare R2
   ```
   R2_ACCOUNT_ID=your-r2-account-id
   R2_ACCESS_KEY_ID=your-r2-access-key-id
   R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
   R2_PUBLIC_BUCKET=your-bucket-name
   R2_PUBLIC_URL=https://your-bucket-name.r2.dev
   ```

   ### Admin Access (Optional)
   ```
   ADMIN_EMAILS=your@email.com,another@email.com
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-app.vercel.app`

## Step 5: Run Post-Deployment Migrations

After first deployment, run migrations:

```bash
# Set DATABASE_URL to your Neon connection string
export DATABASE_URL="postgresql://..."

# Run migrations
npx prisma migrate deploy
```

Or use Vercel CLI:
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

## Step 6: Add Custom Domain (Optional)

1. **In Vercel Dashboard:**
   - Go to Project Settings → Domains
   - Add your domain
   - Follow DNS configuration instructions

2. **Update Environment Variables:**
   - Update `NEXTAUTH_URL` to your custom domain
   - Update `R2_PUBLIC_URL` if using custom domain for R2

## Step 7: Enable Vercel Analytics & Speed Insights

1. **In Vercel Dashboard:**
   - Go to your project
   - Click "Analytics" tab
   - Enable "Web Analytics" (free tier available)
   - Enable "Speed Insights" (free tier available)

2. **Add to Your App:**
   The analytics are automatically enabled when you deploy. No code changes needed for basic analytics.

   For Speed Insights, add to `src/app/layout.tsx`:
   ```tsx
   import { SpeedInsights } from '@vercel/speed-insights/next';
   
   // In your layout component:
   <SpeedInsights />
   ```

## Step 8: Verify Deployment

1. **Test Authentication:**
   - Visit your deployed site
   - Try signing in with Google

2. **Test File Upload:**
   - Go to `/upload`
   - Upload a test file
   - Verify it appears in library

3. **Test Search:**
   - Use the search bar
   - Verify results appear

4. **Check Admin (if configured):**
   - Sign in with admin email
   - Visit `/admin`
   - Verify admin dashboard works

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Neon dashboard for connection status
- Ensure migrations have run: `npx prisma migrate deploy`

### R2 Upload Failures
- Verify all R2 credentials are correct
- Check bucket permissions
- Verify `R2_PUBLIC_URL` is accessible

### Build Failures
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `prisma generate` runs before build

### Authentication Issues
- Verify `NEXTAUTH_URL` matches your deployment URL
- Check OAuth provider credentials
- Ensure `NEXTAUTH_SECRET` is set

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Database migrations run successfully
- [ ] R2 bucket configured and accessible
- [ ] Custom domain configured (if using)
- [ ] Analytics and Speed Insights enabled
- [ ] Authentication tested
- [ ] File upload tested
- [ ] Search functionality tested
- [ ] Admin dashboard tested (if configured)
- [ ] Mobile responsiveness verified
- [ ] SSL certificate active (automatic with Vercel)

## Monitoring

- **Vercel Dashboard:** View deployments, logs, analytics
- **Neon Dashboard:** Monitor database performance
- **Cloudflare Dashboard:** Monitor R2 usage and bandwidth

## Support

For issues:
- Check Vercel deployment logs
- Check Neon connection status
- Verify all environment variables
- Review application logs in Vercel dashboard

