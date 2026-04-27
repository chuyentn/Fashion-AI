# 🚀 Quick Start Guide

## Step 1: Get Gemini API Key
1. Go to: https://aistudio.google.com/app/apikey
2. Click **"Create API key"**
3. Copy your key

## Step 2: Setup Environment
1. Open `.env.local` file in root directory
2. Paste your key:
   ```
   VITE_GEMINI_API_KEY=paste_your_key_here
   ```

## Step 3: Run Locally
```bash
npm run dev
```
- App opens at: http://localhost:3000

## Step 4: Build for Production
```bash
npm run build
# Output: dist/ folder
```

## Step 5: Deploy to Cloudflare Pages

### Easy Way (Manual Upload):
1. Build: `npm run build`
2. Go to: https://dash.cloudflare.com/
3. Pages > Create project > Upload assets
4. Select `dist/` folder

### Auto Way (GitHub):
See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## ✅ Verification Checklist

- [ ] Node.js installed (`node --version`)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` has `VITE_GEMINI_API_KEY`
- [ ] `npm run dev` works locally
- [ ] App opens at http://localhost:3000
- [ ] Can upload images
- [ ] Gemini API calls work
- [ ] Can build: `npm run build`

## 🆘 Common Issues

### Build fails:
```bash
npm run build  # Test locally first
```

### API not working:
- Check `.env.local` has your key
- Verify key is valid at https://aistudio.google.com/app/apikey
- Check browser console for errors (F12)

### Cloudflare deploy fails:
- Check build command in Cloudflare settings
- Add `VITE_GEMINI_API_KEY` environment variable in Cloudflare Dashboard
- Check Cloudflare build logs

---

**Questions?** Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guide.
