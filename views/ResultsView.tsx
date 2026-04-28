
import React from 'react';
import { GeneratedImage, HistoryItem } from '../types';
import { useTranslation } from 'react-i18next';

export const ResultsView = ({ images, onBack, onHome, onViewImage, onRemix, currentProject }: { images: GeneratedImage[], onBack: () => void, onHome: () => void, onViewImage: (url: string) => void, onRemix: (item: HistoryItem) => void, currentProject?: HistoryItem }) => {
  const { t } = useTranslation();
  const downloadImage = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `fashion-studio-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-[#f7f6f8] dark:bg-[#110b18] text-left relative overflow-hidden animate-fadeIn">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />

      <header className="flex items-center justify-between px-6 py-5 md:px-10 md:py-8 bg-white/80 dark:bg-[#110b18]/80 backdrop-blur-3xl sticky top-0 z-30 border-b border-gray-200 dark:border-white/[0.06]">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-lg border border-primary/20">
                <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            </div>
            <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Studio Gallery</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[2.5px] mt-1.5">AI Professional Collection</p>
            </div>
        </div>
        <div className="flex gap-3.5">
           {currentProject && (
             <button onClick={() => onRemix(currentProject)} className="btn-secondary px-6 py-3 text-[11px] bg-gray-100 dark:bg-white/[0.04]">
               <span className="material-symbols-outlined text-lg mr-2">edit</span> Remix
             </button>
           )}
           <button onClick={onBack} className="btn-primary px-8 py-3 text-[11px]">
             {t('results.new')}
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar relative z-10 pb-32">
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 studio-container">
            {images.map((img, idx) => (
              <div key={img.id || idx} className="group relative rounded-[48px] overflow-hidden bg-white dark:bg-[#1a1025] aspect-[3/4] border border-gray-200 dark:border-white/[0.08] hover:border-primary/50 hover:shadow-[0_0_50px_rgba(164,19,236,0.2)] hover:-translate-y-2 transition-all duration-700 animate-slideUp" style={{ animationDelay: `${idx * 0.1}s` }}>
                 {img.isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-xl animate-pulse">flare</span>
                            </div>
                        </div>
                        <div className="mt-8 text-center space-y-2">
                            <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-[4px] animate-pulse">Processing AI</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Đang tối ưu hóa chi tiết...</p>
                        </div>
                    </div>
                 ) : (
                    <>
                      <img src={img.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Generated" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0510] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                         <div className="flex gap-4 justify-center translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            <button onClick={() => onViewImage(img.url)} className="w-14 h-14 rounded-[20px] bg-white/10 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all active:scale-90 shadow-2xl">
                               <span className="material-symbols-outlined text-2xl">zoom_in</span>
                            </button>
                            <button onClick={() => downloadImage(img.url, img.id)} className="w-14 h-14 rounded-[20px] bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 hover:shadow-primary/40 transition-all active:scale-90">
                               <span className="material-symbols-outlined text-2xl">download</span>
                            </button>
                         </div>
                         <p className="text-center text-white/40 text-[9px] font-black uppercase tracking-[3px] mt-8 group-hover:text-white/60 transition-colors">Fashion Studio HQ</p>
                      </div>
                      {/* Badge */}
                      <div className="absolute top-6 left-6 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-[9px] font-black text-white uppercase tracking-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                         4K Render
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
