# Google OAuth Debugging Guide

## Common Issues and Solutions

### 1. Redirect URI Mismatch (Most Common)

**Problem:** Google OAuth fails silently or shows "redirect_uri_mismatch" error.

**Solution:** Ensure your Google Cloud Console has the correct redirect URI:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
5. For production, also add:
   ```
   https://your-domain.com/api/auth/callback/google
   ```

**Important:** The redirect URI must match EXACTLY, including:
- Protocol (http vs https)
- Port number (3000 for localhost)
- Path (`/api/auth/callback/google`)

### 2. OAuth Consent Screen Not Configured

**Problem:** "Access blocked: This app's request is invalid" error.

**Solution:**
1. Go to **APIs & Services** → **OAuth consent screen**
2. Fill in all required fields:
   - App name
   - User support email
   - Developer contact email
3. Add scopes (if needed):
   - `openid`
   - `email`
   - `profile`
4. Add test users (if app is in testing mode)
5. Submit for verification (if making app public)

### 3. Environment Variables Not Loaded

**Problem:** Google sign-in button does nothing or shows no error.

**Check:**
1. Verify `.env.local` has:
   ```
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret"
   ```

2. **Restart your dev server** after changing `.env.local`:
   ```bash
   npm run dev
   ```

3. Check if variables are loaded:
   - Server-side: `process.env.GOOGLE_CLIENT_ID` (in API routes)
   - Client-side: Variables starting with `NEXT_PUBLIC_` are available

### 4. Check Browser Console and Network Tab

**Steps:**
1. Open browser DevTools (F12)
2. Go to **Console** tab - look for errors
3. Go to **Network** tab - look for:
   - Failed requests to `/api/auth/signin/google`
   - Redirects to `accounts.google.com`
   - Callback to `/api/auth/callback/google`

### 5. Test the Auth Endpoint Directly

Visit in your browser:
```
http://localhost:3000/api/auth/signin/google
```

This should redirect you to Google's sign-in page. If it doesn't:
- Check your environment variables
- Check server logs for errors
- Verify the Google provider is configured correctly

### 6. Database Connection Issues

**Problem:** Sign-in works but user isn't created.

**Check:**
1. Verify `DATABASE_URL` is correct
2. Check Prisma adapter is working:
   ```bash
   npx prisma studio
   ```
3. Look for errors in server logs during sign-in

### 7. CORS or Security Issues

**Problem:** Redirect works but callback fails.

**Check:**
1. Ensure `NEXTAUTH_URL` matches your actual URL
2. Check if any browser extensions are blocking requests
3. Try in incognito mode
4. Check server logs for CORS errors

## Quick Checklist

- [ ] Google Cloud Console OAuth client created
- [ ] Redirect URI added: `http://localhost:3000/api/auth/callback/google`
- [ ] OAuth consent screen configured
- [ ] `GOOGLE_CLIENT_ID` in `.env.local`
- [ ] `GOOGLE_CLIENT_SECRET` in `.env.local`
- [ ] `NEXTAUTH_URL` set to `http://localhost:3000`
- [ ] `NEXTAUTH_SECRET` set (generate with `openssl rand -base64 32`)
- [ ] Dev server restarted after env changes
- [ ] Database connected and migrations run
- [ ] Browser console checked for errors
- [ ] Network tab checked for failed requests

## Testing Steps

1. **Click "Continue with Google" button**
2. **Check browser console** for any JavaScript errors
3. **Check Network tab** - should see:
   - Request to `/api/auth/signin/google`
   - Redirect to `accounts.google.com`
   - Callback to `/api/auth/callback/google`
4. **After Google sign-in**, should redirect back to your app
5. **Check if session is created** - user should be logged in

## Still Not Working?

1. **Check server logs** in your terminal where `npm run dev` is running
2. **Try the direct URL**: `http://localhost:3000/api/auth/signin/google`
3. **Verify credentials** in Google Cloud Console match `.env.local`
4. **Check NextAuth logs** - add debug logging:
   ```typescript
   // In auth.ts
   debug: process.env.NODE_ENV === "development",
   ```

