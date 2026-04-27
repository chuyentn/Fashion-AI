# 🔐 OAuth Redirect Configuration

## Current Setup
App uses **Supabase Auth** for authentication.

## ✅ Supabase Auth Configuration

### Step 1: Update Supabase OAuth Redirect URLs
1. Go to: https://supabase.com/dashboard/project/csesonwxvgvkozfbtpvb
2. Navigate to: **Authentication > URL Configuration**
3. Set **Site URL**: `https://YOUR_DOMAIN_HERE`
4. Add these **Redirect URLs**:

```
http://localhost:3000
http://localhost:3000/auth/callback
https://YOUR_CLOUDFLARE_PAGES_URL
https://YOUR_CLOUDFLARE_PAGES_URL/auth/callback
```

5. Click **Save**

### Step 2: Enable Auth Providers
1. Go to: **Authentication > Providers**
2. Enable:
   - ✅ **Email** - Toggle ON
   - ✅ **Google** - Configure with Google Cloud OAuth credentials

### Step 3: Google OAuth Setup
1. Go to: https://console.cloud.google.com/
2. Create/Select project and enable Google+ API
3. Add OAuth Credentials (Web Application)
4. Redirect URIs should include all the URLs from Step 1
5. Copy Client ID and Client Secret to Supabase Auth > Google provider

### Step 4: Test Locally
```powershell
npm run dev
# Open: http://localhost:3000
# Try: Sign in with Google
# Should redirect back to localhost after auth
```

### Step 5: Deploy
```powershell
npm run build
# Deploy to Cloudflare Pages via GitHub
```

## 🔧 Troubleshooting

### Login redirect issues
- Clear browser cookies: `F12 > Application > Cookies > Delete all`
- Verify redirect URLs in Supabase Dashboard
- Check browser console for error messages

### CORS Errors
- Ensure domain is added in Supabase Auth > URL Configuration

### Test with localhost
```powershell
npm run dev
# Your app runs at: http://localhost:3000
# Supabase allows localhost by default
```

---

**Documentation**: https://supabase.com/docs/guides/auth
