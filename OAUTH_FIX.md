# 🔐 OAuth Redirect Configuration

## Current Setup
App is now deployed to **Firebase Hosting** and **Cloudflare Pages**.

## Firebase Hosting URLs
- **https://fashionstudio-app.web.app/**
- **https://fashionstudio-app.firebaseapp.com/**

## Root Cause of Old Issues
Previous configuration pointed to old Vercel deployment `https://fashion-ai-zeta.vercel.app/`.

## ✅ Solution: Update Supabase & Firebase Redirect URLs

### Step 1: Update Supabase OAuth (if still using Supabase)
1. Go to: https://app.supabase.com/
2. Select project: **xlrarbcrcofcfzzkfotk**
3. Navigate to: **Settings > Auth > URL Configuration**
4. Add these Redirect URLs:

```
http://localhost:3000
http://localhost:3000/auth/callback
https://fashionstudio-app.web.app
https://fashionstudio-app.web.app/auth/callback
https://fashionstudio-app.firebaseapp.com
https://fashionstudio-app.firebaseapp.com/auth/callback
https://fashion.breaths.live
https://fashion.breaths.live/auth/callback
https://fashion-ai.pages.dev
https://fashion-ai.pages.dev/auth/callback
```

5. Click **Save**

### Step 2: Firebase Authentication Setup
1. Go to: https://console.firebase.google.com/project/fashionstudio-app
2. Select: **Authentication > Settings**
3. Authorized Domains already includes:
   - ✅ `fashionstudio-app.web.app`
   - ✅ `fashionstudio-app.firebaseapp.com`
   - ✅ `localhost` (for dev)

### Step 3: Setup Google OAuth
1. Go to: https://console.cloud.google.com/
2. Create/Select project and enable Google+ API
3. Add OAuth Credentials (Web Application)
4. Redirect URIs should include all the URLs from Step 1
5. Copy Client ID and Client Secret to Firebase Console

### Step 4: Add Google OAuth to Firebase
1. Firebase Console > **Authentication > Sign-in method**
2. Enable **Google**
3. Copy OAuth credentials from Google Cloud Console
4. Add custom domain if using `fashion.breaths.live`

### Step 5: Test Locally
```powershell
npm run dev
# Open: http://localhost:3000
# Try: Sign in with Google
# Should redirect back to localhost after auth
```

### Step 6: Deploy
```powershell
npm run build
# Deploy to Firebase Hosting:
firebase deploy --project fashionstudio-app

# Or deploy to Cloudflare Pages via GitHub
```

## ✅ Deployment URLs

| Platform | URL |
|----------|-----|
| **Firebase Hosting** | https://fashionstudio-app.web.app |
| **Firebase Alt** | https://fashionstudio-app.firebaseapp.com |
| **Cloudflare Pages** | https://fashion-ai.pages.dev |
| **Custom Domain** | https://fashion.breaths.live |

## 🔧 Troubleshooting

### Login redirect issues
- Clear browser cookies: `F12 > Application > Cookies > Delete all`
- Verify redirect URLs in Firebase Console
- Check browser console for error messages

### CORS Errors
- Firebase handles CORS automatically for authorized domains
- Ensure domain is added in Firebase > Authentication > Settings

### Test with localhost
```powershell
npm run dev
# Your app runs at: http://localhost:3000
# Firebase allows localhost by default
```

---

**Documentation**: https://firebase.google.com/docs/auth/web
