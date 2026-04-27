
import { GoogleGenAI } from "@google/genai";
import { ImageFile, GeneratedImage, FaceHideType, ModelTier, AspectRatio, TextLanguage, FontStyleKey, DetectedItem } from "../types";

// Mapping based on User Request & Google Guidelines
// Basic -> gemini-2.5-flash-image (Nano Banana)
// Pro -> gemini-3-pro-image-preview (Nano Banana Pro)
const getModelName = (tier: ModelTier) => {
  return tier === 'PRO' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
};

const ANALYSIS_MODEL = 'gemini-2.5-flash'; // Faster model for JSON analysis

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
};

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
  onImageGenerated?: (img: GeneratedImage) => void // New callback
): Promise<GeneratedImage[]> => {
  const activeModel = getModelName(modelTier);
  const apiKey = (modelTier === 'PRO' || activeModel.includes('pro')) ? (process.env.API_KEY || process.env.GEMINI_API_KEY) : process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  
  // 1. If Analysis Mode is ON, analyze the PRIMARY reference
  let structuralAnalysis = "";
  if (useAnalysisMode && referenceImages.length > 0) {
    structuralAnalysis = await analyzeReferenceImage(ai, referenceImages[0]);
  }

  // Determine Pose Instruction based on Face Hide Config
  // NOTE: We prioritize "Strict Pose" unless Face Hide requires a structural change.
  let poseInstruction = "MANDATORY: Maintain the Reference Image pose, body language, and head position exactly (99% match).";
  
  if (faceHideEnabled) {
     switch (faceHideType) {
        case 'PHONE_SELFIE':
           poseInstruction = "MODIFICATION: Change ONLY the arm/hand to hold a phone covering the face (Mirror Selfie). Keep body pose and background identical to Reference.";
           break;
        case 'BACK_TURNED':
           poseInstruction = "MODIFICATION: Turn the model around (Back View) while maintaining the original background context and lighting vibe.";
           break;
        case 'CROP_FACE':
           poseInstruction = "COMPOSITION: Crop the frame strictly below the nose. Do not change the body pose.";
           break;
        case 'PROP_OBSCURED':
           poseInstruction = "MODIFICATION: Add a natural prop (camera, flowers, magazine) or hand gesture to hide the face. Keep the rest of the pose 99% identical to Reference.";
           break;
     }
  }

  // Determine Text Instruction
  let textInstruction = "";
  if (overlayText && overlayText.trim().length > 0) {
     const typographyPrompt = FONT_STYLE_PROMPTS[fontStyle] || FONT_STYLE_PROMPTS['AUTO'];
     textInstruction = `
       TEXT OVERLAY TASK:
       Render text: "${overlayText}"
       Language: ${textLanguage}
       ${typographyPrompt}
       Ensure text is stylish and does not obscure the main product details.
     `;
  }

  // 2. Build the System Prompt (Strict Adherence Mode)
  let baseSystemInstructions = "";
  if (useAnalysisMode) {
    baseSystemInstructions = `
      Role: High-Fidelity Fashion AI (Nano Banana Pro).
      Input 1: Reference Analysis. Input 2: Product Image.
      Task: Reconstruct the Reference Scene exactly, swapping the garment for the Product.
      
      CRITICAL STRUCTURAL RULES:
      1. POSE & ANGLE: Copy the reference image's pose, camera angle, and framing with 99% accuracy.
      2. ANATOMY: Do not change body type, height, or skin tone unless implied by the Product context.
      3. LIGHTING: Match the shadow fall-off and highlights exactly.
      
      ${poseInstruction}
      ${textInstruction}
      
      Output: Photorealistic, 4K quality. No CGI artifacts.
    `;
  } else {
    baseSystemInstructions = `
      Role: Expert Fashion Photographer AI (Clone Mode).
      Task: Virtual Try-On / Style Transfer.
      
      EXECUTION STRICTNESS: HIGH.
      You must act as a 'Texture/Garment Swapper' on the provided Reference Image structure.
      
      CORE DIRECTIVES:
      - COPY the Reference Image's pose, composition, and background pixel-perfectly (99%).
      - WEAR the Target Product on the subject naturally.
      - PRESERVE folds, lighting, and physics of the reference scene.
      
      ${poseInstruction}
      ${textInstruction}
    `;
  }

  // 3. Configure Image Generation Parameters
  const imageConfig: any = {
      aspectRatio: aspectRatio,
  };
  if (modelTier === 'PRO') {
      imageConfig.imageSize = resolution;
  }

  // 4. Create Generation Tasks
  type GenerationTask = () => Promise<GeneratedImage | null>;
  const tasks: GenerationTask[] = [];

  for (const product of productImages) {
    
    const basePromptParts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [
      { text: baseSystemInstructions },
    ];

    if (useAnalysisMode) {
      basePromptParts.push({ text: `STRUCTURAL BLUEPRINT (JSON):\n${structuralAnalysis}` });
      // If we have strict strictness, we might rely heavily on the image itself, but JSON helps with details.
      basePromptParts.push({ text: "PRIMARY VISUAL BLUEPRINT (Reference):" });
      basePromptParts.push({ inlineData: { mimeType: referenceImages[0].mimeType, data: referenceImages[0].base64 } });
    } else {
      basePromptParts.push({ text: "STRUCTURAL REFERENCE (CLONE THIS POSE & BACKGROUND):" });
      referenceImages.forEach(ref => {
         basePromptParts.push({ inlineData: { mimeType: ref.mimeType, data: ref.base64 } });
      });
    }

    basePromptParts.push({ text: "TARGET GARMENT (APPLY THIS TEXTURE/ITEM):" });
    basePromptParts.push({ inlineData: { mimeType: product.mimeType, data: product.base64 } });

    // 5. Setup Variations
    for (let i = 0; i < count; i++) {
        const variationParts = [...basePromptParts];
        
        // Get strict variation text (mostly lighting tweaks, no pose changes)
        const variationText = getStyleVariation(i);
        
        const finalPrompt = `
          ${userPrompt || "Fashion photography."}
          ${variationText}
          Ensure the final image looks exactly like the Reference Image but with the new product.
        `;
        
        variationParts.push({ text: finalPrompt });

        // Define the Task
        const task: GenerationTask = async () => {
            const payload = {
                model: activeModel,
                contents: { parts: variationParts },
                config: { imageConfig: imageConfig }
            };

            // Enhanced Retry Loop
            for(let attempt = 0; attempt < 5; attempt++) {
                try {
                    const response = await ai.models.generateContent(payload);
                    const candidates = response.candidates;
                    if (candidates && candidates.length > 0) {
                        for (const part of candidates[0].content.parts) {
                            if (part.inlineData) {
                                const newImage = {
                                    id: `gen-${Date.now()}-${product.id}-${i}`,
                                    url: `data:image/png;base64,${part.inlineData.data}`,
                                    parentProductId: product.id,
                                    isLoading: false
                                } as GeneratedImage;
                                
                                if (onImageGenerated) {
                                    onImageGenerated(newImage);
                                }
                                return newImage;
                            }
                        }
                    }
                    return null; // No image part found
                } catch (err: any) {
                    const msg = err.message || JSON.stringify(err);
                    const is500 = msg.includes('500') || msg.includes('Internal Server Error') || err.status === 500 || err.code === 500;
                    const isFetchError = msg.includes('fetch failed');
                    const isOverloaded = msg.includes('Overloaded') || msg.includes('503');
                    
                    if ((is500 || isFetchError || isOverloaded) && attempt < 4) {
                        const backoff = 1500 * Math.pow(1.5, attempt) + Math.random() * 2000;
                        console.warn(`[Retry ${attempt + 1}/5] ${product.id}-${i} waiting ${Math.round(backoff)}ms...`);
                        await new Promise(r => setTimeout(r, backoff));
                        continue;
                    }
                    
                    console.error(`Attempt ${attempt + 1} failed permanently for ${product.id}-${i}:`, err);
                    break;
                }
            }
            return null;
        };
        tasks.push(task);
    }
  }

  // 6. Execute with Concurrency
  const CONCURRENCY_LIMIT = 4;
  const results: (GeneratedImage | null)[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
      const p = task().then(res => {
          results.push(res);
      });
      executing.push(p);

      const clean = () => {
        const idx = executing.indexOf(p);
        if(idx !== -1) executing.splice(idx, 1);
      };
      p.then(clean).catch(clean);

      if (executing.length >= CONCURRENCY_LIMIT) {
          await Promise.race(executing);
      }
  }
  
  await Promise.all(executing);
  
  const finalImages = results.filter((res): res is GeneratedImage => res !== null);

  if (finalImages.length === 0) {
    throw new Error("Failed to generate any images. Please try again or check your inputs.");
  }

  return finalImages;
};

// --- GARMENT EXTRACTION & DETECTION LOGIC ---

// 1. Detection Phase
export const detectImageObjects = async (image: ImageFile): Promise<DetectedItem[]> => {
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey! });
    const model = 'gemini-2.5-flash'; // Fast model for detection

    const prompt = `
    Analyze this fashion image. 
    Task: Identify the main fashion items, the background, and the model.
    
    Output strictly in JSON format with this schema:
    {
      "items": [
        { "name": "Name of item (Vietnamese)", "type": "GARMENT" | "ACCESSORY" | "BACKGROUND" | "MODEL", "description": "Short visual description (Vietnamese)" }
      ]
    }

    Rules:
    1. Identify up to 4 most important fashion items (Top, Bottom, Shoes, Bag, etc.).
    2. Identify "Background" (The room, the view, the wall).
    3. Identify "Model" (The human subject).
    4. Language: Vietnamese for all text values.
    5. Ignore minor clutter.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: image.mimeType, data: image.base64 } }
                ]
            },
            config: { responseMimeType: 'application/json' }
        });

        const text = response.text || "{}";
        const json = JSON.parse(text);
        
        return (json.items || []).map((item: any, idx: number) => ({
            id: `det-${idx}`,
            name: item.name,
            type: item.type,
            description: item.description
        }));
    } catch (e) {
        console.error("Detection failed", e);
        // Fallback
        return [
            { id: '1', name: 'Trang phục', type: 'GARMENT', description: 'Trang phục chính' },
            { id: '2', name: 'Người mẫu', type: 'MODEL', description: 'Người mẫu trong ảnh' }
        ];
    }
}

// 2. Generation Phase
export const generateExtractedProduct = async (
    image: ImageFile,
    itemsToExtract: DetectedItem[],
    quality: '1K' | '2K' | '4K',
    aspectRatio: AspectRatio,
    generateMasterImage: boolean, // New Parameter
    onImageGenerated?: (img: GeneratedImage) => void
): Promise<GeneratedImage[]> => {
    const model = 'gemini-3-pro-image-preview'; 
    const apiKey = (model.includes('pro')) ? (process.env.API_KEY || process.env.GEMINI_API_KEY) : process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey! });
    const imageConfig: any = {
        aspectRatio: aspectRatio,
        imageSize: quality
    };

    // Standard Tasks for individual items
    const tasks = itemsToExtract.map((item, index) => async () => {
        let specializedPrompt = "";

        if (item.type === 'BACKGROUND') {
             specializedPrompt = `
             TASK: Background Extraction / Room Reconstruction.
             INPUT: Original Image.
             OBJECTIVE: Reconstruct the empty background (room/environment) shown in the image.
             ACTION: Remove the human subject and any foreground clutter completely. Inpaint the missing areas naturally.
             STYLE: Clean, empty interior/exterior photography.
             `;
        } else if (item.type === 'MODEL') {
             specializedPrompt = `
             TASK: Full Body Model Regeneration.
             INPUT: Original Image.
             OBJECTIVE: Generate a full-body portrait of the model from the original image.
             ACTION: 
             1. KEEP the original model's identity, face, hair, and skin tone exactly (100% Identity Match).
             2. If the original image is cropped (e.g. knees up), use AI to OUTPAINT and generate the missing legs/shoes naturally to create a FULL BODY view.
             3. Isolate the model on a pure white background.
             4. Remove background distractions.
             STYLE: High-end Studio Fashion Portrait (Full Body).
             `;
        } else {
             // Garments / Accessories
             specializedPrompt = `
             TASK: Product Photography Extraction.
             INPUT: Original Image.
             OBJECTIVE: Extract the "${item.name}" (${item.description}) from the model.
             ACTION: Isolate the item perfectly. Remove the model, body parts, and original background.
             BACKGROUND: Pure White (#FFFFFF).
             STYLE: High-end E-commerce Product Shot. Front-facing view. Flat lay or Ghost Mannequin effect (showing volume without the person).
             LIGHTING: Soft studio lighting.
             `;
        }

        return executeGeneration(ai, model, specializedPrompt, image, imageConfig, item.name, `ext-${Date.now()}-${index}`, onImageGenerated);
    });

    // --- MASTER IMAGE TASK ---
    // If enabled and we have multiple fashion items (excluding background/model) or at least 2 items
    const fashionItems = itemsToExtract.filter(i => i.type !== 'BACKGROUND');
    
    if (generateMasterImage && fashionItems.length > 0) {
        const itemNames = fashionItems.map(i => i.name).join(", ");
        
        // MASTER PROMPT FOR OUTFIT FLAT LAY
        const masterPrompt = `
        TASK: Fashion Flat Lay / Outfit Grid Composition (Master Image).
        INPUT: Original Image.
        OBJECTIVE: Create a stylish, high-end "Outfit Grid" or "Knolling" composition containing ALL the following items: ${itemNames}.
        
        ACTION: 
        1. Extract the specific items: ${itemNames}.
        2. ARRANGE them artistically on a pure, clean background (Flat Lay style).
        3. Do NOT include the human model. Only the clothing and accessories.
        4. Organize items neatly (e.g., shirt folded or flat, pants laid out, shoes paired).
        5. Ensure consistent lighting and high detail.
        
        STYLE: Premium E-commerce Flat Lay, Instagram Outfit Grid, Minimalist Fashion Photography.
        BACKGROUND: Clean White or very soft neutral gray.
        `;

        tasks.push(async () => {
            return executeGeneration(
                ai, 
                model, 
                masterPrompt, 
                image, 
                imageConfig, 
                "Bộ sưu tập (Flat Lay)", 
                `ext-master-${Date.now()}`, 
                onImageGenerated
            );
        });
    }

    // Execute sequentially or parallel (Parallel is fine for max 5)
    const results = await Promise.all(tasks.map(t => t()));
    return results.filter((res): res is GeneratedImage => res !== null);
};

// Internal Helper to execute generation with retries
async function executeGeneration(
    ai: GoogleGenAI, 
    model: string, 
    prompt: string, 
    image: ImageFile, 
    imageConfig: any, 
    label: string, 
    id: string,
    onImageGenerated?: (img: GeneratedImage) => void
): Promise<GeneratedImage | null> {
    for(let attempt = 0; attempt < 5; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: model,
                contents: {
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: image.mimeType, data: image.base64 } }
                    ]
                },
                config: { imageConfig }
            });

            const candidates = response.candidates;
            if (candidates && candidates.length > 0) {
                for (const part of candidates[0].content.parts) {
                    if (part.inlineData) {
                        const newImage = {
                            id: id,
                            url: `data:image/png;base64,${part.inlineData.data}`,
                            isLoading: false,
                            label: label
                        } as GeneratedImage;
                        if (onImageGenerated) onImageGenerated(newImage);
                        return newImage;
                    }
                }
            }
            break; 
        } catch (e: any) {
            const msg = e.message || JSON.stringify(e);
            const isOverloaded = msg.includes('overloaded') || msg.includes('503') || e.status === 503 || e.code === 503;
            
            if (isOverloaded && attempt < 4) {
                 const backoff = 2000 * Math.pow(2, attempt) + Math.random() * 1000;
                 console.warn(`[Retry ${attempt + 1}/5] Extraction overloaded for ${label}. Waiting ${Math.round(backoff)}ms...`);
                 await new Promise(r => setTimeout(r, backoff));
                 continue;
            }
            
            console.error(`Extraction failed for ${label}`, e);
            break; 
        }
    }
    return null;
}

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
