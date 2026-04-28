
// API Settings storage module — localStorage persistence
// Supports: Gemini (Image + Video), OpenAI (GPT Image 2), and KIE Marketplace
// Auth Modes: API Key | Bearer Token (Labs Ultra) | Cookie Session

export type AuthMode = 'apikey' | 'bearer' | 'cookie';

export interface ApiSettings {
  // Auth mode selection
  authMode: AuthMode;

  // Gemini — used for Image Gen (Nano Banana) + Video Gen (Veo) + Text Analysis
  geminiKey: string;
  geminiModel: 'pro' | 'fast'; // pro = Nano Banana Pro, fast = Nano Banana 2

  // OpenAI — used for GPT Image 2
  openaiKey: string;
  openaiModel: 'gpt-image-2' | 'dall-e-3';

  // Bearer Token — from Google Ultra account (ya29.a0...)
  bearerToken: string;
  googleProjectId: string;

  // Cookie Session — from Labs.Google session
  cookieString: string;

  // Base URL — configurable endpoint
  // Default: Google AI Studio API
  // Alternative: https://labs.google (free with Ultra account)
  baseUrl: string;

  // Video settings
  videoEnabled: boolean;
  videoModel: 'standard' | 'lite'; // standard = Veo 3.1, lite = Veo 3.1 Lite

  // State persistence
  lastUsedService: 'gemini' | 'openai' | 'kie';

  // OpenAI Base URL — configurable endpoint for proxies
  openaiBaseUrl: string;

  // KIE Marketplace — unified multi-model gateway
  // Docs: https://docs.kie.ai
  kieEnabled: boolean;
  kieApiKey: string;
  kieWebhookHmac: string;     // HMAC key for webhook callback verification
  kiePreferredImageModel: string;   // default: 'flux-2/pro-text-to-image'
  kiePreferredVideoModel: string;   // default: 'kling/kling-3-0'
}

// Model ID constants — April 2026 latest
export const GEMINI_MODELS = {
  // Image Generation
  IMAGE_PRO: 'gemini-3-pro-image-preview',       // Nano Banana Pro — professional, Thinking mode
  IMAGE_FAST: 'gemini-3.1-flash-image-preview',   // Nano Banana 2 — fast, cheap, newest
  IMAGE_LEGACY: 'gemini-2.5-flash-image',         // Nano Banana — legacy

  // Text/Analysis only
  TEXT_FAST: 'gemini-2.5-flash',

  // Video Generation
  VIDEO_STANDARD: 'veo-3.1-generate-preview',     // Veo 3.1 — 720p/1080p/4K, native audio
  VIDEO_LITE: 'veo-3.1-lite-generate-preview',    // Veo 3.1 Lite — fast, cheaper
} as const;

export const OPENAI_MODELS = {
  IMAGE: 'gpt-image-2',                           // GPT Image 2 — flagship, Thinking
} as const;

// Labs.Google Flow endpoint (free with Ultra account)
export const LABS_GOOGLE_BASE_URL = 'https://labs.google';
export const DEFAULT_API_BASE_URL = 'https://generativelanguage.googleapis.com';

const STORAGE_KEY = 'fashion-ai-api-settings';

const DEFAULT_SETTINGS: ApiSettings = {
  authMode: 'apikey',
  geminiKey: import.meta.env?.VITE_GEMINI_API_KEY || '',
  geminiModel: 'fast',    // Default to Nano Banana 2 (fast + cheap)
  openaiKey: import.meta.env?.VITE_API_KEY || '',
  openaiModel: 'gpt-image-2',
  bearerToken: '',
  googleProjectId: '',
  cookieString: '',
  baseUrl: DEFAULT_API_BASE_URL,
  videoEnabled: false,
  videoModel: 'standard',
  lastUsedService: 'gemini',
  openaiBaseUrl: 'https://api.openai.com/v1',
  // KIE Marketplace defaults
  kieEnabled: !!(import.meta.env?.VITE_KIE_API_KEY),
  kieApiKey: import.meta.env?.VITE_KIE_API_KEY || '',
  kieWebhookHmac: import.meta.env?.VITE_KIE_WEBHOOK_HMAC || '',
  kiePreferredImageModel: import.meta.env?.VITE_KIE_DEFAULT_IMAGE_MODEL || 'flux-2/pro-text-to-image',
  kiePreferredVideoModel: import.meta.env?.VITE_KIE_DEFAULT_VIDEO_MODEL || 'kling/kling-3-0',
};

// Helper: get defaults based on auth mode
export function getModeAwareDefaults(mode: AuthMode): Partial<ApiSettings> {
  switch (mode) {
    case 'apikey':
      return { baseUrl: DEFAULT_API_BASE_URL, geminiModel: 'fast' };
    case 'bearer':
    case 'cookie':
      return { baseUrl: LABS_GOOGLE_BASE_URL, geminiModel: 'pro' }; // Labs usually gives Pro
    default:
      return {};
  }
}


export function loadApiSettings(): ApiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveApiSettings(settings: ApiSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save API settings', e);
  }
}

// Helper: get the active Gemini image model ID
export function getGeminiImageModel(tier: 'pro' | 'fast'): string {
  return tier === 'pro' ? GEMINI_MODELS.IMAGE_PRO : GEMINI_MODELS.IMAGE_FAST;
}

// Helper: get the active Veo video model ID
export function getVeoModel(tier: 'standard' | 'lite'): string {
  return tier === 'standard' ? GEMINI_MODELS.VIDEO_STANDARD : GEMINI_MODELS.VIDEO_LITE;
}

// Helper: get the effective API key based on auth mode
export function getEffectiveApiKey(settings: ApiSettings): string {
  switch (settings.authMode) {
    case 'apikey':
      return settings.geminiKey;
    case 'bearer':
      return settings.bearerToken;
    case 'cookie':
      return settings.cookieString;
    default:
      return settings.geminiKey;
  }
}

// Helper: check if a Gemini key looks valid
export function isValidGeminiKey(key: string): boolean {
  return key.trim().length > 10 && key.trim().startsWith('AIza');
}

// Helper: check if an OpenAI key looks valid
export function isValidOpenAIKey(key: string): boolean {
  return key.trim().length > 10 && key.trim().startsWith('sk-');
}

// Helper: check if a Bearer token looks valid
export function isValidBearerToken(token: string): boolean {
  return token.trim().length > 20 && token.trim().startsWith('ya29.');
}

// Helper: check if Cookie string looks valid
export function isValidCookieString(cookie: string): boolean {
  return cookie.trim().length > 20;
}

// Helper: check if a KIE API key looks valid (32-char hex)
export function isValidKieKey(key: string): boolean {
  return /^[a-f0-9]{32}$/i.test(key.trim());
}

// Helper: mask an API key for display
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '••••••••';
  return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
}

// Helper: check if any auth is configured
export function hasValidAuth(settings: ApiSettings): boolean {
  switch (settings.authMode) {
    case 'apikey':
      return isValidGeminiKey(settings.geminiKey);
    case 'bearer':
      return isValidBearerToken(settings.bearerToken);
    case 'cookie':
      return isValidCookieString(settings.cookieString);
    default:
      return false;
  }
}

// Helper: get auth mode display name
export function getAuthModeLabel(mode: AuthMode): string {
  switch (mode) {
    case 'apikey': return 'API Key (Google AI Studio)';
    case 'bearer': return 'Bearer Token (Labs Ultra)';
    case 'cookie': return 'Cookie Session (Labs)';
    default: return 'Unknown';
  }
}

// ========================================
// VERIFY CONNECTIVITY
// ========================================

export async function verifyGeminiKey(settings: ApiSettings): Promise<{ ok: boolean; message: string }> {
  try {
    if (settings.authMode === 'apikey') {
      if (!settings.geminiKey) return { ok: false, message: 'Chưa nhập Gemini API Key.' };
      
      const url = `${settings.baseUrl}/v1beta/models?key=${settings.geminiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const modelCount = data.models?.length || 0;
        return { ok: true, message: `✅ Kết nối thành công! ${modelCount} models khả dụng.` };
      } else {
        const err = await res.json().catch(() => ({}));
        return { ok: false, message: `❌ API Key không hợp lệ: ${err.error?.message || res.statusText}` };
      }
    } else if (settings.authMode === 'bearer') {
      if (!settings.bearerToken) return { ok: false, message: 'Chưa nhập Bearer Token.' };
      
      const url = `${settings.baseUrl}/v1beta/models`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${settings.bearerToken}` }
      });
      if (res.ok) {
        return { ok: true, message: '✅ Bearer Token hợp lệ! Kết nối Labs.Google thành công.' };
      } else {
        return { ok: false, message: `❌ Bearer Token không hợp lệ hoặc hết hạn. Status: ${res.status}` };
      }
    } else {
      // Cookie mode — basic check
      if (!settings.cookieString) return { ok: false, message: 'Chưa nhập Cookie.' };
      return { ok: true, message: '⚠️ Cookie đã lưu. Không thể verify trực tiếp từ browser (CORS).' };
    }
  } catch (e: any) {
    return { ok: false, message: `❌ Lỗi kết nối: ${e.message}` };
  }
}

export async function verifyOpenAIKey(key: string, baseUrl: string = 'https://api.openai.com/v1'): Promise<{ ok: boolean; message: string }> {
  if (!key) return { ok: false, message: 'Chưa nhập OpenAI API Key.' };
  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    if (res.ok) {
      return { ok: true, message: '✅ OpenAI Key hợp lệ!' };
    } else {
      return { ok: false, message: `❌ OpenAI Key không hợp lệ. Status: ${res.status}` };
    }
  } catch (e: any) {
    return { ok: false, message: `❌ Lỗi kết nối OpenAI: ${e.message}` };
  }
}

export async function verifyKieKey(key: string): Promise<{ ok: boolean; message: string }> {
  if (!key) return { ok: false, message: 'Chưa nhập KIE API Key.' };
  if (!isValidKieKey(key)) return { ok: false, message: '❌ KIE Key không đúng định dạng (cần 32 ký tự hex).' };
  try {
    const res = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=verify_check`, {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    if (res.status === 401) {
      return { ok: false, message: '❌ KIE API Key không hợp lệ (401).' };
    }
    const data = await res.json();
    if (data.code === 401) {
      return { ok: false, message: `❌ KIE xác thực thất bại: ${data.msg}` };
    }
    return { ok: true, message: '✅ KIE Marketplace kết nối thành công!' };
  } catch (e: any) {
    return { ok: false, message: `❌ Lỗi kết nối KIE: ${e.message}` };
  }
}

// ========================================
// PROJECT EXPORT / IMPORT
// ========================================

export interface ProjectExport {
  version: string;
  exportedAt: string;
  settings: ApiSettings;
  // Additional data can be added here
}

export function exportProject(settings: ApiSettings): string {
  const project: ProjectExport = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    settings: { ...settings, geminiKey: '', openaiKey: '', bearerToken: '', cookieString: '' }, // Don't export secrets
  };
  return JSON.stringify(project, null, 2);
}

export function importProject(json: string): ApiSettings | null {
  try {
    const project: ProjectExport = JSON.parse(json);
    if (project.version && project.settings) {
      // Merge imported settings, keeping current secrets
      const current = loadApiSettings();
      return {
        ...current,
        ...project.settings,
        // Keep current secrets — don't overwrite with empty
        geminiKey: current.geminiKey,
        openaiKey: current.openaiKey,
        bearerToken: current.bearerToken,
        cookieString: current.cookieString,
      };
    }
    return null;
  } catch {
    return null;
  }
}
