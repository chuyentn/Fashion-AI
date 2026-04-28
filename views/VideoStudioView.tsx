
import React, { useState, useRef } from 'react';
import { Header } from '../components/Common';
import { AppState, VideoClip, VideoStructuredPrompt } from '../types';
import { generateFashionVideo } from '../services/veoService';
import { fileToBase64 } from '../services/geminiService';
import { useTranslation } from 'react-i18next';

export const VideoStudioView = ({ state, updateState, apiSettings }: { state: AppState, updateState: (s: Partial<AppState>) => void, apiSettings: any }) => {
  const { t } = useTranslation();
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [advancedSettings, setAdvancedSettings] = useState<VideoStructuredPrompt>({
    scenePrompt: 'Model walking gracefully on a high-end fashion runway',
    cameraAngle: 'Default',
    transition: 'None',
    speed: 'Normal',
    effects: 'None',
    voice: ''
  });
  const [showSettings, setShowSettings] = useState(false);

  const addClip = async (files: FileList | null) => {
    if (!files) return;
    const newClips: VideoClip[] = await Promise.all(Array.from(files).map(async f => ({
      id: Math.random().toString(36).substr(2, 9),
      sourceImage: URL.createObjectURL(f),
      status: 'idle'
    })));
    setClips([...clips, ...newClips]);
  };

  const processClip = async (clip: VideoClip) => {
    setClips(prev => prev.map(c => c.id === clip.id ? { ...c, status: 'generating' } : c));
    try {
      const response = await fetch(clip.sourceImage);
      const blob = await response.blob();
      const base64 = await fileToBase64(blob);
      const result = await generateFashionVideo(base64, blob.type, apiSettings, {
        structuredPrompt: advancedSettings
      });
      
      setClips(prev => prev.map(c => c.id === clip.id ? { ...c, status: 'done', videoUrl: result?.url || '' } : c));
    } catch (err) {
      setClips(prev => prev.map(c => c.id === clip.id ? { ...c, status: 'error' } : c));
    }
  };

  const generateAll = async () => {
    setIsGeneratingAll(true);
    for (const clip of clips) {
      if (clip.status === 'idle' || clip.status === 'error') {
        await processClip(clip);
      }
    }
    setIsGeneratingAll(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#f7f6f8] dark:bg-[#110b18] text-left relative overflow-hidden animate-fadeIn">
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-pink-500/5 dark:bg-pink-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />

      <Header title={t('video.title')} backAction={() => updateState({ view: 'HOME' })} />
      
      <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar pb-40 relative z-10">
        <div className="max-w-6xl mx-auto space-y-10 studio-container">
          
          {clips.length === 0 ? (
            <div onClick={() => fileInputRef.current?.click()} className="aspect-video md:aspect-[21/9] rounded-[40px] border-2 border-dashed border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.015] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:border-pink-500/30 transition-all duration-500 group shadow-sm dark:shadow-inner">
               <div className="w-20 h-20 rounded-[28px] bg-pink-50 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20 text-pink-500 dark:text-pink-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-pink-500 group-hover:text-white transition-all shadow-sm dark:shadow-lg">
                  <span className="material-symbols-outlined text-4xl">movie</span>
               </div>
               <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{t('video.upload')}</p>
               <p className="text-[11px] text-gray-500 font-bold mt-2 uppercase tracking-[3px]">{t('video.uploadDesc')}</p>
            </div>
          ) : (
            <>
              {/* Advanced Settings Panel */}
              <div className="card-premium rounded-[32px] p-6 animate-slideUp bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
                <div 
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20 text-pink-500 dark:text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm dark:shadow-lg">
                      <span className="material-symbols-outlined text-xl">tune</span>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('video.config')}</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{t('video.configDesc')}</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 group-hover:bg-pink-500 group-hover:text-white transition-all">
                    <span className="material-symbols-outlined">{showSettings ? 'expand_less' : 'expand_more'}</span>
                  </div>
                </div>
                
                {showSettings && (
                  <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">{t('video.prompt')}</label>
                      <textarea 
                        value={advancedSettings.scenePrompt}
                        onChange={(e) => setAdvancedSettings({...advancedSettings, scenePrompt: e.target.value})}
                        className="input-studio w-full resize-none"
                        rows={3}
                        placeholder={t('video.promptPlaceholder')}
                      />
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">{t('video.camera')}</label>
                        <select 
                          value={advancedSettings.cameraAngle}
                          onChange={(e) => setAdvancedSettings({...advancedSettings, cameraAngle: e.target.value})}
                          className="input-studio w-full appearance-none cursor-pointer"
                        >
                          <option value="Default">Mặc định (AI tự chọn)</option>
                          <option value="Close-up shot">Cận cảnh (Close-up)</option>
                          <option value="Wide shot">Toàn cảnh (Wide shot)</option>
                          <option value="Low angle">Từ dưới lên (Low angle)</option>
                          <option value="High angle">Từ trên xuống (High angle)</option>
                          <option value="Drone shot">Góc Flycam (Drone shot)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">{t('video.speed')}</label>
                        <select 
                          value={advancedSettings.speed}
                          onChange={(e) => setAdvancedSettings({...advancedSettings, speed: e.target.value})}
                          className="input-studio w-full appearance-none cursor-pointer"
                        >
                          <option value="Normal">Bình thường (Normal)</option>
                          <option value="Slow Motion">Quay chậm (Slow Motion)</option>
                          <option value="Fast Motion">Tua nhanh (Fast Motion)</option>
                          <option value="Timelapse">Timelapse</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">{t('video.effects')}</label>
                        <select 
                          value={advancedSettings.effects}
                          onChange={(e) => setAdvancedSettings({...advancedSettings, effects: e.target.value})}
                          className="input-studio w-full appearance-none cursor-pointer"
                        >
                          <option value="None">Không có</option>
                          <option value="Cinematic Lighting">Ánh sáng điện ảnh</option>
                          <option value="Vintage Film">Phim cổ điển</option>
                          <option value="Cyberpunk">Cyberpunk Neon</option>
                          <option value="Studio Lighting">Ánh sáng Studio</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">{t('video.transition')}</label>
                        <select 
                          value={advancedSettings.transition}
                          onChange={(e) => setAdvancedSettings({...advancedSettings, transition: e.target.value})}
                          className="input-studio w-full appearance-none cursor-pointer"
                        >
                          <option value="None">Cắt cảnh tự nhiên</option>
                          <option value="Fade in">Sáng dần (Fade in)</option>
                          <option value="Zoom in">Zoom cận cảnh</option>
                          <option value="Pan left">Quay trái</option>
                          <option value="Pan right">Quay phải</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">{t('video.voice')}</label>
                      <input 
                        type="text"
                        value={advancedSettings.voice}
                        onChange={(e) => setAdvancedSettings({...advancedSettings, voice: e.target.value})}
                        className="input-studio w-full"
                        placeholder="VD: Người mẫu nói 'Xin chào', nhạc điện tử..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Clips Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {clips.map((clip, idx) => (
                <div key={clip.id} className="group card-premium rounded-[32px] overflow-hidden animate-slideUp bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="aspect-square relative">
                    {clip.videoUrl ? (
                      <video src={clip.videoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                    ) : (
                      <img src={clip.sourceImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Source" />
                    )}
                    
                    {clip.status === 'generating' && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                        <div className="relative">
                            <div className="w-14 h-14 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mb-6"></div>
                            <div className="absolute inset-0 flex items-center justify-center -mt-6">
                                <span className="material-symbols-outlined text-pink-400 animate-pulse">movie</span>
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[3px] animate-pulse">AI đang dựng phim...</p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-2">Áp dụng góc máy & ánh sáng</p>
                      </div>
                    )}

                    <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                       {clip.status === 'done' && (
                          <a href={clip.videoUrl} download className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-xl">download</span>
                          </a>
                       )}
                       <button onClick={() => setClips(clips.filter(c => c.id !== clip.id))} className="w-10 h-10 rounded-xl bg-white/80 dark:bg-black/60 text-gray-900 dark:text-white flex items-center justify-center backdrop-blur-md hover:bg-red-500 hover:text-white dark:hover:bg-red-500 hover:scale-110 transition-all border border-gray-200 dark:border-white/10 shadow-lg">
                          <span className="material-symbols-outlined text-lg">close</span>
                       </button>
                    </div>
                  </div>
                  
                  <div className="p-5 bg-gray-50 dark:bg-[#1a1025] flex items-center justify-between border-t border-gray-200 dark:border-white/[0.04]">
                     <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[2px]">Trạng thái</p>
                        <p className={`text-xs font-black mt-1 uppercase tracking-widest ${clip.status === 'done' ? 'text-emerald-500 dark:text-emerald-400' : clip.status === 'error' ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-gray-300'}`}>
                           {clip.status === 'idle' ? t('video.status.idle') : clip.status === 'generating' ? t('video.status.generating') : clip.status === 'done' ? t('video.status.done') : t('video.status.error')}
                        </p>
                     </div>
                     {clip.status !== 'done' && clip.status !== 'generating' && (
                        <button onClick={() => processClip(clip)} className="btn-primary px-5 py-2.5 text-[10px] bg-pink-500 border-pink-500 text-white hover:bg-pink-600 shadow-pink-500/20 hover:shadow-pink-500/40">
                            {t('video.generateNow')}
                        </button>
                     )}
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Controls */}
      <div className="fixed bottom-0 left-0 lg:left-[280px] right-0 p-6 md:p-8 bg-white/90 dark:bg-[#110b18]/90 backdrop-blur-3xl border-t border-gray-200 dark:border-white/[0.06] z-40 shadow-[0_-20px_40px_rgba(0,0,0,0.02)] dark:shadow-none">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 pointer-events-auto">
          <div className="hidden md:block">
            <p className="text-xs font-black text-gray-400 uppercase tracking-[2.5px]">{t('video.ready')}</p>
            <p className="text-[10px] text-gray-600 font-bold uppercase mt-1 tracking-widest">Veo Video Studio Engine</p>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
              {clips.length > 0 && (
                <>
                  <button onClick={() => fileInputRef.current?.click()} className="w-16 h-16 shrink-0 rounded-[24px] bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all shadow-sm dark:shadow-xl active:scale-95">
                     <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                  </button>
                  <button onClick={generateAll} disabled={isGeneratingAll || clips.every(c => c.status === 'done')} className={`flex-1 sm:min-w-[320px] h-16 rounded-[24px] bg-pink-500 text-white font-black flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(236,72,153,0.3)] transition-all active:scale-[0.98] ${isGeneratingAll ? 'opacity-70' : 'hover:bg-pink-600 hover:shadow-[0_0_60px_rgba(236,72,153,0.5)] hover:scale-[1.02]'}`}>
                     <span className="material-symbols-outlined text-2xl animate-pulse">{isGeneratingAll ? 'hourglass_empty' : 'movie'}</span>
                     <span className="uppercase tracking-[2px] text-sm">{isGeneratingAll ? t('video.status.generating') : `${t('video.generateAll')} (${clips.filter(c => c.status === 'idle' || c.status === 'error').length})`}</span>
                  </button>
                </>
              )}
          </div>
        </div>
      </div>
      
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addClip(e.target.files)} />
    </div>
  );
};
