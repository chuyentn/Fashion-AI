import { GoogleGenAI } from '@google/genai';
import { getVeoModel, AuthMode, DEFAULT_API_BASE_URL, hasValidAuth } from './apiSettings';
import { VideoStructuredPrompt } from '../types';

export interface VideoGenerationConfig {
  prompt: string;
  apiSettings: {
    geminiKey: string;
    authMode: AuthMode;
    baseUrl: string;
    bearerToken?: string;
    cookieString?: string;
    videoModel: 'standard' | 'lite';
  };
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p' | '4k';
  imageBase64?: string;
  imageMimeType?: string;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  isLoading: boolean;
  label: string;
  duration?: number;
}

export async function generateVideo(
  config: VideoGenerationConfig,
  onProgress?: (status: string) => void
): Promise<GeneratedVideo | null> {
  const { prompt, apiSettings, aspectRatio = '9:16', resolution = '720p' } = config;
  const { geminiKey: apiKey, authMode, baseUrl, videoModel } = apiSettings;

  if (!hasValidAuth(apiSettings as any)) {
    throw new Error('Cấu hình API chưa hợp lệ. Vui lòng kiểm tra Cài đặt.');
  }

  const model = getVeoModel(apiSettings.videoModel);

  // --- SDK MODE (API KEY + DEFAULT URL) ---
  if (authMode === 'apikey' && baseUrl === DEFAULT_API_BASE_URL) {
    const ai = new GoogleGenAI({ apiKey });
    try {
      onProgress?.('Đang khởi tạo (SDK)...');
      const videoConfig: any = { aspectRatio };
      if (videoModel === 'standard' && resolution !== '720p') videoConfig.resolution = resolution;

      const params: any = { model, prompt, config: videoConfig };
      if (config.imageBase64 && config.imageMimeType) {
        params.image = { imageBytes: config.imageBase64, mimeType: config.imageMimeType };
      }

      let operation = await ai.models.generateVideos(params);
      let pollCount = 0;
      while (!operation.done && pollCount < 60) {
        pollCount++;
        onProgress?.(`Đang tạo video... (${pollCount * 10}s)`);
        await new Promise(r => setTimeout(r, 10000));
        operation = await (ai as any).operations.getVideosOperation({ operation });
      }

      const response = operation.response;
      if (response?.generatedVideos?.[0]) {
        const video = response.generatedVideos[0];
        let videoUrl = video.video?.uri || '';
        if (!videoUrl && video.video?.videoBytes) {
           videoUrl = `data:video/mp4;base64,${typeof video.video.videoBytes === 'string' ? video.video.videoBytes : btoa(String.fromCharCode(...new Uint8Array(video.video.videoBytes)))}`;
        }
        return { id: `veo-${Date.now()}`, url: videoUrl, isLoading: false, label: `Veo 3.1 (${aspectRatio})`, duration: 8 };
      }
    } catch (err: any) {
      throw new Error(`SDK Error: ${err.message}`);
    }
  }

  // --- REST MODE (Bearer / Cookie / Custom URL) ---
  try {
    onProgress?.('Đang khởi tạo (REST)...');
    const endpoint = `${baseUrl}/v1beta/models/${model}:generateVideos`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    if (authMode === 'apikey') headers['x-goog-api-key'] = apiKey;
    else if (authMode === 'bearer') headers['Authorization'] = `Bearer ${apiSettings.bearerToken}`;
    else if (authMode === 'cookie') headers['Cookie'] = apiSettings.cookieString || '';

    const body: any = {
      prompt,
      videoConfig: { aspectRatio, resolution: videoModel === 'standard' ? resolution : '720p' }
    };
    if (config.imageBase64) {
      body.image = { imageBytes: config.imageBase64, mimeType: config.imageMimeType };
    }

    const startRes = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!startRes.ok) throw new Error(`Khởi tạo thất bại: ${startRes.status}`);
    
    let operation = await startRes.json();
    let pollCount = 0;

    while (!operation.done && pollCount < 60) {
      pollCount++;
      onProgress?.(`Đang tạo (REST)... (${pollCount * 10}s)`);
      await new Promise(r => setTimeout(r, 10000));

      const pollRes = await fetch(`${baseUrl}/v1beta/${operation.name}`, { headers });
      if (pollRes.ok) operation = await pollRes.json();
    }

    if (operation.done && operation.response?.generatedVideos?.[0]) {
      const video = operation.response.generatedVideos[0];
      return { id: `veo-${Date.now()}`, url: video.video?.uri || '', isLoading: false, label: `Veo 3.1 REST`, duration: 8 };
    }
    throw new Error('Không nhận được kết quả video.');
  } catch (err: any) {
    throw new Error(`REST Error: ${err.message}`);
  }
}

export async function generateFashionVideo(
  imageBase64: string,
  imageMimeType: string,
  apiSettings: any,
  options: {
    description?: string;
    structuredPrompt?: VideoStructuredPrompt;
  } = {},
  onProgress?: (status: string) => void
): Promise<GeneratedVideo | null> {
  
  let finalPrompt = '';

  if (options.structuredPrompt) {
    const sp = options.structuredPrompt;
    finalPrompt = `Professional high-quality fashion video. `;
    if (sp.scenePrompt) finalPrompt += `${sp.scenePrompt}. `;
    if (sp.cameraAngle && sp.cameraAngle !== 'Default') finalPrompt += `Camera angle: ${sp.cameraAngle}. `;
    if (sp.speed && sp.speed !== 'Normal') finalPrompt += `Video speed: ${sp.speed}. `;
    if (sp.effects && sp.effects !== 'None') finalPrompt += `Visual effects: ${sp.effects}. `;
    if (sp.transition && sp.transition !== 'None') finalPrompt += `Scene transition: ${sp.transition}. `;
    if (sp.voice) finalPrompt += `Context for dialogue/audio: ${sp.voice}. `;
    finalPrompt += `Cinematic lighting, hyper-realistic, 8k resolution.`;
  } else {
    finalPrompt = `Professional fashion video. ${options.description || 'Fashion Show'}. Model walking on runway, cinematic lighting.`;
  }

  return generateVideo({
    prompt: finalPrompt,
    apiSettings,
    aspectRatio: '9:16',
    resolution: '1080p',
    imageBase64,
    imageMimeType,
  }, onProgress);
}

