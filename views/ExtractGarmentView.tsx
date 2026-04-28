import React, { useState, useRef } from 'react';
import { Header } from '../components/Common';
import { UserProfile } from '../types';
import { useTranslation } from 'react-i18next';

export const ExtractGarmentView = ({ onBack, userProfile }: { onBack: () => void, userProfile: UserProfile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedResult, setExtractedResult] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setExtractedResult(null);
    }
  };

  const handleExtract = () => {
    if (!selectedImage) return;
    setIsExtracting(true);
    // Simulate extraction process
    setTimeout(() => {
      setExtractedResult(selectedImage); // In reality, this would be the PNG result
      setIsExtracting(false);
    }, 2000);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f7f6f8] dark:bg-[#110b18] text-left relative overflow-hidden animate-fadeIn">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      
      <Header title={t('extract.title')} backAction={onBack} />
      
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-10 relative z-10 pb-32">
        <div className="max-w-4xl mx-auto space-y-10 studio-container">
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Input Side */}
            <div className="flex-1 space-y-4 animate-slideUp">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-500 text-lg">image</span>
                    Ảnh gốc
                </h3>
                <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-gray-900 dark:hover:text-white transition-colors">Thay đổi</button>
              </div>
              
              <div 
                onClick={() => !selectedImage && fileInputRef.current?.click()}
                className={`aspect-[3/4] rounded-[40px] border-2 border-dashed transition-all duration-500 overflow-hidden relative group ${
                  selectedImage ? 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1025] shadow-lg dark:shadow-2xl shadow-black/5 dark:shadow-black/50' : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:border-emerald-500/40 hover:shadow-[0_0_40px_rgba(16,185,129,0.1)] cursor-pointer'
                }`}
              >
                {selectedImage ? (
                  <>
                    <img src={selectedImage} className="w-full h-full object-cover" alt="Original" />
                    <div className="absolute inset-0 bg-white/80 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                       <button onClick={() => fileInputRef.current?.click()} className="w-14 h-14 rounded-2xl bg-white dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white hover:text-black hover:scale-110 transition-all shadow-xl">
                          <span className="material-symbols-outlined text-2xl">edit</span>
                       </button>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 rounded-[28px] bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm dark:shadow-lg">
                      <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                    </div>
                    <p className="text-base font-black text-gray-900 dark:text-white tracking-tight">Tải lên ảnh người mẫu</p>
                    <p className="text-[11px] text-gray-500 font-bold mt-2 uppercase tracking-[2px]">Hỗ trợ JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>

            {/* Controls & Result Side */}
            <div className="flex-1 flex flex-col animate-slideUp" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500 text-lg">auto_fix</span>
                    Kết quả tách
                </h3>
                {extractedResult && (
                  <button className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors">
                    <span className="material-symbols-outlined text-sm">download</span> Tải về PNG
                  </button>
                )}
              </div>

              <div className={`flex-1 aspect-[3/4] rounded-[40px] bg-white dark:bg-[#1a1025] border transition-all duration-700 relative overflow-hidden flex items-center justify-center ${extractedResult ? 'border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)]' : 'border-gray-200 dark:border-white/[0.06] shadow-sm dark:shadow-xl'}`}>
                {isExtracting ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <span className="material-symbols-outlined animate-pulse">auto_fix_high</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[3px] animate-pulse">Đang tách nền AI...</p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Phân tích chi tiết</p>
                    </div>
                  </div>
                ) : extractedResult ? (
                  <div className="w-full h-full p-6 relative group">
                    <div className="w-full h-full rounded-[24px] overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-repeat shadow-inner border border-gray-200 dark:border-white/5">
                      <img src={extractedResult} className="w-full h-full object-contain hover:scale-105 transition-transform duration-700" alt="Extracted" />
                    </div>
                    <div className="absolute inset-0 bg-white/80 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-5">
                       <button className="w-14 h-14 rounded-2xl bg-white dark:bg-white/10 backdrop-blur-xl text-gray-900 dark:text-white border border-gray-200 dark:border-white/20 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:border-transparent hover:scale-110 transition-all shadow-xl dark:shadow-2xl">
                          <span className="material-symbols-outlined text-2xl">download</span>
                       </button>
                       <button className="w-14 h-14 rounded-2xl bg-white dark:bg-white/10 backdrop-blur-xl text-gray-900 dark:text-white border border-gray-200 dark:border-white/20 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white hover:text-black hover:scale-110 transition-all shadow-xl dark:shadow-2xl">
                          <span className="material-symbols-outlined text-2xl">zoom_in</span>
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 opacity-30">
                    <span className="material-symbols-outlined text-6xl text-gray-500 mb-4">content_cut</span>
                    <p className="text-[11px] font-black text-gray-500 uppercase tracking-[3px]">Chưa có dữ liệu</p>
                  </div>
                )}
              </div>
              
              <div className="mt-8">
                <button 
                  disabled={!selectedImage || isExtracting}
                  onClick={handleExtract}
                  className={`w-full h-16 rounded-[24px] font-black text-sm uppercase tracking-[2px] flex items-center justify-center gap-3 transition-all duration-500 ${
                    selectedImage && !isExtracting 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl dark:shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98]' 
                      : 'bg-gray-100 dark:bg-white/[0.04] text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-white/[0.06] cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">{selectedImage && !isExtracting ? 'auto_fix' : 'hourglass_empty'}</span>
                  Bắt đầu tách sản phẩm
                </button>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="card-premium rounded-[32px] p-8 flex gap-5 items-start animate-slideUp bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08]" style={{ animationDelay: '0.2s' }}>
             <div className="w-12 h-12 shrink-0 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm dark:shadow-lg">
                <span className="material-symbols-outlined text-2xl">lightbulb</span>
             </div>
             <div>
                <h4 className="text-base font-black text-gray-900 dark:text-white tracking-tight">Studio Tips</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">Sử dụng ảnh có độ phân giải cao và nền đơn giản để đạt kết quả tách tốt nhất. Hệ thống AI Engine sẽ tự động nhận diện trang phục và loại bỏ nền/người mẫu với độ chính xác cấp độ pixel.</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
