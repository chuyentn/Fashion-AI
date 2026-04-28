
// ====================================================================
// KIE.AI SERVICE — Unified Multi-Model API Gateway
// Fashion-AI Integration — Async Task Pattern
// Base: https://api.kie.ai/api/v1
// Auth: Bearer Token
// Flow: createTask → poll recordInfo → extract resultUrls
// ====================================================================

import type { KieModel } from './kieModels';
import { getKieModel } from './kieModels';

// ====================================================================
// TYPES
// ====================================================================

export type KieTaskState =
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export interface KieCreateTaskRequest {
  model: string;
  callBackUrl?: string;
  input: Record<string, unknown>;
}

export interface KieCreateTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

export interface KieTaskDetail {
  taskId: string;
  model: string;
  state: KieTaskState;
  param: string;            // JSON string of original request
  resultJson: string;       // JSON string — parse for { resultUrls: string[] }
  failCode: string;
  failMsg: string;
  costTime: number;         // ms
  completeTime: number;     // unix timestamp ms
  createTime: number;       // unix timestamp ms
  updateTime: number;       // unix timestamp ms
}

export interface KieTaskDetailResponse {
  code: number;
  msg: string;
  data: KieTaskDetail;
}

export interface KieResultData {
  resultUrls: string[];
  [key: string]: unknown;
}

/** Normalized result after polling completes */
export interface KieGenerationResult {
  taskId: string;
  model: string;
  modelInfo?: KieModel;
  state: KieTaskState;
  urls: string[];
  costTimeMs: number;
  error?: string;
  raw?: KieTaskDetail;
}

/** Options for image generation */
export interface KieImageGenOptions {
  prompt: string;
  imageSize?: string;         // e.g. 'square_hd', '1024x1024', '16:9'
  aspectRatio?: string;       // e.g. '1:1', '3:4', '16:9'
  guidanceScale?: number;
  seed?: number;
  numImages?: number;
  imageUrl?: string;          // for image-to-image
  negativePrompt?: string;
  callBackUrl?: string;
}

/** Options for video generation */
export interface KieVideoGenOptions {
  prompt: string;
  duration?: number;          // seconds
  aspectRatio?: string;
  imageUrl?: string;          // for image-to-video
  callBackUrl?: string;
}

/** Polling configuration */
export interface KiePollOptions {
  intervalMs?: number;        // default: 3000
  timeoutMs?: number;         // default: 300000 (5 min)
  onProgress?: (state: KieTaskState, elapsed: number) => void;
}

// ====================================================================
// CONSTANTS
// ====================================================================

const KIE_BASE_URL = 'https://api.kie.ai/api/v1';
const DEFAULT_POLL_INTERVAL = 3000;     // 3 seconds
const DEFAULT_POLL_TIMEOUT = 300_000;   // 5 minutes
const MAX_RETRIES = 2;

// ====================================================================
// CORE SERVICE CLASS
// ====================================================================

export class KieService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /** Update API key (e.g. from Settings) */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /** Check if API key is configured */
  hasKey(): boolean {
    return this.apiKey.length > 10;
  }

  // ------------------------------------------------------------------
  // LOW-LEVEL API
  // ------------------------------------------------------------------

  /** Create a new generation task */
  async createTask(request: KieCreateTaskRequest): Promise<KieCreateTaskResponse> {
    const res = await this.fetchWithRetry(`${KIE_BASE_URL}/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data: KieCreateTaskResponse = await res.json();

    if (data.code !== 200) {
      throw new KieApiError(
        `KIE createTask failed: ${data.msg}`,
        data.code,
        request.model
      );
    }

    return data;
  }

  /** Query task status/result */
  async getTaskDetail(taskId: string): Promise<KieTaskDetail> {
    const url = `${KIE_BASE_URL}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`;

    const res = await this.fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    const data: KieTaskDetailResponse = await res.json();

    if (data.code !== 200) {
      throw new KieApiError(
        `KIE getTaskDetail failed: ${data.msg}`,
        data.code,
        taskId
      );
    }

    return data.data;
  }

  // ------------------------------------------------------------------
  // POLLING MECHANISM
  // ------------------------------------------------------------------

  /**
   * Poll a task until it completes (success/failed/timeout).
   * Returns normalized KieGenerationResult.
   */
  async pollUntilComplete(
    taskId: string,
    options: KiePollOptions = {}
  ): Promise<KieGenerationResult> {
    const interval = options.intervalMs ?? DEFAULT_POLL_INTERVAL;
    const timeout = options.timeoutMs ?? DEFAULT_POLL_TIMEOUT;
    const startTime = Date.now();

    while (true) {
      const elapsed = Date.now() - startTime;

      if (elapsed > timeout) {
        return {
          taskId,
          model: '',
          state: 'timeout',
          urls: [],
          costTimeMs: elapsed,
          error: `Task timed out after ${Math.round(timeout / 1000)}s`,
        };
      }

      try {
        const detail = await this.getTaskDetail(taskId);

        // Report progress
        options.onProgress?.(detail.state as KieTaskState, elapsed);

        // Terminal states
        if (detail.state === 'success') {
          return this.normalizeResult(detail);
        }

        if (detail.state === 'failed') {
          return {
            taskId: detail.taskId,
            model: detail.model,
            modelInfo: getKieModel(detail.model),
            state: 'failed',
            urls: [],
            costTimeMs: detail.costTime || elapsed,
            error: detail.failMsg || 'Task failed without error message',
            raw: detail,
          };
        }

        // Still processing — wait and retry
        await this.sleep(interval);
      } catch (err) {
        // Network error during polling — retry after interval
        console.warn(`[KIE] Poll error for ${taskId}, retrying...`, err);
        await this.sleep(interval);
      }
    }
  }

  // ------------------------------------------------------------------
  // HIGH-LEVEL: IMAGE GENERATION
  // ------------------------------------------------------------------

  /**
   * Generate image(s) via KIE marketplace model.
   * Returns URLs of generated images.
   */
  async generateImage(
    modelId: string,
    options: KieImageGenOptions,
    pollOptions?: KiePollOptions
  ): Promise<KieGenerationResult> {
    // Build input payload
    const input: Record<string, unknown> = {
      prompt: options.prompt,
    };

    if (options.imageSize) input.image_size = options.imageSize;
    if (options.aspectRatio) input.aspect_ratio = options.aspectRatio;
    if (options.guidanceScale != null) input.guidance_scale = options.guidanceScale;
    if (options.seed != null) input.seed = options.seed;
    if (options.numImages) input.num_images = options.numImages;
    if (options.imageUrl) input.image_url = options.imageUrl;
    if (options.negativePrompt) input.negative_prompt = options.negativePrompt;

    const request: KieCreateTaskRequest = {
      model: modelId,
      input,
    };
    if (options.callBackUrl) request.callBackUrl = options.callBackUrl;

    console.log(`[KIE] 🎨 Creating image task: ${modelId}`);
    const createRes = await this.createTask(request);
    console.log(`[KIE] ✅ Task created: ${createRes.data.taskId}`);

    // Poll for result
    return this.pollUntilComplete(createRes.data.taskId, pollOptions);
  }

  // ------------------------------------------------------------------
  // HIGH-LEVEL: VIDEO GENERATION
  // ------------------------------------------------------------------

  /**
   * Generate video via KIE marketplace model.
   * Video tasks typically take 30s–5min.
   */
  async generateVideo(
    modelId: string,
    options: KieVideoGenOptions,
    pollOptions?: KiePollOptions
  ): Promise<KieGenerationResult> {
    const input: Record<string, unknown> = {
      prompt: options.prompt,
    };

    if (options.duration) input.duration = options.duration;
    if (options.aspectRatio) input.aspect_ratio = options.aspectRatio;
    if (options.imageUrl) input.image_url = options.imageUrl;

    const request: KieCreateTaskRequest = {
      model: modelId,
      input,
    };
    if (options.callBackUrl) request.callBackUrl = options.callBackUrl;

    console.log(`[KIE] 🎬 Creating video task: ${modelId}`);
    const createRes = await this.createTask(request);
    console.log(`[KIE] ✅ Task created: ${createRes.data.taskId}`);

    // Video tasks need longer polling — default 5s interval, 10min timeout
    const videoPollOptions: KiePollOptions = {
      intervalMs: pollOptions?.intervalMs ?? 5000,
      timeoutMs: pollOptions?.timeoutMs ?? 600_000,
      onProgress: pollOptions?.onProgress,
    };

    return this.pollUntilComplete(createRes.data.taskId, videoPollOptions);
  }

  // ------------------------------------------------------------------
  // CONNECTIVITY CHECK
  // ------------------------------------------------------------------

  /**
   * Verify API key by attempting a lightweight operation.
   * Since KIE doesn't have a dedicated /ping endpoint,
   * we query a known non-existent task to check auth.
   */
  async verifyConnection(): Promise<{ ok: boolean; message: string }> {
    if (!this.hasKey()) {
      return { ok: false, message: 'KIE API Key chưa được cấu hình.' };
    }

    try {
      const url = `${KIE_BASE_URL}/jobs/recordInfo?taskId=test_connection_check`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (res.status === 401) {
        return { ok: false, message: '❌ KIE API Key không hợp lệ (401 Unauthorized).' };
      }

      // Any 200 response (even "task not found") means auth works
      const data = await res.json();
      if (data.code === 401) {
        return { ok: false, message: `❌ Xác thực thất bại: ${data.msg}` };
      }

      return {
        ok: true,
        message: '✅ KIE API Key hợp lệ! Kết nối Marketplace thành công.',
      };
    } catch (err: any) {
      return {
        ok: false,
        message: `❌ Lỗi kết nối KIE: ${err.message}`,
      };
    }
  }

  // ------------------------------------------------------------------
  // INTERNAL HELPERS
  // ------------------------------------------------------------------

  /** Parse resultJson into normalized result */
  private normalizeResult(detail: KieTaskDetail): KieGenerationResult {
    let urls: string[] = [];

    try {
      if (detail.resultJson) {
        const parsed: KieResultData = JSON.parse(detail.resultJson);
        urls = parsed.resultUrls || [];
      }
    } catch {
      console.warn(`[KIE] Failed to parse resultJson for ${detail.taskId}`);
    }

    return {
      taskId: detail.taskId,
      model: detail.model,
      modelInfo: getKieModel(detail.model),
      state: 'success',
      urls,
      costTimeMs: detail.costTime || 0,
      raw: detail,
    };
  }

  /** Fetch with automatic retry on network errors */
  private async fetchWithRetry(
    url: string,
    init: RequestInit,
    retries: number = MAX_RETRIES
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, init);

        // Don't retry on auth errors
        if (res.status === 401 || res.status === 403) {
          return res;
        }

        // Retry on server errors
        if (res.status >= 500 && attempt < retries) {
          await this.sleep(1000 * (attempt + 1));
          continue;
        }

        return res;
      } catch (err: any) {
        lastError = err;
        if (attempt < retries) {
          await this.sleep(1000 * (attempt + 1));
        }
      }
    }

    throw lastError || new Error('KIE fetch failed after retries');
  }

  /** Async sleep helper */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ====================================================================
// ERROR CLASS
// ====================================================================

export class KieApiError extends Error {
  code: number;
  model: string;

  constructor(message: string, code: number, model: string) {
    super(message);
    this.name = 'KieApiError';
    this.code = code;
    this.model = model;
  }
}

// ====================================================================
// SINGLETON FACTORY
// ====================================================================

let _instance: KieService | null = null;

/** Get or create the global KieService instance */
export function getKieService(): KieService {
  if (!_instance) {
    const key = import.meta.env?.VITE_KIE_API_KEY || '';
    _instance = new KieService(key);
  }
  return _instance;
}

/** Re-initialize with a new key (e.g. from Settings UI) */
export function resetKieService(apiKey: string): KieService {
  _instance = new KieService(apiKey);
  return _instance;
}
