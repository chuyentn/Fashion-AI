import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs, deleteDoc, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { HistoryItem, AdminResource, UserProfile } from '../types';

// Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCQQqTCftUhAHjnwR1sBAc5YCKCLgwVzlQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fashionstudio-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fashionstudio-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fashionstudio-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "799458020152",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:799458020152:web:d56b25e1f8d375baefcfcd",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Y6ZKG3R9VD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();

// --- AUTH FUNCTIONS ---

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await ensureProfileExists(user.uid, user.email || '', user.displayName || '');
    return user;
  } catch (error) {
    console.error("Google Sign In Error:", error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, fullName: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    await ensureProfileExists(user.uid, email, fullName);
    return user;
  } catch (error) {
    console.error("Email Sign Up Error:", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Email Sign In Error:", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign Out Error:", error);
    throw error;
  }
};

// --- USER PROFILE FUNCTIONS ---

export const ensureProfileExists = async (userId: string, email: string, fullName: string) => {
  try {
    const profileRef = doc(db, 'profiles', userId);
    const profileSnap = await getDoc(profileRef);
    
    if (!profileSnap.exists()) {
      await setDoc(profileRef, {
        id: userId,
        email,
        name: fullName,
        avatar: `https://i.pravatar.cc/150?u=${email}`,
        isAdmin: email === 'huuson9x@gmail.com',
        preferences: {
          darkMode: false,
          language: 'Vietnamese',
          modelTier: 'BASIC'
        },
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  } catch (error) {
    console.error("Create Profile Error:", error);
    throw error;
  }
};

export const fetchUserProfileAndSettings = async (userId: string): Promise<UserProfile | null> => {
  try {
    const profileRef = doc(db, 'profiles', userId);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      return profileSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Fetch Profile Error:", error);
    return null;
  }
};

export const updateUserPreferences = async (userId: string, preferences: any) => {
  try {
    const profileRef = doc(db, 'profiles', userId);
    await updateDoc(profileRef, { preferences, updated_at: new Date() });
  } catch (error) {
    console.error("Update Preferences Error:", error);
    throw error;
  }
};

// --- HISTORY FUNCTIONS ---

export const saveProjectToFirebase = async (
  userId: string,
  prompt: string,
  referenceImages: any[],
  productImages: any[],
  generatedImages: any[],
  settings: any
): Promise<string> => {
  try {
    const projectRef = collection(db, 'projects');
    const docRef = await addDoc(projectRef, {
      userId,
      prompt,
      settings,
      reference_previews: referenceImages.map(img => img.previewUrl),
      product_previews: productImages.map(img => img.previewUrl),
      images: generatedImages.map(img => ({ url: img.url, label: img.label })),
      created_at: new Date(),
      updated_at: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error("Save Project Error:", error);
    throw error;
  }
};

export const fetchUserHistory = async (userId: string): Promise<HistoryItem[]> => {
  try {
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, where('userId', '==', userId), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const history: HistoryItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        timestamp: data.created_at?.toMillis?.() || Date.now(),
        prompt: data.prompt,
        images: data.images || [],
        referencePreviews: data.reference_previews || [],
        productPreviews: data.product_previews || [],
        settings: data.settings || {}
      } as HistoryItem);
    });
    
    return history;
  } catch (error) {
    console.error("Fetch History Error:", error);
    return [];
  }
};

// --- ADMIN RESOURCES FUNCTIONS ---

export const fetchAdminResources = async (type?: 'REFERENCE' | 'PRODUCT'): Promise<AdminResource[]> => {
  try {
    const resourcesRef = collection(db, 'admin_resources');
    let q = query(resourcesRef, orderBy('created_at', 'desc'));
    
    if (type) {
      q = query(resourcesRef, where('type', '==', type), orderBy('created_at', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    const resources: AdminResource[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      resources.push({
        id: doc.id,
        type: data.type,
        name: data.name,
        description: data.description,
        url: data.url,
        created_at: data.created_at?.toDate?.()?.toISOString?.()
      } as AdminResource);
    });
    
    return resources;
  } catch (error) {
    console.error("Fetch Admin Resources Error:", error);
    return [];
  }
};

export const saveAdminResource = async (resource: Omit<AdminResource, 'id' | 'created_at'>) => {
  try {
    const resourcesRef = collection(db, 'admin_resources');
    const docRef = await addDoc(resourcesRef, {
      ...resource,
      created_at: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error("Save Admin Resource Error:", error);
    throw error;
  }
};

export const deleteAdminResource = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'admin_resources', id));
  } catch (error) {
    console.error("Delete Admin Resource Error:", error);
    throw error;
  }
};

// --- STORAGE FUNCTIONS ---

export const uploadImageToFirebase = async (
  fileOrBase64: File | string,
  userId: string,
  folder: 'refs' | 'prods' | 'gens' | 'admin'
): Promise<string | null> => {
  try {
    let file: File;
    
    if (typeof fileOrBase64 === 'string') {
      // Base64 to File
      const byteCharacters = atob(fileOrBase64.split(',')[1] || fileOrBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      file = new File([byteArray], 'image.png', { type: 'image/png' });
    } else {
      file = fileOrBase64;
    }
    
    const fileName = `${folder}/${userId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, file);
    const publicUrl = await getDownloadURL(storageRef);
    
    return publicUrl;
  } catch (error) {
    console.error("Upload Image Error:", error);
    return null;
  }
};

export const saveExtractedResult = async (userId: string, itemName: string, imageUrl: string, type: 'PRODUCT' | 'REFERENCE') => {
  try {
    const resourcesRef = collection(db, 'extracted_results');
    await addDoc(resourcesRef, {
      userId,
      name: itemName,
      url: imageUrl,
      type,
      created_at: new Date()
    });
  } catch (error) {
    console.error("Save Extracted Result Error:", error);
    throw error;
  }
};

// --- FIRESTORE LISTENERS (for real-time updates) ---

export const onAuthStateChanged = (callback: (user: any) => void) => {
  return auth.onAuthStateChanged(callback);
};
