
// ====================================================================
// KIE.AI MODEL CATALOG — Fashion-AI Integration
// Registry of available models from kie.ai marketplace
// Docs: https://docs.kie.ai/market/quickstart
// ====================================================================

export type KieModelType = 'image' | 'video' | 'audio' | 'chat';

export type KieImageSubtype =
  | 'text-to-image'
  | 'image-to-image'
  | 'image-edit'
  | 'remove-background'
  | 'upscale'
  | 'reframe';

export type KieVideoSubtype =
  | 'text-to-video'
  | 'image-to-video'
  | 'video-to-video'
  | 'video-upscale'
  | 'video-extend'
  | 'avatar';

export type KieSubtype = KieImageSubtype | KieVideoSubtype | string;

export type KieTier = 'budget' | 'standard' | 'pro' | 'ultra';

export interface KieModel {
  /** API model identifier — sent to createTask */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Provider brand */
  provider: string;
  /** Model category */
  type: KieModelType;
  /** Specific capability */
  subtype: KieSubtype;
  /** Quality/cost tier */
  tier: KieTier;
  /** Short description */
  description: string;
  /** Whether model accepts image input */
  acceptsImage?: boolean;
  /** Whether model accepts video input */
  acceptsVideo?: boolean;
  /** Fashion-AI recommended? */
  recommended?: boolean;
}

// ====================================================================
// IMAGE MODELS — Curated for Fashion Design
// ====================================================================

export const KIE_IMAGE_MODELS: KieModel[] = [
  // --- Flux-2 (Black Forest Labs) ---
  {
    id: 'flux-2/pro-text-to-image',
    name: 'Flux-2 Pro',
    provider: 'Flux',
    type: 'image',
    subtype: 'text-to-image',
    tier: 'pro',
    description: 'Flagship image gen — photorealistic, excellent text rendering',
    recommended: true,
  },
  {
    id: 'flux-2/flex-text-to-image',
    name: 'Flux-2 Flex',
    provider: 'Flux',
    type: 'image',
    subtype: 'text-to-image',
    tier: 'standard',
    description: 'Flexible text-to-image, good balance of speed and quality',
  },
  {
    id: 'flux-2/pro-image-to-image',
    name: 'Flux-2 Pro I2I',
    provider: 'Flux',
    type: 'image',
    subtype: 'image-to-image',
    tier: 'pro',
    description: 'Professional image-to-image transformation',
    acceptsImage: true,
  },
  {
    id: 'flux-2/flex-image-to-image',
    name: 'Flux-2 Flex I2I',
    provider: 'Flux',
    type: 'image',
    subtype: 'image-to-image',
    tier: 'standard',
    description: 'Flexible image-to-image transformation',
    acceptsImage: true,
  },

  // --- Ideogram V3 ---
  {
    id: 'ideogram/v3-text-to-image',
    name: 'Ideogram V3',
    provider: 'Ideogram',
    type: 'image',
    subtype: 'text-to-image',
    tier: 'pro',
    description: 'Best-in-class typography & branding — perfect for fashion labels',
    recommended: true,
  },
  {
    id: 'ideogram/v3-edit',
    name: 'Ideogram V3 Edit',
    provider: 'Ideogram',
    type: 'image',
    subtype: 'image-edit',
    tier: 'pro',
    description: 'Precise image editing with V3 quality',
    acceptsImage: true,
  },
  {
    id: 'ideogram/v3-remix',
    name: 'Ideogram V3 Remix',
    provider: 'Ideogram',
    type: 'image',
    subtype: 'image-to-image',
    tier: 'pro',
    description: 'Style remix while preserving composition',
    acceptsImage: true,
  },

  // --- Google Models ---
  {
    id: 'google/nanobanana2',
    name: 'Nano Banana 2',
    provider: 'Google',
    type: 'image',
    subtype: 'text-to-image',
    tier: 'standard',
    description: 'Google Gemini image gen — fast, natural style',
    recommended: true,
  },
  {
    id: 'google/pro-image-to-image',
    name: 'Nano Banana Pro I2I',
    provider: 'Google',
    type: 'image',
    subtype: 'image-to-image',
    tier: 'pro',
    description: 'Pro-quality image transformation via Gemini',
    acceptsImage: true,
  },
  {
    id: 'google/nano-banana-edit',
    name: 'Nano Banana Edit',
    provider: 'Google',
    type: 'image',
    subtype: 'image-edit',
    tier: 'standard',
    description: 'Gemini-powered image editing',
    acceptsImage: true,
  },
  {
    id: 'google/imagen4-fast',
    name: 'Imagen 4 Fast',
    provider: 'Google',
    type: 'image',
    subtype: 'text-to-image',
    tier: 'standard',
    description: 'Google Imagen 4 — fast mode, high quality',
  },
  {
    id: 'google/imagen4-ultra',
    name: 'Imagen 4 Ultra',
    provider: 'Google',
    type: 'image',
    subtype: 'text-to-image',
    tier: 'ultra',
    description: 'Google Imagen 4 — maximum quality mode',
  },

  // --- GPT Image ---
  {
    id: 'gpt-image/gpt-image-2-text-to-image',
    name: 'GPT Image 2',
    provider: 'OpenAI',
    type: 'image',
    subtype: 'text-to-image',
    tier: 'pro',
    description: 'OpenAI GPT Image 2 — creative, versatile',
  },
  {
    id: 'gpt-image/gpt-image-2-image-to-image',
    name: 'GPT Image 2 I2I',
    provider: 'OpenAI',
    type: 'image',
    subtype: 'image-to-image',
    tier: 'pro',
    description: 'GPT Image 2 — image-to-image editing',
    acceptsImage: true,
  },

  // --- Seedream (Bytedance) ---
  {
    id: 'bytedance/seedream',
    name: 'Seedream 3.0',
    provider: 'Bytedance',
    type: 'image',
    subtype: 'text-to-image',
    tier: 'standard',
    description: 'Clean vector art style, excellent for posters & banners',
  },
  {
    id: 'seedream/5-lite-text-to-image',
    name: 'Seedream 5.0 Lite',
    provider: 'Bytedance',
    type: 'image',
    subtype: 'text-to-image',
    tier: 'budget',
    description: 'Latest Seedream — fast and affordable',
  },

  // --- Grok Imagine ---
  {
    id: 'grok-imagine/text-to-image',
    name: 'Grok Imagine',
    provider: 'xAI',
    type: 'image',
    subtype: 'text-to-image',
    tier: 'standard',
    description: 'xAI Grok image generation',
  },

  // --- Qwen ---
  {
    id: 'qwen2/text-to-image',
    name: 'Qwen2 Image',
    provider: 'Alibaba',
    type: 'image',
    subtype: 'text-to-image',
    tier: 'standard',
    description: 'Qwen2 text-to-image generation',
  },

  // --- Utility: Background Removal & Upscale ---
  {
    id: 'recraft/remove-background',
    name: 'Remove Background',
    provider: 'Recraft',
    type: 'image',
    subtype: 'remove-background',
    tier: 'standard',
    description: 'AI background removal — essential for fashion catalogs',
    acceptsImage: true,
    recommended: true,
  },
  {
    id: 'recraft/crisp-upscale',
    name: 'Crisp Upscale',
    provider: 'Recraft',
    type: 'image',
    subtype: 'upscale',
    tier: 'standard',
    description: 'Detail-preserving image upscaling',
    acceptsImage: true,
  },
  {
    id: 'topaz/image-upscale',
    name: 'Topaz Upscale',
    provider: 'Topaz',
    type: 'image',
    subtype: 'upscale',
    tier: 'pro',
    description: 'Industry-leading AI image upscaling',
    acceptsImage: true,
  },
];

// ====================================================================
// VIDEO MODELS — Curated for Fashion Content
// ====================================================================

export const KIE_VIDEO_MODELS: KieModel[] = [
  // --- Kling ---
  {
    id: 'kling/kling-3-0',
    name: 'Kling 3.0',
    provider: 'Kuaishou',
    type: 'video',
    subtype: 'text-to-video',
    tier: 'pro',
    description: 'Latest Kling — cinematic fashion video generation',
    recommended: true,
  },
  {
    id: 'kling/text-to-video',
    name: 'Kling 2.6 T2V',
    provider: 'Kuaishou',
    type: 'video',
    subtype: 'text-to-video',
    tier: 'standard',
    description: 'Kling 2.6 text-to-video',
  },
  {
    id: 'kling/image-to-video',
    name: 'Kling 2.6 I2V',
    provider: 'Kuaishou',
    type: 'video',
    subtype: 'image-to-video',
    tier: 'standard',
    description: 'Animate a fashion image into video',
    acceptsImage: true,
  },
  {
    id: 'kling/ai-avatar-pro',
    name: 'Kling Avatar Pro',
    provider: 'Kuaishou',
    type: 'video',
    subtype: 'avatar',
    tier: 'pro',
    description: 'AI fashion model avatar generation',
    acceptsImage: true,
  },

  // --- Sora2 (OpenAI) ---
  {
    id: 'sora2/sora-2-text-to-video',
    name: 'Sora2 T2V',
    provider: 'OpenAI',
    type: 'video',
    subtype: 'text-to-video',
    tier: 'pro',
    description: 'OpenAI Sora2 — cinematic quality video',
    recommended: true,
  },
  {
    id: 'sora2/sora-2-image-to-video',
    name: 'Sora2 I2V',
    provider: 'OpenAI',
    type: 'video',
    subtype: 'image-to-video',
    tier: 'pro',
    description: 'Animate images with Sora2 quality',
    acceptsImage: true,
  },
  {
    id: 'sora2/sora-2-pro-text-to-video',
    name: 'Sora2 Pro T2V',
    provider: 'OpenAI',
    type: 'video',
    subtype: 'text-to-video',
    tier: 'ultra',
    description: 'Sora2 Pro — maximum quality video generation',
  },

  // --- Wan (Alibaba) ---
  {
    id: 'wan/2-7-text-to-video',
    name: 'Wan 2.7 T2V',
    provider: 'Alibaba',
    type: 'video',
    subtype: 'text-to-video',
    tier: 'standard',
    description: 'Latest Wan — efficient video generation',
  },
  {
    id: 'wan/2-7-image-to-video',
    name: 'Wan 2.7 I2V',
    provider: 'Alibaba',
    type: 'video',
    subtype: 'image-to-video',
    tier: 'standard',
    description: 'Wan 2.7 image-to-video animation',
    acceptsImage: true,
  },

  // --- Bytedance Seedance ---
  {
    id: 'bytedance/seedance-2',
    name: 'Seedance 2.0',
    provider: 'Bytedance',
    type: 'video',
    subtype: 'text-to-video',
    tier: 'pro',
    description: 'Bytedance Seedance 2.0 — high quality video',
  },
  {
    id: 'bytedance/seedance-2-fast',
    name: 'Seedance 2.0 Fast',
    provider: 'Bytedance',
    type: 'video',
    subtype: 'text-to-video',
    tier: 'standard',
    description: 'Fast mode Seedance for quick previews',
  },

  // --- Hailuo ---
  {
    id: 'hailuo/2-3-image-to-video-pro',
    name: 'Hailuo 2.3 Pro',
    provider: 'MiniMax',
    type: 'video',
    subtype: 'image-to-video',
    tier: 'pro',
    description: 'Hailuo Pro — smooth fashion animation',
    acceptsImage: true,
  },

  // --- Grok Video ---
  {
    id: 'grok-imagine/text-to-video',
    name: 'Grok Video',
    provider: 'xAI',
    type: 'video',
    subtype: 'text-to-video',
    tier: 'standard',
    description: 'xAI Grok video generation',
  },

  // --- Utility ---
  {
    id: 'topaz/video-upscale',
    name: 'Topaz Video Upscale',
    provider: 'Topaz',
    type: 'video',
    subtype: 'video-upscale',
    tier: 'pro',
    description: 'AI video upscaling to 4K',
    acceptsVideo: true,
  },
];

// ====================================================================
// HELPERS
// ====================================================================

/** All models combined */
export const KIE_ALL_MODELS: KieModel[] = [
  ...KIE_IMAGE_MODELS,
  ...KIE_VIDEO_MODELS,
];

/** Get model by ID */
export function getKieModel(modelId: string): KieModel | undefined {
  return KIE_ALL_MODELS.find((m) => m.id === modelId);
}

/** Get recommended models for a type */
export function getRecommendedModels(type: KieModelType): KieModel[] {
  return KIE_ALL_MODELS.filter((m) => m.type === type && m.recommended);
}

/** Get models by provider */
export function getModelsByProvider(provider: string): KieModel[] {
  return KIE_ALL_MODELS.filter(
    (m) => m.provider.toLowerCase() === provider.toLowerCase()
  );
}

/** Get models that accept image input */
export function getImageInputModels(): KieModel[] {
  return KIE_ALL_MODELS.filter((m) => m.acceptsImage);
}

/** Get text-to-image models only */
export function getTextToImageModels(): KieModel[] {
  return KIE_IMAGE_MODELS.filter((m) => m.subtype === 'text-to-image');
}

/** Get text-to-video models only */
export function getTextToVideoModels(): KieModel[] {
  return KIE_VIDEO_MODELS.filter((m) => m.subtype === 'text-to-video');
}

/** Unique providers for UI grouping */
export function getImageProviders(): string[] {
  return [...new Set(KIE_IMAGE_MODELS.map((m) => m.provider))];
}

export function getVideoProviders(): string[] {
  return [...new Set(KIE_VIDEO_MODELS.map((m) => m.provider))];
}
