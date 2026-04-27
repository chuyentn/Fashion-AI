<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/5395799a-83f0-443a-a0d2-a971053c06ef

## Run Locally

**Prerequisites:**  Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` file from `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

3. Get your Gemini API key from: https://aistudio.google.com/app/apikey
   - Copy to `.env.local`: `VITE_GEMINI_API_KEY=your_key_here`

4. Run the app:
   ```bash
   npm run dev
   ```
   - Open: http://localhost:3000

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in UI mode
npm test:ui

# Generate coverage report
npm test:coverage
```

## 📤 Deploy to Cloudflare Pages

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.
