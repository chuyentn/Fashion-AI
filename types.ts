export const CURRENT_VERSION = '3.0.0';
export interface ImageFile {
  id: string; 
  file: File | null; // Null if picked from library
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface AdminResource {
  id: string;
  type: 'REFERENCE' | 'PRODUCT';
  name: string;
  description: string;
  url: string;
  created_at?: string;
}

export interface GeneratedImage {
  id: string;
  url: string; 
  parentProductId?: string; 
  isLoading?: boolean; 
  label?: string; // Label for extracted item
}

export type ModelTier = 'BASIC' | 'PRO'; 
export type AspectRatio = '1:1' | '9:16' | '16:9' | '3:4' | '4:3' | '3:2' | '2:3';

export type TextLanguage = 'English' | 'Vietnamese' | 'Korean' | 'Japanese';
export type FontStyleKey = 'AUTO' | 'BEAUTY' | 'CUTE' | 'YOUTH' | 'MODERN' | 'RETRO' | 'BOLD';

export interface DetectedItem {
  id: string;
  name: string;
  type: 'GARMENT' | 'ACCESSORY' | 'BACKGROUND' | 'MODEL';
  description: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  images: GeneratedImage[];
  referencePreviews: string[]; 
  productPreviews: string[]; 
  settings: {
    modelTier: ModelTier;
    outputCount: number;
    resolution: '1K' | '2K' | '4K'; 
    aspectRatio: AspectRatio; 
    useAnalysisMode: boolean;
    faceHideEnabled: boolean;
    faceHideType: FaceHideType;
    overlayText?: string;
    textLanguage?: TextLanguage;
    fontStyle?: FontStyleKey;
  };
}

export type FaceHideType = 'PHONE_SELFIE' | 'BACK_TURNED' | 'CROP_FACE' | 'PROP_OBSCURED';

export interface UserProfile {
  id?: string;
  name: string;
  email: string; 
  avatar: string;
  isAdmin?: boolean;
}

export interface AppState {
  view: 'AUTH' | 'HOME' | 'CREATE' | 'GENERATING' | 'RESULTS' | 'LIBRARY' | 'SETTINGS' | 'ADMIN_PANEL' | 'EXTRACT' | 'VIDEO';
  previousView?: 'HOME' | 'CREATE' | 'LIBRARY';
  theme: 'light' | 'dark'; 
  referenceImages: ImageFile[]; 
  productImages: ImageFile[]; 
  prompt: string;
  outputCount: number;
  resolution: '1K' | '2K' | '4K';
  aspectRatio: AspectRatio; 
  modelTier: ModelTier; 
  useAnalysisMode: boolean;
  faceHideEnabled: boolean;
  faceHideType: FaceHideType;
  overlayText: string;
  textLanguage: TextLanguage;
  fontStyle: FontStyleKey;
  
  generatedImages: GeneratedImage[];
  history: HistoryItem[];
  activeHistoryItem?: HistoryItem;
  
  userProfile: UserProfile | null;
  session: any | null;
}

export type ViewName = AppState['view'];

// --- VIDEO STUDIO TYPES ---

export interface VideoClip {
  id: string;
  sourceImageUrl: string;       // Starting frame image
  sourceImageBase64: string;
  sourceImageMimeType: string;
  prompt: string;               // Text prompt for video generation
  structuredPrompt?: VideoStructuredPrompt; // Structured JSON prompt
  videoUrl?: string;            // Generated video URL
  status: 'idle' | 'generating' | 'done' | 'error';
  progress?: string;            // Progress message
  error?: string;
  duration?: number;            // Video duration in seconds
  order: number;                // Order in storyboard
}

export interface VideoStructuredPrompt {
  scenePrompt: string;
  cameraAngle: string;
  transition: string;
  speed: string;
  effects: string;
  voice: string;
}

export interface VideoStoryboard {
  id: string;
  name: string;
  clips: VideoClip[];
  createdAt: number;
}
