# Quick Deploy Commands

Copy and paste these commands in PowerShell:

## 1. Setup GitHub (FIRST TIME ONLY)

```powershell
cd d:\All Tool\Fashion-AI

git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

## 2. Add & Commit (First Time)

```powershell
git add .
git commit -m "Initial commit: Fashion AI app ready for production"
```

## 3. Push to GitHub

Replace `YOUR_USERNAME` with your GitHub username:

```powershell
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Fashion-AI.git
git push -u origin main
```

## 4. For Future Updates

```powershell
git add .
git commit -m "Describe your changes here"
git push
```

---

That's it! Check Cloudflare Pages in 1-2 minutes - it will be live! 🎉
