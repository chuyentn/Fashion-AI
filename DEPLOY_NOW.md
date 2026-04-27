# 🚀 Firebase Hosting - Deploy in 3 Steps

## ✅ Build Complete!
Your app is built in `dist/` folder, ready for deployment.

## Step 1: Setup Firebase Firestore (One-time - 5 min)

1. Go to: https://console.firebase.google.com/project/fashionstudio-app
2. **Firestore Database** → **Create Database**
   - Location: **asia-southeast1**
   - Start in: **Test mode**
   - Click **Create**
3. **Authentication** → **Get started**
   - Enable **Email/Password**
   - Enable **Google**
4. **Storage** → **Get started** (keeps test mode for dev)

## Step 2: Deploy to Firebase Hosting (One-time - 5 min)

### Option A: Using Firebase Console (Simplest)

1. Go to: https://console.firebase.google.com/project/fashionstudio-app/hosting
2. Click **Get Started**
3. Choose **Deploy using Firebase CLI** or **Upload dist/ manually**
4. If using CLI:
   ```powershell
   npm install -g firebase-tools
   firebase login
   firebase deploy
   ```
5. If uploading manually:
   - Zip `dist/` folder
   - Upload in Firebase console

### Option B: Using Firebase CLI (Recommended)

```powershell
# Step 1: Install Firebase CLI (one-time)
npm install -g firebase-tools

# Step 2: Authorize (opens browser)
firebase login

# Step 3: Deploy
cd d:\All Tool\Fashion-AI
firebase deploy
```

Your app is now live at:
- **https://fashionstudio-app.web.app**
- **https://fashionstudio-app.firebaseapp.com**

## Step 3: Test Your App

1. Open: https://fashionstudio-app.web.app
2. Click "Đăng nhập với Google"
3. Test upload & generate images
4. Check your images in Firestore Database

## ✨ What's Working

✅ Google Sign In
✅ Email/Password Auth
✅ User profiles
✅ Image uploads to Firebase Storage
✅ Design history in Firestore
✅ Admin resources library
✅ All features from local version

## 🔐 Production Security (Later)

After initial launch, update Firestore rules in Firebase console:

```
Go to: Firestore Database > Rules

Replace with production rules from FIREBASE_SETUP.md
```

## 📱 Custom Domain (Optional)

To use https://fashion.breaths.live:

1. Firebase console > **Hosting** > **Custom domain**
2. Add domain: `fashion.breaths.live`
3. Follow DNS setup instructions

## 🆘 Troubleshooting

### Deploy fails
- Check: `firebase projects:list`
- Should show: `fashionstudio-app`

### App shows blank screen
- Check browser console (F12)
- Verify Firebase config in .env.local
- Check Firestore security rules aren't blocking

### Images not uploading
- Verify Firebase Storage rules allow uploads
- Check storage bucket exists in Firebase console

---

**Estimated time to live: 10 minutes** ⏱️

Next step: Run `firebase deploy` in terminal! 🎉
