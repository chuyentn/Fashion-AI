
// OpenAI GPT Image 2 — Image Generation Service
// Uses the OpenAI Images API for high-quality image generation
// Docs: https://platform.openai.com/docs/api-reference/images

import { GeneratedImage, ImageFile } from '../types';
import { ApiSettings, OPENAI_MODELS } from './apiSettings';

/**
 * Generate images using OpenAI GPT Image 2 (DALL-E 3)
 * Note: DALL-E 3 typically handles 1 image at a time and doesn't natively support 
 * multi-image input like Gemini. We synthesize the prompt from reference images.
 */
export async function generateWithOpenAI(
  referenceImages: ImageFile[],
  productImages: ImageFile[],
  prompt: string,
  outputCount: number,
  resolution: string,
  aspectRatio: string,
  apiSettings: ApiSettings,
  onImageGenerated?: (img: GeneratedImage) => void
): Promise<GeneratedImage[]> {
  const apiKey = apiSettings.openaiKey;

  if (!apiKey || !apiKey.startsWith('sk-')) {
    throw new Error('OpenAI API key không hợp lệ. Vui lòng kiểm tra lại trong Cài đặt.');
  }

  // Synthesize a detailed prompt if we have product images
  // In a real "Fashion-AI" context, we might use GPT-4o to describe the images first.
  // For now, we enhance the user prompt.
  const basePrompt = prompt || "Professional fashion photography";
  const enhancedPrompt = `${basePrompt}. High quality fashion shot, cinematic lighting, 8k resolution, photorealistic.`;

  const results: GeneratedImage[] = [];
  const totalGenerations = productImages.length * outputCount;

  // We loop through each product and generate requested variations
  for (let i = 0; i < totalGenerations; i++) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(`${apiSettings.baseUrl}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: OPENAI_MODELS.IMAGE,
            prompt: enhancedPrompt,
            n: 1,
            size: resolution === '1K' ? '1024x1024' : '1024x1792', // Approximation
            quality: 'standard',
            response_format: 'b64_json',
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          const status = response.status;

          if (status === 429 && attempt < 2) {
            const backoff = 2000 * Math.pow(2, attempt) + Math.random() * 1000;
            await new Promise(r => setTimeout(r, backoff));
            continue;
          }
          throw new Error(`OpenAI API error (${status}): ${errBody}`);
        }

        const data = await response.json();

        if (data.data && data.data.length > 0) {
          const imgData = data.data[0];
          const newImage: GeneratedImage = {
            id: `openai-${Date.now()}-${i}`,
            url: imgData.b64_json
              ? `data:image/png;base64,${imgData.b64_json}`
              : imgData.url || '',
            isLoading: false,
            label: `GPT Image 2 #${i + 1}`,
          };

          results.push(newImage);
          if (onImageGenerated) onImageGenerated(newImage);
        }
        break; // Success

      } catch (err: any) {
        if (attempt >= 2) throw err;
      }
    }
  }

  return results;
}

// Edit function remains for potential future use
export async function editWithOpenAI(
  imageBase64: string,
  prompt: string,
  apiKey: string,
  quality: 'standard' | 'hd' = 'standard'
): Promise<GeneratedImage | null> {
  // Implementation for DALL-E 2 edit or DALL-E 3 variation would go here
  return null;
}
