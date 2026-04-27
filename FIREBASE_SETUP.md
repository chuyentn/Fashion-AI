# 🚀 Firebase Setup & Deployment Guide

## ✅ What's Ready

Your Fashion AI app is now configured for Firebase with:
- ✅ Firebase Authentication (Google + Email)
- ✅ Firestore Database
- ✅ Firebase Storage for images
- ✅ Firebase Hosting deployment

## 📋 Prerequisites

### 1. Firebase Project Already Setup
✅ Done! You have:
- Project: `fashionstudio-app`
- Region: `asia-southeast1`
- API Key: `AIzaSyCQQqTCftUhAHjnwR1sBAc5YCKCLgwVzlQ`

### 2. Create Firestore Database
1. Go to: https://console.firebase.google.com/project/fashionstudio-app
2. Click **Firestore Database**
3. **Create Database**
   - Location: **asia-southeast1** (or nearest to you)
   - Start in **Test mode** (for development)
4. **Create**

Wait ~2 minutes for database to initialize.

### 3. Enable Authentication Methods
1. In Firebase console > **Authentication**
2. **Get started** > **Sign-in method**
3. Enable:
   - ✅ **Email/Password** - Toggle ON
   - ✅ **Google** - Toggle ON
     - Add your email as authorized domain

### 4. Configure Storage
1. In Firebase console > **Storage**
2. **Get started**
   - Security rules: Keep **Test mode** for now
3. **Done**

## 🔒 Firestore Security Rules

After testing, update rules for production:

1. Go to **Firestore Database > Rules**
2. Replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read/write their own profile
    match /profiles/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Users can read/write their own projects
    match /projects/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // Admin can manage resources
    match /admin_resources/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

3. **Publish**

## 🎯 Build & Deploy Locally

### Step 1: Build
```bash
cd d:\All Tool\Fashion-AI
npm run build
```
Wait for `dist/` folder to be created.

### Step 2: Test Locally
```bash
firebase serve
# Open: http://localhost:5000
```

### Step 3: Deploy to Firebase Hosting
```bash
firebase login  # First time only - opens browser to authorize
firebase deploy
```

## 🌐 Your Live URL

After deployment:
```
https://fashionstudio-app.web.app
https://fashionstudio-app.firebaseapp.com
```

Choose one as your main domain (usually .web.app is prettier).

## ✨ Features Working

After deployment, these features work:

### Authentication
- ✅ Google Sign In
- ✅ Email/Password Sign Up
- ✅ Password Reset
- ✅ Persistent Sessions

### Database
- ✅ User profiles
- ✅ Design history
- ✅ Admin resources library
- ✅ Extracted results

### Storage
- ✅ Image uploads (refs, products, generated images)
- ✅ Admin resource management
- ✅ Download generated images

## 🔄 Migration from Supabase (Optional)

If you had data in Supabase:

```bash
# Export from Supabase
# Import to Firestore
# OR manually recreate data
```

For now, you're starting fresh with Firebase.

## 📝 Update App Code

The app automatically uses Firebase if configured. To switch back to Supabase:
- Edit `App.tsx`
- Import from `services/supabase` instead of `services/firebase`

## 🚨 Production Checklist

Before going live:

- [ ] Enable **production security rules** in Firestore
- [ ] Set custom domain (optional)
- [ ] Enable HTTPS (automatic with Firebase)
- [ ] Setup monitoring & analytics
- [ ] Test on multiple devices
- [ ] Add privacy policy
- [ ] Setup Google OAuth properly

## 📞 Support

Firebase Docs: https://firebase.google.com/docs
Firestore: https://firebase.google.com/docs/firestore
Hosting: https://firebase.google.com/docs/hosting

---

**Next Step:** Follow "Build & Deploy Locally" section to go live! 🎉
