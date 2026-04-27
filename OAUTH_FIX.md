# 🔐 Fix Supabase OAuth Redirect Issue

## Problem
After login, you're redirected to: `https://fashion-ai-zeta.vercel.app/` instead of your deployment URL.

## Root Cause
Supabase OAuth is configured to only redirect to the original repository's domain.

## ✅ Solution: Update Supabase Redirect URLs

### Step 1: Access Supabase Dashboard
1. Go to: https://app.supabase.com/
2. Sign in with your account
3. Select project: **xlrarbcrcofcfzzkfotk**

### Step 2: Add Authorized Redirect URLs
1. Navigate to: **Settings > Auth > URL Configuration**
2. Find **Redirect URLs** section
3. Click **Add URL** and add these URLs:

```
http://localhost:3000
http://localhost:3000/auth/callback
https://fashion-ai.pages.dev
https://fashion-ai.pages.dev/auth/callback
```

**If you have a custom domain, also add:**
```
https://your-custom-domain.com
https://your-custom-domain.com/auth/callback
```

4. Click **Save**

### Step 3: Verify Google OAuth Setup
1. In Supabase dashboard > **Auth > Providers**
2. Check if **Google** is enabled
3. Verify the OAuth credentials are correct

### Step 4: Test Locally
```bash
npm run dev
```
- Go to: http://localhost:3000
- Try login with Google
- Should work and stay on localhost

### Step 5: Deploy to Cloudflare Pages
```bash
npm run build
# Deploy dist/ folder to Cloudflare Pages
```

## 🆘 If Still Having Issues

### Check Browser Console (F12)
- Auth errors appear in console
- Check for CORS or redirect URI mismatch

### Verify Redirect URL Format
- Must include full URL: `https://domain.com`
- Not just `domain.com`
- Include `/auth/callback` path for callback-based flows

### Clear Cookies
1. Open DevTools (F12)
2. Application > Cookies
3. Delete all cookies for the domain
4. Reload and try again

### Create New Supabase Project (Last Resort)
If issues persist, create a fresh Supabase project configured specifically for your deployment.

## Environment Variables (Optional)

If you need to use a different Supabase project, add to `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

The app will use these instead of defaults.

---

**Need help?** Check Supabase Auth troubleshooting: https://supabase.com/docs/guides/auth
