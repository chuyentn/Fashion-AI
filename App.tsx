
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './services/supabase';
import { 
  AppState, 
  HistoryItem, 
  GeneratedImage, 
  UserProfile, 
  CURRENT_VERSION,
  ApiSettings 
} from './types';
import { 
  loadApiSettings, 
  saveApiSettings, 
  DEFAULT_API_BASE_URL 
} from './services/apiSettings';
import { generateImages } from './services/geminiService';
import { saveProject, fetchUserHistory } from './services/supabase';

// Modular Components & Views
import { Sidebar } from './components/Sidebar';
import { ImageLightbox } from './components/Common';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { ExtractGarmentView } from './views/ExtractGarmentView';
import { CreateShotView } from './views/CreateShotView';
import { LibraryView } from './views/LibraryView';
import { VideoStudioView } from './views/VideoStudioView';
import { ResultsView } from './views/ResultsView';
import { AdminPanelView } from './views/AdminPanelView';
import { SettingsView } from './views/SettingsView';

const App: React.FC = () => {
  // --- CORE STATE ---
  const [state, setState] = useState<AppState>({
    view: 'HOME',
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'dark',
    userProfile: null,
    referenceImages: [],
    productImages: [],
    overlayText: '',
    modelTier: 'BASIC',
    resolution: '1024x1024',
    outputCount: 1,
    faceHideEnabled: false,
    faceHideType: 'PHONE_SELFIE',
  });

  const [apiSettings, setApiSettings] = useState<ApiSettings>(loadApiSettings());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentProject, setCurrentProject] = useState<HistoryItem | undefined>();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showVersionModal, setShowVersionModal] = useState(false);

  // --- HELPERS ---
  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateApiSettings = (updates: Partial<ApiSettings>) => {
    const newSettings = { ...apiSettings, ...updates };
    setApiSettings(newSettings);
    saveApiSettings(newSettings);
  };

  // --- AUTH & INITIALIZATION ---
  useEffect(() => {
    document.documentElement.className = state.theme;
    localStorage.setItem('theme', state.theme);
  }, [state.theme]);

  useEffect(() => {
    setIsAuthLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const profile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          avatar: session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${session.user.email}`,
          isAdmin: session.user.email === 'thonganhkiet125@gmail.com'
        };
        updateState({ userProfile: profile });
        loadHistory(profile.id);
      }
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
         const profile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          avatar: session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${session.user.email}`,
          isAdmin: session.user.email === 'thonganhkiet125@gmail.com'
        };
        updateState({ userProfile: profile });
        loadHistory(profile.id);
      } else {
        updateState({ userProfile: null, view: 'HOME' });
      }
    });

    return () => subscription.unsubscribe();
  }, [updateState]);

  const loadHistory = async (userId: string) => {
    const data = await fetchUserHistory(userId);
    setHistory(data);
  };

  // --- ACTIONS ---
  const handleGenerate = async () => {
    if (!state.userProfile) return;
    
    // 1. Prepare placeholders
    const count = state.outputCount * state.productImages.length;
    const placeholders: GeneratedImage[] = Array(count).fill(0).map((_, i) => ({
      id: `temp-${i}`,
      url: '',
      isLoading: true
    }));
    
    setGeneratedImages(placeholders);
    updateState({ view: 'RESULTS' });

    try {
      // 2. Call API
      const results = await generateImages({
        referenceImages: state.referenceImages.map(img => img.base64),
        productImages: state.productImages.map(img => img.base64),
        overlayText: state.overlayText,
        modelTier: state.modelTier,
        resolution: state.resolution,
        count: state.outputCount,
        faceHideEnabled: state.faceHideEnabled,
        faceHideType: state.faceHideType
      }, apiSettings);

      // 3. Save to Supabase
      const historyItem = await saveProject({
        userId: state.userProfile.id,
        prompt: state.overlayText || "Fashion Collection",
        images: results.map(url => ({ url })),
        settings: {
           model: state.modelTier,
           resolution: state.resolution,
           faceHide: state.faceHideEnabled
        }
      });

      // 4. Update UI
      setGeneratedImages(results.map((url, i) => ({ id: `gen-${i}`, url, isLoading: false })));
      if (historyItem) {
        setHistory([historyItem, ...history]);
        setCurrentProject(historyItem);
      }
    } catch (err: any) {
      alert(`Lỗi tạo ảnh: ${err.message}`);
      updateState({ view: 'CREATE' });
    }
  };

  const handleRemix = (item: HistoryItem) => {
    // Logic to load project images back into state
    updateState({ view: 'CREATE', overlayText: item.prompt });
  };

  // --- RENDER LOGIC ---
  if (isAuthLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!state.userProfile) {
    return <AuthView onAuthSuccess={() => {}} />;
  }

  const renderActiveView = () => {
    switch (state.view) {
      case 'HOME':
        return <DashboardView onStart={() => updateState({ view: 'CREATE' })} history={history} onOpenHistory={(item) => { setCurrentProject(item); setGeneratedImages(item.images.map(img => ({ ...img, isLoading: false }))); updateState({ view: 'RESULTS' }); }} userProfile={state.userProfile!} onNavigate={(v) => updateState({ view: v })} />;
      case 'CREATE':
        return <CreateShotView onBack={() => updateState({ view: 'HOME' })} state={state} updateState={updateState} onGenerate={handleGenerate} onOpenAdmin={() => updateState({ view: 'ADMIN_PANEL' })} apiSettings={apiSettings} setApiSettings={setApiSettings} />;
      case 'EXTRACT':
        return <ExtractGarmentView onBack={() => updateState({ view: 'HOME' })} userProfile={state.userProfile!} />;
      case 'LIBRARY':
        return <LibraryView userProfile={state.userProfile} history={history} onOpenHistory={(item) => { setCurrentProject(item); setGeneratedImages(item.images.map(img => ({ ...img, isLoading: false }))); updateState({ view: 'RESULTS' }); }} onViewImage={setZoomImage} onOpenAdmin={() => updateState({ view: 'ADMIN_PANEL' })} />;
      case 'VIDEO':
        return <VideoStudioView state={state} updateState={updateState} />;
      case 'RESULTS':
        return <ResultsView images={generatedImages} onBack={() => updateState({ view: 'CREATE' })} onHome={() => updateState({ view: 'HOME' })} onViewImage={setZoomImage} onRemix={handleRemix} currentProject={currentProject} />;
      case 'ADMIN_PANEL':
        return <AdminPanelView onBack={() => updateState({ view: 'SETTINGS' })} userId={state.userProfile!.id} onViewImage={setZoomImage} />;
      case 'SETTINGS':
        return <SettingsView state={state} updateState={updateState} apiSettings={apiSettings} updateApiSettings={updateApiSettings} setShowVersionModal={setShowVersionModal} />;
      default:
        return <DashboardView onStart={() => updateState({ view: 'CREATE' })} history={history} onOpenHistory={() => {}} userProfile={state.userProfile!} onNavigate={(v) => updateState({ view: v })} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-sans selection:bg-primary/20">
      <Sidebar activeView={state.view} onNavigate={(v) => updateState({ view: v })} userProfile={state.userProfile} />
      
      <main className="flex-1 h-full overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-hidden relative">
          {renderActiveView()}
        </div>
      </main>

      {/* Overlays */}
      <ImageLightbox src={zoomImage} onClose={() => setZoomImage(null)} />

      {/* Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowVersionModal(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-surface-card rounded-[40px] p-8 shadow-2xl animate-[slideDown_0.3s] text-left">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black dark:text-white">Phiên bản {CURRENT_VERSION}</h3>
                <button onClick={() => setShowVersionModal(false)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center dark:text-white"><span className="material-symbols-outlined">close</span></button>
             </div>
             <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                <section>
                   <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">Tính năng mới</p>
                   <ul className="space-y-3">
                      <li className="flex gap-3"><span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-sm">check</span></span><p className="text-sm dark:text-gray-300">Tích hợp mô hình <b>Nano Banana 2</b> (Gemini 3.1 Flash) siêu nhanh.</p></li>
                      <li className="flex gap-3"><span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-sm">check</span></span><p className="text-sm dark:text-gray-300">Hệ thống <b>Video Studio</b> hỗ trợ tạo Clip 4K 8s từ ảnh.</p></li>
                      <li className="flex gap-3"><span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-sm">check</span></span><p className="text-sm dark:text-gray-300">Layout Full-Screen chuyên nghiệp, mượt mà trên PC.</p></li>
                   </ul>
                </section>
                <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                   <p className="text-xs text-gray-500 leading-relaxed italic text-center">Fashion Studio by ChuyenTN & Victor. <br/> Built for professional fashion designers.</p>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
