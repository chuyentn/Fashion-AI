
import { createClient } from '@supabase/supabase-js';
import { HistoryItem, AppState, GeneratedImage, ImageFile, AdminResource } from '../types';

// Use environment variables if provided, otherwise use defaults
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xlrarbcrcofcfzzkfotk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscmFyYmNyY29mY2Z6emtmb3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMzY5MzUsImV4cCI6MjA4MTkxMjkzNX0.aKjodhAxrTNcNBPV_iYR4_SC19q_x_qW4tXWPD_7pkk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    }
});

// --- ADMIN RESOURCE FUNCTIONS ---

export const fetchAdminResources = async (type?: 'REFERENCE' | 'PRODUCT', userId?: string): Promise<AdminResource[]> => {
    try {
        let query = supabase.from('admin_resources').select('*');
        if (type) query = query.eq('type', type);
        
        // Optional: Filter by user_id if needed in the future for private libraries
        // if (userId) query = query.eq('user_id', userId);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.warn("Fetch Admin Resources Failed (Resource list might be empty):", err);
        return [];
    }
}

export const saveAdminResource = async (resource: Omit<AdminResource, 'id' | 'created_at'>): Promise<AdminResource | null> => {
    try {
        const { data, error } = await supabase.from('admin_resources').insert(resource).select().single();
        if (error) throw error;
        return data;
    } catch (err) {
        console.error("Save Admin Resource Failed:", err);
        return null;
    }
}

export const deleteAdminResource = async (id: string): Promise<boolean> => {
    try {
        const { error } = await supabase.from('admin_resources').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Delete Admin Resource Failed:", err);
        return false;
    }
}

// --- EXISTING HELPER FUNCTIONS ---

const dataURItoBlob = (dataURI: string): Blob => {
  try {
    const split = dataURI.split(',');
    if (split.length < 2) throw new Error("Invalid Data URI");
    const byteString = atob(split[1]);
    const mimeString = split[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  } catch (e) {
    console.error("dataURItoBlob failed", e);
    throw e;
  }
};

export const ensureProfileExists = async (userId: string, email?: string, fullName?: string) => {
  try {
    const { data, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (checkError) throw checkError;

    if (!data) {
       console.log("Profile missing, creating new profile record...");
       const name = fullName || (email ? email.split('@')[0] : 'Fashion Designer');
       const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
       
       const { error: insertError } = await supabase
         .from('profiles')
         .insert({ 
             id: userId,
             full_name: name,
             avatar_url: avatar
         });
       
       if (insertError) {
         if (!insertError.message.includes('duplicate')) {
             console.warn("Could not create profile record:", insertError.message);
         }
       }
    }
  } catch (e) {
    console.warn("ensureProfileExists failed:", e);
  }
};

export const uploadImageToSupabase = async (fileOrBase64: File | string, userId: string, folder: 'refs' | 'prods' | 'gens' | 'admin'): Promise<string | null> => {
  try {
    const fileName = `${userId}/${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let body: File | Blob;
    let contentType: string;

    if (typeof fileOrBase64 === 'string') {
        if (!fileOrBase64.startsWith('data:')) {
           // Assume it's already a URL or handle error
           return null;
        }
        body = dataURItoBlob(fileOrBase64);
        contentType = body.type;
    } else {
        body = fileOrBase64;
        contentType = fileOrBase64.type;
    }

    const { data, error } = await supabase.storage
      .from('fashion_assets')
      .upload(fileName, body, {
        contentType: contentType,
        upsert: false
      });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage.from('fashion_assets').getPublicUrl(fileName);
    return publicUrl;
  } catch (error: any) {
    console.error("Upload failed:", error.message || error);
    return null;
  }
};

export const saveUserPreferences = async (userId: string, settings: Partial<AppState>) => {
  try {
    const preferences = {
      theme: settings.theme,
      modelTier: settings.modelTier,
      resolution: settings.resolution,
      outputCount: settings.outputCount,
      aspectRatio: settings.aspectRatio,
      faceHideEnabled: settings.faceHideEnabled,
      textLanguage: settings.textLanguage,
      fontStyle: settings.fontStyle
    };

    const { error } = await supabase.from('profiles').update({ preferences }).eq('id', userId);
    if (error) {
        console.warn("Preferences save skipped:", error.message);
    }
  } catch (err) {
    console.warn("Failed to save preferences:", err);
  }
};

export const saveProjectToSupabase = async (
  userId: string, 
  userEmail: string | undefined,
  prompt: string, 
  settings: HistoryItem['settings'],
  referenceImages: ImageFile[],
  productImages: ImageFile[],
  generatedImages: GeneratedImage[]
): Promise<HistoryItem | null> => {
  try {
    await ensureProfileExists(userId, userEmail);

    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        prompt: prompt,
        settings: settings
      })
      .select()
      .single();

    if (projectError || !projectData) throw projectError;
    const projectId = projectData.id;

    const uploadAndMap = async (img: ImageFile, type: 'REFERENCE' | 'PRODUCT' | 'GENERATED') => {
        let url = '';
        if (img.file) {
            url = await uploadImageToSupabase(img.file, userId, type === 'REFERENCE' ? 'refs' : 'prods') || '';
        } else {
            url = img.previewUrl;
        }
        if (url) return { project_id: projectId, url, type };
        return null;
    };

    const refPromises = referenceImages.map(img => uploadAndMap(img, 'REFERENCE'));
    const prodPromises = productImages.map(img => uploadAndMap(img, 'PRODUCT'));
    const genPromises = generatedImages.map(img => uploadImageToSupabase(img.url, userId, 'gens').then(url => url ? { project_id: projectId, url, type: 'GENERATED' } : null));

    const allImages = await Promise.all([...refPromises, ...prodPromises, ...genPromises]);
    const validImages = allImages.filter((i): i is {project_id: string, url: string, type: string} => i !== null);

    if (validImages.length > 0) {
        const { error: imgError } = await supabase.from('project_images').insert(validImages);
        if (imgError) throw imgError;
    }

    return {
        id: projectId,
        timestamp: new Date(projectData.created_at).getTime(),
        prompt: prompt,
        settings: settings,
        images: validImages.filter(i => i.type === 'GENERATED').map((i, idx) => ({ id: `${projectId}-gen-${idx}`, url: i.url })),
        referencePreviews: validImages.filter(i => i.type === 'REFERENCE').map(i => i.url),
        productPreviews: validImages.filter(i => i.type === 'PRODUCT').map(i => i.url)
    };

  } catch (err: any) {
    console.error("Save Project Failed:", err.message || err);
    return null;
  }
};

const retryOp = async <T>(fn: () => Promise<T>, retries = 2, delay = 500): Promise<T> => {
    try {
        return await fn();
    } catch (err) {
        if (retries === 0) throw err;
        await new Promise(r => setTimeout(r, delay));
        return retryOp(fn, retries - 1, delay * 2);
    }
};

export const fetchUserHistory = async (userId: string): Promise<HistoryItem[]> => {
    try {
        // 1. Fetch Projects first with retry
        const projects = await retryOp(async () => {
             const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
             if (error) throw error;
             return data;
        });

        if (!projects || projects.length === 0) return [];

        const projectIds = projects.map(p => p.id);

        // 2. Fetch all images for these projects
        const images = await retryOp(async () => {
             // Split request if projectIds is too large (naive check > 20)
             if (projectIds.length > 20) {
                 const { data, error } = await supabase
                    .from('project_images')
                    .select('project_id, url, type')
                    .in('project_id', projectIds.slice(0, 20)); // Limit to most recent 20 for safety
                 if (error) throw error;
                 return data;
             }
             
             const { data, error } = await supabase
                .from('project_images')
                .select('project_id, url, type')
                .in('project_id', projectIds);
             if (error) throw error;
             return data;
        });

        // 3. Merge Data in Memory
        return projects.map(p => {
            const pImages = images?.filter(img => img.project_id === p.id) || [];
            
            return {
                id: p.id,
                timestamp: new Date(p.created_at).getTime(),
                prompt: p.prompt || '',
                settings: p.settings || {},
                images: pImages.filter((i: any) => i.type === 'GENERATED').map((i: any, idx: number) => ({ id: `${p.id}-${idx}`, url: i.url })),
                referencePreviews: pImages.filter((i: any) => i.type === 'REFERENCE').map((i: any) => i.url),
                productPreviews: pImages.filter((i: any) => i.type === 'PRODUCT').map((i: any) => i.url)
            };
        });
    } catch (err: any) {
        // Downgrade to warning to avoid alarm if network is just flaky or adblocker is active
        console.warn("Fetch History Warning: Could not retrieve history from cloud.", err.message);
        return [];
    }
}

export const fetchUserProfileAndSettings = async (userId: string) => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (error) return null;
        return data;
    } catch (e) {
        return null;
    }
}

// --- NEW FUNCTION: Manual Save for Extracted Images ---
export const saveExtractedResult = async (
    userId: string,
    originalImage: ImageFile,
    generatedImage: GeneratedImage,
    itemLabel: string
): Promise<boolean> => {
    try {
        // 1. Create a "Project" record for this extraction
        const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .insert({
                user_id: userId,
                prompt: `Extracted: ${itemLabel}`,
                settings: { type: 'EXTRACTION', source: originalImage.id }
            })
            .select()
            .single();
        
        if (projectError || !projectData) throw projectError;
        const projectId = projectData.id;

        // 2. Upload Original Image (Reference)
        let refUrl = originalImage.previewUrl;
        if (originalImage.file) {
            const uploadedRef = await uploadImageToSupabase(originalImage.file, userId, 'refs');
            if (uploadedRef) refUrl = uploadedRef;
        } else if (originalImage.base64 && !originalImage.previewUrl.startsWith('http')) {
             const uploadedRef = await uploadImageToSupabase(originalImage.base64, userId, 'refs');
             if(uploadedRef) refUrl = uploadedRef;
        }

        // 3. Upload Generated Image
        const genUrl = await uploadImageToSupabase(generatedImage.url, userId, 'gens');
        if (!genUrl) throw new Error("Failed to upload generated image");

        // 4. Link images to project
        const imagesPayload = [
            { project_id: projectId, url: refUrl, type: 'REFERENCE' },
            { project_id: projectId, url: genUrl, type: 'GENERATED' }
        ];

        const { error: imgError } = await supabase.from('project_images').insert(imagesPayload);
        if (imgError) throw imgError;

        return true;
    } catch (err) {
        console.error("Save Extracted Result Failed:", err);
        return false;
    }
};
