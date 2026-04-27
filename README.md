<div align="center">
<img width="1200" height="475" alt="Fashion Studio AI" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🎨 Fashion Studio AI - Product Shot Generation

AI-powered fashion photography app. Upload any garment and generate professional product shots in multiple styles and poses.

## 🚀 Live Deployments

- **Supabase Project**: https://csesonwxvgvkozfbtpvb.supabase.co

## ✨ Features

- ✅ Google Sign-In & Email Auth (Supabase Auth)
- ✅ AI-powered image generation (Gemini + OpenAI)
- ✅ Pose preservation (99% accuracy)
- ✅ Product detection & auto-extraction
- ✅ Face hiding options (pixelate, back view, phone)
- ✅ Text overlay with custom fonts
- ✅ Design history & resource library
- ✅ Cloud storage (Supabase Storage)

## 🛠️ Run Locally

**Prerequisites**: Node.js 18+, npm 9+

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment**:
   ```bash
   cp .env.example .env.local
   ```
   
   Add your API keys to `.env.local`:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_key_here
   VITE_API_KEY=sk-proj-your-openai-key-here
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```
   
   Open: http://localhost:3000

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with UI dashboard
npm test:ui

# Generate coverage report
npm test:coverage

# Run linting
npm lint
```

## 📦 Build for Production

```bash
npm run build
# Output: dist/ folder (ready for deployment)
```

## 🚀 Deploy

### Cloudflare Pages

Push to GitHub, Cloudflare auto-deploys on every push.

See [DEPLOYMENT.md](DEPLOYMENT.md) for details.

## 🔧 Configuration

- **Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Cloudflare**: [GITHUB_CLOUDFLARE.md](GITHUB_CLOUDFLARE.md)
- **OAuth/Auth**: [OAUTH_FIX.md](OAUTH_FIX.md)
