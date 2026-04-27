
import React from 'react';
import { GeneratedImage, HistoryItem } from '../types';

export const ResultsView = ({ images, onBack, onHome, onViewImage, onRemix, currentProject }: { images: GeneratedImage[], onBack: () => void, onHome: () => void, onViewImage: (url: string) => void, onRemix: (item: HistoryItem) => void, currentProject?: HistoryItem }) => {
  const downloadImage = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `fashion-studio-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-background-dark text-left">
      <header className="flex items-center justify-between px-8 py-6 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl sticky top-0 z-30 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            </div>
            <div>
                <h2 className="text-lg font-black dark:text-white text-gray-900 tracking-tight leading-none">Kết quả thiết kế</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">AI Generated Results</p>
            </div>
        </div>
        <div className="flex gap-4">
           {currentProject && (
             <button onClick={() => onRemix(currentProject)} className="px-6 py-3 bg-white dark:bg-white/5 text-gray-900 dark:text-white font-black rounded-2xl text-[11px] uppercase tracking-widest flex items-center gap-2 border border-gray-200 dark:border-white/10 hover:bg-gray-50 transition-all shadow-sm">
               <span className="material-symbols-outlined text-sm">edit</span> Remix
             </button>
           )}
           <button onClick={onBack} className="px-8 py-3 bg-primary text-white font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl shadow-primary/40 hover:bg-primary-hover active:scale-95 transition-all">
             Tạo thêm bộ mới
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 md:p-12 no-scrollbar">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 max-w-[1600px] mx-auto pb-20">
            {images.map((img, idx) => (
              <div key={img.id || idx} className="group relative rounded-[48px] overflow-hidden bg-white dark:bg-surface-card aspect-[3/4] shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 hover:scale-[1.02] transition-all duration-700">
                 {img.isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[2px] animate-pulse">AI đang vẽ...</p>
                    </div>
                 ) : (
                    <>
                      <img src={img.url} className="w-full h-full object-cover" alt="Generated" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                         <div className="flex gap-4 justify-center">
                            <button onClick={() => onViewImage(img.url)} className="w-14 h-14 rounded-[22px] bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-black transition-all active:scale-90">
                               <span className="material-symbols-outlined text-2xl">zoom_in</span>
                            </button>
                            <button onClick={() => downloadImage(img.url, img.id)} className="w-14 h-14 rounded-[22px] bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-90">
                               <span className="material-symbols-outlined text-2xl">download</span>
                            </button>
                         </div>
                         <p className="text-center text-white/60 text-[9px] font-bold uppercase tracking-[2px] mt-6">Nhấn để xem chi tiết</p>
                      </div>
                    </>
                 )}
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};
