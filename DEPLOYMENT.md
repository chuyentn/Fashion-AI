# Deployment Guide - Fashion AI App

## 📋 Prerequisites

### 1. **Gemini API Setup**
- Truy cập: https://aistudio.google.com/app/apikey
- Click "Create API key"
- Copy key vào `.env.local`

### 2. **Supabase** (Đã configured)
- ✅ Đã có credentials trong code
- Supabase URL: `https://xlrarbcrcofcfzzkfotk.supabase.co`

## 🚀 Local Development

```bash
# 1. Cài dependencies
npm install

# 2. Tạo .env.local từ .env.example
cp .env.example .env.local

# 3. Điền GEMINI_API_KEY vào .env.local

# 4. Chạy dev server
npm run dev

# 5. Mở http://localhost:3000
```

## 📤 Deploy lên Cloudflare Pages

### Option 1: Direct Upload (Đơn giản)
```bash
# 1. Build app
npm run build

# 2. Upload thủ công qua Cloudflare Dashboard
#    - Pages > Create a project > Upload assets
#    - Chọn thư mục `dist/`
```

### Option 2: GitHub + Auto Deploy (Khuyến nghị)

#### Step 1: Push lên GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Fashion-AI.git
git push -u origin main
```

#### Step 2: Thiết lập Cloudflare Pages
1. Truy cập https://dash.cloudflare.com/
2. Pages > Create a project > Connect to Git
3. Chọn repo `Fashion-AI`
4. Build settings:
   - **Framework**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Environment variables:
   - Add `VITE_GEMINI_API_KEY` = (your key)

#### Step 3: GitHub Secrets (cho GitHub Actions)
1. Repo Settings > Secrets and variables > Actions
2. Add secrets:
   - `VITE_GEMINI_API_KEY` - Gemini API key
   - `CLOUDFLARE_API_TOKEN` - (từ Cloudflare)
   - `CLOUDFLARE_ACCOUNT_ID` - (từ Cloudflare)

## ✅ Verification

Sau khi deploy:
- Pages URL: `https://fashion-ai.pages.dev`
- Test upload images
- Test Gemini API calls
- Test Supabase integration

## 🔐 Security Checklist
- ✅ API keys trong `.env.local` (KHÔNG commit)
- ✅ `.gitignore` configured
- ✅ GitHub Secrets configured
- ✅ `.env.example` documenting required vars

## 🆘 Troubleshooting

**Build fails:**
- Kiểm tra `npm run build` locally
- Xem Cloudflare build logs

**API calls fail:**
- Verify `GEMINI_API_KEY` set
- Check Supabase connection
- Browser console for errors

**Cold start issues:**
- Cloudflare caches static files - bình thường
- Clear cache qua Dashboard nếu cần
