
import { GoogleGenAI } from "@google/genai";
import { ImageFile, GeneratedImage, FaceHideType, ModelTier, AspectRatio, TextLanguage, FontStyleKey, DetectedItem } from "../types";
import { GEMINI_MODELS, getGeminiImageModel } from "./apiSettings";

// Model mapping — April 2026 latest
// BASIC -> gemini-3.1-flash-image-preview (Nano Banana 2 — fast, cheap)
// PRO -> gemini-3-pro-image-preview (Nano Banana Pro — high quality, Thinking)
const getModelName = (tier: ModelTier) => {
  return tier === 'PRO' ? GEMINI_MODELS.IMAGE_PRO : GEMINI_MODELS.IMAGE_FAST;
};

const ANALYSIS_MODEL = GEMINI_MODELS.TEXT_FAST; // Faster model for JSON analysis

const FONT_STYLE_PROMPTS: Record<FontStyleKey, string> = {
  'AUTO': 'Typography Style: Analyze the "Vibe Reference" image and the Product Identity to select the most matching font style automatically.',
  'BEAUTY': 'Typography Style: Elegant, sophisticated, thin serif or high-contrast sans-serif fonts. Use soft curves, italics, or calligraphy suited for high-end beauty and fashion brands. Delicate and airy.',
  'CUTE': 'Typography Style: Playful, decorative, rounded, or hand-written styles. Add cute elements (doodles, hearts) around text if appropriate. Friendly and approachable vibes.',
  'YOUTH': 'Typography Style: Youthful, dynamic, pop-art inspired. Use bold colors, sticker effects, outlines, or 3D text effects. High energy and fun.',
  'MODERN': 'Typography Style: Clean, modern, minimalist sans-serif. Swiss style. Legible, trustworthy, and corporate. Structured layout with clear hierarchy.',
  'RETRO': 'Typography Style: Vintage, retro, 70s/80s/90s vibe. Use textured fonts, groovy curves, or classic serif fonts with ornamental details. Nostalgic feel.',
  'BOLD': 'Typography Style: Bold, heavy weight, condensed fonts. High impact, loud, and attention-grabbing. Use for big sales or strong statements.'
};

const VISION_STRUCT_PROMPT = `
ROLE & OBJECTIVE
You are VisionStruct, an advanced Computer Vision & Data Serialization Engine. Your sole purpose is to ingest visual input (images) and transcode discernible visual elements—both macro and micro—into a rigorous, machine-readable JSON format.

CORE DIRECTIVE
Do not summarize. Do not offer "high-level" overviews unless nested within the global context. You must capture maximal visual data available in the image. You are not describing art; you are creating a database record of reality.

ANALYSIS PROTOCOL
Before generating the final JSON, perform a silent "Visual Sweep" (internal processing only):
Macro Sweep: Identify the scene type, global lighting, atmosphere, and primary subjects.
Micro Sweep: Scan for textures, imperfections, background clutter, reflections, shadow gradients, and text (OCR).
Relationship Sweep: Map the spatial and semantic connections between objects.

OUTPUT FORMAT (STRICT)
You must return ONLY a single valid JSON object wrapped in a markdown code block (json ... ).
No conversational filler before or after the code block.
Ensure all string values are properly escaped.

USE THE FOLLOWING SCHEMA:
{
"meta": { "image_quality": "string", "image_type": "string" },
"global_context": { "scene_description": "string", "lighting": { "source": "string", "direction": "string", "quality": "string", "color_temp": "string" } },
"composition": { "camera_angle": "string", "framing": "string", "depth_of_field": "string" },
"objects": [ { "label": "string", "category": "string", "prominence": "Foreground/Background", "visual_attributes": { "color": "string", "texture": "string", "material": "string" }, "pose_or_orientation": "string" } ]
}
`;

// Helper to analyze image first
async function analyzeReferenceImage(ai: GoogleGenAI, image: ImageFile): Promise<string> {
  // Uses the text-only model for analysis — no process.env needed, ai instance already has the key
  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: {
        parts: [
          { text: VISION_STRUCT_PROMPT },
          { inlineData: { mimeType: image.mimeType, data: image.base64 } }
        ]
      }
    });
    
    // Extract JSON from markdown code block if present
    let text = response.text || "";
    const jsonMatch = text.match(/```json([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1].trim();
    }
    return text;
  } catch (e) {
    console.warn("Analysis failed, proceeding with raw image context", e);
    return "Analysis unavailable.";
  }
}

// --- STRICT SUBTLE VARIATION LOGIC ---
// Modified to ensure 99% Pose adherence. Removed random pose changes.
const SUBTLE_VARIATIONS = {
  LIGHTING: [
    "Lighting: Exact match to reference source and intensity.",
    "Lighting: Enhance contrast slightly while keeping original direction.",
    "Lighting: Soften shadows slightly, maintain original mood.",
    "Lighting: Cinematic color grading based on reference."
  ]
};

const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const getStyleVariation = (index: number): string => {
  const lighting = getRandomItem(SUBTLE_VARIATIONS.LIGHTING);

  // For the first shot, strictly enforce the reference
  if (index === 0) {
      return "PRIORITY: 100% Structural Clone. Identical Pose. Identical Camera Angle. Identical Lighting.";
  }

  // For subsequent shots, only tweak lighting/color slightly, NEVER pose.
  return `PRIORITY: 99% Structural Clone. ${lighting} Keep pose and composition locked.`;
}

// --- CORE API HANDLER (Supports SDK & RAW FETCH) ---

export async function callGeminiAPI(
    apiKey: string,
    model: string,
    contents: any,
    config: any,
    settings: { authMode: AuthMode, baseUrl: string, bearerToken?: string, cookieString?: string }
) {
    // Mode 1: API KEY + Default URL -> Use Official SDK
    if (settings.authMode === 'apikey' && settings.baseUrl === DEFAULT_API_BASE_URL) {
        const ai = new GoogleGenAI({ apiKey });
        const modelInstance = ai.getGenerativeModel({ model });
        
        // Use generateContent for images
        if (config.imageConfig) {
            return await ai.models.generateContent({
                model,
                contents,
                config
            });
        }
        
        // Use specialized methods if needed, but for now we generalize to raw fetch for anything complex
    }

    // Mode 2 & 3: Bearer/Cookie or Custom URL -> Use Raw Fetch
    const endpoint = `${settings.baseUrl}/v1beta/models/${model}:generateContent`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (settings.authMode === 'apikey') {
        headers['x-goog-api-key'] = apiKey;
    } else if (settings.authMode === 'bearer') {
        headers['Authorization'] = `Bearer ${settings.bearerToken}`;
    } else if (settings.authMode === 'cookie') {
        headers['Cookie'] = settings.cookieString || '';
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            contents: contents.parts ? [contents] : contents, // Normalize format
            generationConfig: config
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Normalize response for the service logic
    return {
        candidates: data.candidates || []
    };
}

export const generateFashionShots = async (
  referenceImages: ImageFile[],
  productImages: ImageFile[],
  userPrompt: string,
  count: number,
  resolution: '1K' | '2K' | '4K',
  aspectRatio: AspectRatio,
  modelTier: ModelTier,
  useAnalysisMode: boolean,
  faceHideEnabled: boolean,
  faceHideType: FaceHideType,
  overlayText: string,
  textLanguage: TextLanguage,
  fontStyle: FontStyleKey,
  apiSettings: { 
    geminiKey: string, 
    authMode: AuthMode, 
    baseUrl: string, 
    bearerToken?: string, 
    cookieString?: string 
  },
  onImageGenerated?: (img: GeneratedImage) => void
): Promise<GeneratedImage[]> => {
  const { geminiKey: apiKey } = apiSettings;
  if (!hasValidAuth(apiSettings as any)) throw new Error('Cấu hình API chưa hợp lệ. Vui lòng kiểm tra Cài đặt.');
  
  const activeModel = getModelName(modelTier);
  
  // 1. Analysis if needed
  let structuralAnalysis = "";
  if (useAnalysisMode && referenceImages.length > 0) {
    try {
        const analysisRes = await callGeminiAPI(apiKey, ANALYSIS_MODEL, {
            parts: [
                { text: VISION_STRUCT_PROMPT },
                { inlineData: { mimeType: referenceImages[0].mimeType, data: referenceImages[0].base64 } }
            ]
        }, {}, apiSettings as any);
        
        let text = analysisRes.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonMatch = text.match(/```json([\s\S]*?)```/);
        structuralAnalysis = (jsonMatch && jsonMatch[1]) ? jsonMatch[1].trim() : text;
    } catch (e) {
        console.warn("Analysis failed", e);
    }
  }

  // ... (Pose & Text instructions remain same as before)
  let poseInstruction = "MANDATORY: Maintain the Reference Image pose, body language, and head position exactly (99% match).";
  if (faceHideEnabled) {
     switch (faceHideType) {
        case 'PHONE_SELFIE': poseInstruction = "MODIFICATION: Change ONLY the arm/hand to hold a phone covering the face (Mirror Selfie). Keep body pose and background identical to Reference."; break;
        case 'BACK_TURNED': poseInstruction = "MODIFICATION: Turn the model around (Back View) while maintaining the original background context and lighting vibe."; break;
        case 'CROP_FACE': poseInstruction = "COMPOSITION: Crop the frame strictly below the nose. Do not change the body pose."; break;
        case 'PROP_OBSCURED': poseInstruction = "MODIFICATION: Add a natural prop (camera, flowers, magazine) or hand gesture to hide the face. Keep the rest of the pose 99% identical to Reference."; break;
     }
  }

  let textInstruction = "";
  if (overlayText && overlayText.trim().length > 0) {
     const typographyPrompt = FONT_STYLE_PROMPTS[fontStyle] || FONT_STYLE_PROMPTS['AUTO'];
     textInstruction = `TEXT OVERLAY TASK: Render text: "${overlayText}"\nLanguage: ${textLanguage}\n${typographyPrompt}\nEnsure text is stylish and does not obscure main product details.`;
  }

  const baseSystemInstructions = useAnalysisMode ? `
      Role: High-Fidelity Fashion AI (Nano Banana Pro).
      Task: Reconstruct the Reference Scene exactly, swapping the garment for the Product.
      RULES: Match Pose (99%), Anatomy, and Lighting exactly.
      ${poseInstruction}
      ${textInstruction}
  ` : `
      Role: Expert Fashion Photographer AI (Clone Mode).
      Task: Virtual Try-On / Style Transfer.
      RULES: Copy Reference Pose, Composition, and Background pixel-perfectly (99%).
      ${poseInstruction}
      ${textInstruction}
  `;

  const imageConfig: any = { aspectRatio };
  if (modelTier === 'PRO') imageConfig.imageSize = resolution;

  const tasks: (() => Promise<GeneratedImage | null>)[] = [];

  for (const product of productImages) {
    const basePromptParts: any[] = [ { text: baseSystemInstructions } ];
    if (useAnalysisMode) {
      basePromptParts.push({ text: `STRUCTURAL BLUEPRINT (JSON):\n${structuralAnalysis}` });
      basePromptParts.push({ text: "PRIMARY VISUAL BLUEPRINT (Reference):" });
      basePromptParts.push({ inlineData: { mimeType: referenceImages[0].mimeType, data: referenceImages[0].base64 } });
    } else {
      basePromptParts.push({ text: "STRUCTURAL REFERENCE (CLONE THIS POSE & BACKGROUND):" });
      referenceImages.forEach(ref => basePromptParts.push({ inlineData: { mimeType: ref.mimeType, data: ref.base64 } }));
    }
    basePromptParts.push({ text: "TARGET GARMENT (APPLY THIS TEXTURE/ITEM):" });
    basePromptParts.push({ inlineData: { mimeType: product.mimeType, data: product.base64 } });

    for (let i = 0; i < count; i++) {
        const variationText = getStyleVariation(i);
        const finalParts = [...basePromptParts, { text: `${userPrompt || "Fashion photography."}\n${variationText}\nEnsure the final image looks exactly like the Reference Image but with the new product.` }];

        tasks.push(async () => {
            for(let attempt = 0; attempt < 5; attempt++) {
                try {
                    const res = await callGeminiAPI(apiKey, activeModel, { parts: finalParts }, { imageConfig }, apiSettings as any);
                    const candidates = res.candidates;
                    if (candidates && candidates.length > 0) {
                        for (const part of candidates[0].content.parts) {
                            if (part.inlineData) {
                                const img = { id: `gen-${Date.now()}-${product.id}-${i}`, url: `data:image/png;base64,${part.inlineData.data}`, parentProductId: product.id, isLoading: false } as GeneratedImage;
                                if (onImageGenerated) onImageGenerated(img);
                                return img;
                            }
                        }
                    }
                } catch (err: any) {
                    const msg = err.message || "";
                    if ((msg.includes('500') || msg.includes('overloaded') || msg.includes('fetch')) && attempt < 4) {
                        await new Promise(r => setTimeout(r, 2000 * Math.pow(1.5, attempt)));
                        continue;
                    }
                    break;
                }
            }
            return null;
        });
    }
  }

  const results: (GeneratedImage | null)[] = [];
  const executing: Promise<void>[] = [];
  for (const task of tasks) {
      const p = task().then(res => { results.push(res); });
      executing.push(p);
      p.then(() => { executing.splice(executing.indexOf(p), 1); }).catch(() => { executing.splice(executing.indexOf(p), 1); });
      if (executing.length >= 4) await Promise.race(executing);
  }
  await Promise.all(executing);
  const final = results.filter((res): res is GeneratedImage => res !== null);
  if (final.length === 0) throw new Error("Không tạo được ảnh. Vui lòng thử lại.");
  return final;
};

// 1. Detection Phase (Simplified to use callGeminiAPI)
export const detectImageObjects = async (image: ImageFile, apiSettings: any): Promise<DetectedItem[]> => {
    try {
        const res = await callGeminiAPI(apiSettings.geminiKey, GEMINI_MODELS.TEXT_FAST, {
            parts: [
                { text: "Analyze this fashion image. Identify items (Top, Bottom, Shoes, etc.), Background, and Model. Output JSON: { \"items\": [ { \"name\": \"Vietnamese Name\", \"type\": \"GARMENT\"|\"ACCESSORY\"|\"BACKGROUND\"|\"MODEL\", \"description\": \"Vietnamese description\" } ] }" },
                { inlineData: { mimeType: image.mimeType, data: image.base64 } }
            ]
        }, { responseMimeType: 'application/json' }, apiSettings);

        const text = res.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const json = JSON.parse(text);
        return (json.items || []).map((item: any, idx: number) => ({ id: `det-${idx}`, name: item.name, type: item.type, description: item.description }));
    } catch (e) {
        return [{ id: '1', name: 'Trang phục', type: 'GARMENT', description: 'Trang phục chính' }];
    }
}

// 2. Generation Phase (Simplified to use callGeminiAPI)
export const generateExtractedProduct = async (
    image: ImageFile,
    itemsToExtract: DetectedItem[],
    quality: '1K' | '2K' | '4K',
    aspectRatio: AspectRatio,
    generateMasterImage: boolean,
    apiSettings: any,
    onImageGenerated?: (img: GeneratedImage) => void
): Promise<GeneratedImage[]> => {
    const model = GEMINI_MODELS.IMAGE_PRO;
    const imageConfig = { aspectRatio, imageSize: quality };

    const tasks = itemsToExtract.map((item, index) => async () => {
        let prompt = "";
        if (item.type === 'BACKGROUND') prompt = "BACKGROUND Extraction: Reconstruct the empty background (room/env). Remove human subject. Inpaint missing areas. Studio photography.";
        else if (item.type === 'MODEL') prompt = "MODEL Regeneration: Full body portrait on Pure White. Identity Match 100%. If cropped, outpaint legs/shoes.";
        else prompt = `PRODUCT Extraction: Isolate "${item.name}" (${item.description}) on Pure White (#FFFFFF). Remove model/body parts. Front-facing Ghost Mannequin. Studio lighting.`;
        
        try {
            const res = await callGeminiAPI(apiSettings.geminiKey, model, { parts: [{ text: prompt }, { inlineData: { mimeType: image.mimeType, data: image.base64 } }] }, { imageConfig }, apiSettings);
            const part = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
            if (part) {
                const img = { id: `ext-${Date.now()}-${index}`, url: `data:image/png;base64,${part.inlineData.data}`, isLoading: false, label: item.name };
                if (onImageGenerated) onImageGenerated(img);
                return img;
            }
        } catch (e) { console.error(e); }
        return null;
    });

    if (generateMasterImage) {
        const itemNames = itemsToExtract.filter(i => i.type !== 'BACKGROUND' && i.type !== 'MODEL').map(i => i.name).join(", ");
        if (itemNames) {
            tasks.push(async () => {
                try {
                    const prompt = `MASTER Image: Premium Outfit Flat Lay of [${itemNames}]. Clean White background. Organized artistic composition. No human. High detail.`;
                    const res = await callGeminiAPI(apiSettings.geminiKey, model, { parts: [{ text: prompt }, { inlineData: { mimeType: image.mimeType, data: image.base64 } }] }, { imageConfig }, apiSettings);
                    const part = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
                    if (part) {
                        const img = { id: `ext-master-${Date.now()}`, url: `data:image/png;base64,${part.inlineData.data}`, isLoading: false, label: "Bộ sưu tập (Flat Lay)" };
                        if (onImageGenerated) onImageGenerated(img);
                        return img;
                    }
                } catch (e) { console.error(e); }
                return null;
            });
        }
    }

    const results = await Promise.all(tasks.map(t => t()));
    return results.filter((res): res is GeneratedImage => res !== null);
};

// --- IMAGE VARIATION (Simplified to use callGeminiAPI) ---
export const generateImageVariation = async (
  imageBase64: string,
  imageMimeType: string,
  variationType: 'expression' | 'lighting' | 'angle' | 'style',
  apiSettings: any,
  onImageGenerated?: (img: GeneratedImage) => void
): Promise<GeneratedImage | null> => {
  const model = GEMINI_MODELS.IMAGE_PRO;
  const prompt = {
    'expression': 'CHANGE: Adjust model facial expression/mood. KEEP: 100% same outfit, background, pose, lighting.',
    'lighting': 'CHANGE: Adjust lighting (Golden hour, Studio, Rim light). KEEP: 100% same outfit, model, pose.',
    'angle': 'CHANGE: Shift camera angle slightly. KEEP: 100% same outfit, model identity, background.',
    'style': 'CHANGE: Different photography style (Vintage, Street, Editorial). KEEP: 100% same outfit, model, pose.'
  }[variationType] || 'CHANGE: Adjust expression.';

  try {
    const res = await callGeminiAPI(apiSettings.geminiKey, model, { parts: [{ text: `TASK: Fashion Variation.\n${prompt}\nQUALITY: 4K Photorealistic.` }, { inlineData: { mimeType: imageMimeType, data: imageBase64 } }] }, { imageConfig: { aspectRatio: '3:4' } }, apiSettings);
    const part = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (part) {
      const img = { id: `var-${Date.now()}`, url: `data:image/png;base64,${part.inlineData.data}`, isLoading: false, label: `Biến thể (${variationType})` };
      if (onImageGenerated) onImageGenerated(img);
      return img;
    }
  } catch (e) { console.error(e); }
  return null;
};

// Helper to convert File to Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data);
      } else {
        reject(new Error("Failed to process file"));
      }
    };
    reader.onerror = error => reject(error);
  });
};
