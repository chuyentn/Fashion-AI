
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './services/supabase';
import { 
  AppState, 
  HistoryItem, 
  GeneratedImage, 
  UserProfile, 
  CURRENT_VERSION
} from './types';
import { 
  ApiSettings,
  loadApiSettings, 
  saveApiSettings, 
  DEFAULT_API_BASE_URL 
} from './services/apiSettings';
import { generateFashionShots } from './services/geminiService';
import { saveProjectToSupabase, fetchUserHistory } from './services/supabase';

// Modular Components & Views
import { Sidebar } from './components/Sidebar';
import { ImageLightbox } from './components/Common';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { ExtractGarmentView } from './views/ExtractGarmentView';
import { ProductIntakeView } from './views/ProductIntakeView';
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
    
    const count = state.outputCount * state.productImages.length;
    const placeholders: GeneratedImage[] = Array(count).fill(0).map((_, i) => ({
      id: `temp-${i}`,
      url: '',
      isLoading: true
    }));
    
    setGeneratedImages(placeholders);
    updateState({ view: 'RESULTS' });

    try {
      const results = await generateFashionShots(
        state.referenceImages,
        state.productImages,
        state.prompt,
        state.outputCount,
        state.resolution,
        state.aspectRatio,
        state.modelTier,
        state.useAnalysisMode,
        state.faceHideEnabled,
        state.faceHideType,
        state.overlayText,
        state.textLanguage,
        state.fontStyle,
        apiSettings
      );

      const historyItem = await saveProjectToSupabase(
        state.userProfile.id,
        state.userProfile.email,
        state.overlayText || "Fashion Collection",
        {
           modelTier: state.modelTier,
           resolution: state.resolution,
           aspectRatio: state.aspectRatio,
           useAnalysisMode: state.useAnalysisMode,
           faceHideEnabled: state.faceHideEnabled,
           faceHideType: state.faceHideType,
           outputCount: state.outputCount,
        },
        state.referenceImages,
        state.productImages,
        results.map(url => ({ id: '', url: url.url, isLoading: false }))
      );

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
    updateState({ view: 'CREATE', overlayText: item.prompt });
  };

  // --- RENDER LOGIC ---
  if (isAuthLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f7f6f8] dark:bg-[#0a0510]">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl animate-pulse">flare</span>
            </div>
        </div>
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
      case 'INTAKE':
        return <ProductIntakeView onBack={() => updateState({ view: 'HOME' })} apiSettings={apiSettings} />;
      case 'EXTRACT':
        return <ExtractGarmentView onBack={() => updateState({ view: 'HOME' })} userProfile={state.userProfile!} />;
      case 'LIBRARY':
        return <LibraryView userProfile={state.userProfile} history={history} onOpenHistory={(item) => { setCurrentProject(item); setGeneratedImages(item.images.map(img => ({ ...img, isLoading: false }))); updateState({ view: 'RESULTS' }); }} onViewImage={setZoomImage} onOpenAdmin={() => updateState({ view: 'ADMIN_PANEL' })} />;
      case 'VIDEO':
        return <VideoStudioView state={state} updateState={updateState} apiSettings={apiSettings} />;
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
    <div className="flex h-screen overflow-hidden bg-[#f7f6f8] dark:bg-[#110b18] font-sans selection:bg-primary/20 text-gray-900 dark:text-white relative transition-colors duration-300">
      {/* Global Background Ambiance */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-pink-500/5 dark:bg-pink-500/10 rounded-full blur-[120px]"></div>
      </div>

      <Sidebar activeView={state.view} onNavigate={(v) => updateState({ view: v })} userProfile={state.userProfile} />
      
      <main className="flex-1 h-full overflow-hidden relative flex flex-col z-10">
        <div className="flex-1 overflow-hidden relative">
          {renderActiveView()}
        </div>
      </main>

      {/* Overlays */}
      <ImageLightbox src={zoomImage} onClose={() => setZoomImage(null)} />

      {/* Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-white/60 dark:bg-black/90 backdrop-blur-md" onClick={() => setShowVersionModal(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] rounded-[40px] p-8 md:p-10 shadow-2xl animate-[scaleIn_0.4s_ease-out] text-left">
             <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">FashionStudio v{CURRENT_VERSION}</h3>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[2px] mt-1">Engine & UI Specifications</p>
                </div>
                <button onClick={() => setShowVersionModal(false)} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.04] text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>
             </div>
             
             <div className="space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                <section>
                   <p className="text-[10px] font-black text-primary uppercase tracking-[3px] mb-4">Core Capabilities</p>
                   <ul className="space-y-4">
                      <li className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                            <span className="material-symbols-outlined text-base">bolt</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Nano Banana 2 Engine</p>
                            <p className="text-xs text-gray-500 mt-0.5">Gemini 3.1 Flash integration for ultra-fast generation.</p>
                        </div>
                      </li>
                      <li className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0 border border-pink-500/20">
                            <span className="material-symbols-outlined text-base">movie</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Cinematic Video Studio</p>
                            <p className="text-xs text-gray-500 mt-0.5">Professional clip creation with advanced director controls.</p>
                        </div>
                      </li>
                      <li className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                            <span className="material-symbols-outlined text-base">brush</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Studio Design System</p>
                            <p className="text-xs text-gray-500 mt-0.5">High-end dark aesthetic with glassmorphism effects.</p>
                        </div>
                      </li>
                   </ul>
                </section>
                
                <div className="pt-8 border-t border-gray-200 dark:border-white/[0.06] text-center">
                   <p className="text-[10px] text-gray-500 leading-relaxed italic font-bold uppercase tracking-widest">
                     Built with passion for fashion designers.<br/>
                     © 2026 Studio Platform.
                   </p>
                </div> </div>
             </div>
          </div>
        )}
      </div>
    );
  };

export default App;
