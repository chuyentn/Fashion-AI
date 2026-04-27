
import React, { useState, useRef } from 'react';
import { Header } from '../components/Common';
import { AppState, VideoClip, VideoStructuredPrompt } from '../types';
import { generateFashionVideo } from '../services/veoService';
import { fileToBase64 } from '../services/geminiService';

export const VideoStudioView = ({ state, updateState, apiSettings }: { state: AppState, updateState: (s: Partial<AppState>) => void, apiSettings: any }) => {
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

  const downloadAllAsZip = () => {
    alert("Tính năng tải Zip đang được chuẩn bị. Bạn có thể tải từng video bằng nút Tải xuống.");
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark text-left">
      <Header title="Video Studio" backAction={() => updateState({ view: 'HOME' })} />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar pb-32">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {clips.length === 0 ? (
            <div onClick={() => fileInputRef.current?.click()} className="aspect-video rounded-[40px] border-2 border-dashed border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 transition-all group">
               <div className="w-20 h-20 rounded-3xl bg-pink-500/10 text-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-4xl">movie</span>
               </div>
               <p className="text-lg font-black dark:text-white text-gray-900">Tạo video từ hình ảnh</p>
               <p className="text-sm text-gray-500 mt-2">Kéo thả hoặc click để chọn ảnh thời trang</p>
            </div>
          ) : (
            <>
              {/* Advanced Settings Panel */}
              <div className="bg-white dark:bg-surface-card rounded-[32px] p-6 border border-gray-100 dark:border-white/5 shadow-sm">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center">
                      <span className="material-symbols-outlined">tune</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black dark:text-white">Cấu hình Đạo diễn (Advanced)</h3>
                      <p className="text-xs text-gray-500">Tùy chỉnh góc máy, hiệu ứng, chuyển cảnh chuyên sâu</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-gray-400">
                    {showSettings ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
                
                {showSettings && (
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Câu lệnh / Kịch bản</label>
                      <textarea 
                        value={advancedSettings.scenePrompt}
                        onChange={(e) => setAdvancedSettings({...advancedSettings, scenePrompt: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm dark:text-white focus:ring-2 focus:ring-pink-500 outline-none resize-none"
                        rows={3}
                        placeholder="Mô tả hành động, bối cảnh, trang phục..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Góc máy (Camera Angle)</label>
                      <select 
                        value={advancedSettings.cameraAngle}
                        onChange={(e) => setAdvancedSettings({...advancedSettings, cameraAngle: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm dark:text-white focus:ring-2 focus:ring-pink-500 outline-none appearance-none"
                      >
                        <option value="Default">Mặc định (AI tự chọn)</option>
                        <option value="Close-up shot">Cận cảnh (Close-up)</option>
                        <option value="Wide shot">Toàn cảnh (Wide shot)</option>
                        <option value="Low angle">Từ dưới lên (Low angle)</option>
                        <option value="High angle">Từ trên xuống (High angle)</option>
                        <option value="Drone shot">Góc Flycam (Drone shot)</option>
                        <option value="Tracking shot">Tracking shot (Theo dõi)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tốc độ (Speed)</label>
                      <select 
                        value={advancedSettings.speed}
                        onChange={(e) => setAdvancedSettings({...advancedSettings, speed: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm dark:text-white focus:ring-2 focus:ring-pink-500 outline-none appearance-none"
                      >
                        <option value="Normal">Bình thường (Normal)</option>
                        <option value="Slow Motion">Quay chậm (Slow Motion)</option>
                        <option value="Fast Motion">Tua nhanh (Fast Motion)</option>
                        <option value="Timelapse">Timelapse</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hiệu ứng (Effects)</label>
                      <select 
                        value={advancedSettings.effects}
                        onChange={(e) => setAdvancedSettings({...advancedSettings, effects: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm dark:text-white focus:ring-2 focus:ring-pink-500 outline-none appearance-none"
                      >
                        <option value="None">Không có</option>
                        <option value="Cinematic Lighting">Ánh sáng điện ảnh (Cinematic)</option>
                        <option value="Vintage Film">Phim cổ điển (Vintage)</option>
                        <option value="Cyberpunk">Cyberpunk Neon</option>
                        <option value="Dreamy Soft Focus">Mơ màng (Dreamy)</option>
                        <option value="Studio Lighting">Ánh sáng Studio</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Chuyển cảnh (Transition)</label>
                      <select 
                        value={advancedSettings.transition}
                        onChange={(e) => setAdvancedSettings({...advancedSettings, transition: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm dark:text-white focus:ring-2 focus:ring-pink-500 outline-none appearance-none"
                      >
                        <option value="None">Không có (Cắt cảnh tự nhiên)</option>
                        <option value="Fade in">Sáng dần (Fade in)</option>
                        <option value="Fade out">Tối dần (Fade out)</option>
                        <option value="Zoom in">Zoom cận cảnh (Zoom in)</option>
                        <option value="Pan left">Quay trái (Pan left)</option>
                        <option value="Pan right">Quay phải (Pan right)</option>
                      </select>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ngữ cảnh Âm thanh / Thoại (Voice)</label>
                      <input 
                        type="text"
                        value={advancedSettings.voice}
                        onChange={(e) => setAdvancedSettings({...advancedSettings, voice: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                        placeholder="VD: Người mẫu đang nói 'Xin chào', tiếng nhạc điện tử sôi động..."
                      />
                      <p className="text-xs text-gray-400 mt-2">* Thông tin này giúp AI hiểu ngữ cảnh khẩu hình miệng hoặc không khí video.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Clips Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clips.map((clip) => (
                <div key={clip.id} className="group bg-white dark:bg-surface-card rounded-[32px] overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all">
                  <div className="aspect-square relative">
                    {clip.videoUrl ? (
                      <video src={clip.videoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                    ) : (
                      <img src={clip.sourceImage} className="w-full h-full object-cover" alt="Source" />
                    )}
                    
                    {clip.status === 'generating' && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest animate-pulse">Đang tạo Video...</p>
                      </div>
                    )}

                    <div className="absolute top-4 right-4 flex gap-2">
                       {clip.status === 'done' && (
                          <a href={clip.videoUrl} download className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-sm">download</span>
                          </a>
                       )}
                       <button onClick={() => setClips(clips.filter(c => c.id !== clip.id))} className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur hover:bg-red-500 transition-colors">
                          <span className="material-symbols-outlined text-sm">close</span>
                       </button>
                    </div>
                  </div>
                  
                  <div className="p-5 flex items-center justify-between">
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</p>
                        <p className={`text-sm font-bold ${clip.status === 'done' ? 'text-emerald-500' : clip.status === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
                           {clip.status === 'idle' ? 'Chờ xử lý' : clip.status === 'generating' ? 'Đang tạo...' : clip.status === 'done' ? 'Hoàn tất ✓' : 'Lỗi thử lại'}
                        </p>
                     </div>
                     {clip.status !== 'done' && clip.status !== 'generating' && (
                        <button onClick={() => processClip(clip)} className="px-4 py-2 bg-pink-500 text-white text-xs font-black rounded-xl shadow-lg shadow-pink-500/20">TẠO NGAY</button>
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
      <div className="fixed bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-white dark:from-background-dark via-white/90 dark:via-background-dark/90 to-transparent pointer-events-none z-40">
        <div className="max-w-md mx-auto flex gap-4 pointer-events-auto">
          {clips.length > 0 && (
            <>
              <button onClick={() => fileInputRef.current?.click()} className="flex-1 h-16 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-black flex items-center justify-center gap-2 shadow-xl">
                 <span className="material-symbols-outlined">add_photo_alternate</span> Thêm
              </button>
              <button onClick={generateAll} disabled={isGeneratingAll || clips.every(c => c.status === 'done')} className={`flex-[2] h-16 rounded-3xl bg-pink-500 text-white font-black flex items-center justify-center gap-3 shadow-2xl shadow-pink-500/30 transition-all active:scale-[0.98] ${isGeneratingAll ? 'opacity-70' : 'hover:bg-pink-600'}`}>
                 <span className="material-symbols-outlined">{isGeneratingAll ? 'hourglass_empty' : 'auto_awesome'}</span>
                 {isGeneratingAll ? 'ĐANG TẠO CLIP...' : `TẠO TẤT CẢ (${clips.filter(c => c.status === 'idle' || c.status === 'error').length})`}
              </button>
            </>
          )}
        </div>
      </div>
      
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addClip(e.target.files)} />
    </div>
  );
};
