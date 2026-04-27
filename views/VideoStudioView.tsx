
import React, { useState, useRef } from 'react';
import { Header } from '../components/Common';
import { AppState, VideoClip } from '../types';
import { generateVideoClip } from '../services/veoService';

export const VideoStudioView = ({ state, updateState }: { state: AppState, updateState: (s: Partial<AppState>) => void }) => {
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const videoUrl = await generateVideoClip(clip.sourceImage);
      setClips(prev => prev.map(c => c.id === clip.id ? { ...c, status: 'done', videoUrl } : c));
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
