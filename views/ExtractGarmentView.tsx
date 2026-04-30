import React, { useState, useRef } from 'react';
import { Header } from '../components/Common';
import { UserProfile, ImageFile, GeneratedImage, AppState } from '../types';
import { useTranslation } from 'react-i18next';
import { fileToBase64, detectClothingItems, extractClothingItem, urlToBase64 } from '../services/geminiService';
import { loadApiSettings } from '../services/apiSettings';
import { saveExtractedResult } from '../services/supabase';

interface ExtractGarmentProps {
  onBack: () => void;
  userProfile: UserProfile;
  state: AppState;
  updateState: (s: Partial<AppState>) => void;
}

export const ExtractGarmentView = ({ onBack, userProfile, state, updateState }: ExtractGarmentProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [productName, setProductName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedItems, setDetectedItems] = useState<{ label: string, description: string, status: 'idle' | 'loading' | 'done' }[]>([]);
  const [extractedImages, setExtractedImages] = useState<GeneratedImage[]>([]);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const apiSettings = loadApiSettings();
  const { t } = useTranslation();

  // === LOAD IMAGE (from file) ===
  const loadImage = (img: ImageFile) => {
    setSelectedImage(img);
    setDetectedItems([]);
    setExtractedImages([]);
    setSavingIds(new Set());
    setSavedIds(new Set());
  };

  const loadImageAndDetect = async (img: ImageFile) => {
    if (img !== selectedImage) {
      setSelectedImage(img);
      setDetectedItems([]);
      setExtractedImages([]);
      setSavingIds(new Set());
      setSavedIds(new Set());
    }

    setIsDetecting(true);
    try {
      const items = await detectClothingItems(img, apiSettings);
      if (items.length === 0) {
        alert("Không phát hiện vật thể nào. Hãy thử ảnh rõ hơn hoặc nhấn 'Nhận diện lại'.");
      }
      setDetectedItems(items.map(it => ({ ...it, status: 'idle' as const })));
    } catch (err) {
      alert("Lỗi nhận diện vật thể. Kiểm tra API Key trong Cài đặt.");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      const img: ImageFile = {
        id: `orig-${Date.now()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        base64,
        mimeType: file.type
      };
      loadImage(img);
    }
  };

  // === LOAD IMAGE (from URL) ===
  const handleAddImageUrl = async () => {
    if (!imageUrl) return;
    setIsAddingUrl(true);
    try {
      const { base64, mimeType } = await urlToBase64(imageUrl);
      const img: ImageFile = {
        id: `url-${Date.now()}`,
        file: null,
        previewUrl: imageUrl,
        base64,
        mimeType
      };
      setImageUrl('');
      loadImage(img);
    } catch (err: any) {
      alert(err.message || "Lỗi tải ảnh từ URL.");
    } finally {
      setIsAddingUrl(false);
    }
  };

  // === EXTRACT ITEM ===
  const handleExtractItem = async (index: number) => {
    if (!selectedImage) return;
    const item = detectedItems[index];

    const newItems = [...detectedItems];
    newItems[index] = { ...newItems[index], status: 'loading' };
    setDetectedItems(newItems);

    try {
      const result = await extractClothingItem(selectedImage, item.label, item.description, apiSettings);
      if (result) {
        setExtractedImages(prev => [...prev, result]);
        setDetectedItems(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], status: 'done' };
          return updated;
        });
      }
    } catch (err) {
      alert(`Lỗi tách ${item.label}`);
      setDetectedItems(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], status: 'idle' };
        return updated;
      });
    }
  };

  const handleAutoExtractAll = async () => {
    for (let i = 0; i < detectedItems.length; i++) {
      if (detectedItems[i].status === 'idle') {
        await handleExtractItem(i);
      }
    }
  };

  // === DOWNLOAD ===
  const handleDownload = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `fashion-extract-${img.label || img.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // === SAVE TO LIBRARY ===
  const handleSaveToLibrary = async (img: GeneratedImage) => {
    if (!selectedImage || !userProfile?.id) return;
    setSavingIds(prev => new Set(prev).add(img.id));
    try {
      const success = await saveExtractedResult(userProfile.id, selectedImage, img, img.label || 'Extracted');
      if (success) {
        setSavedIds(prev => new Set(prev).add(img.id));
      } else {
        alert("Không thể lưu. Vui lòng thử lại.");
      }
    } catch (err) {
      alert("Lỗi lưu ảnh.");
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(img.id);
        return next;
      });
    }
  };

  // === SEND TO CREATE STUDIO ===
  const handleSendToStudio = (img: GeneratedImage) => {
    // Convert GeneratedImage to ImageFile format
    const productImage: ImageFile = {
      id: `extracted-prod-${Date.now()}`,
      file: null,
      previewUrl: img.url,
      base64: img.url.replace(/^data:image\/\w+;base64,/, ''),
      mimeType: 'image/png'
    };
    updateState({
      pendingProductImage: productImage,
      view: 'CREATE' as any
    });
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f7f6f8] dark:bg-[#110b18] text-left relative overflow-hidden animate-fadeIn">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />

      <Header title="Tách Đồ Áo" backAction={onBack} />

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-10 relative z-10 pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* ========== LEFT COLUMN (4/12) ========== */}
          <div className="lg:col-span-4 space-y-6 animate-slideUp">
            <div className="bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] rounded-[32px] p-6 shadow-xl">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Ảnh gốc</p>

              {/* URL Input */}
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Dán link ảnh trực tiếp..."
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddImageUrl()}
                  className="flex-1 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  onClick={handleAddImageUrl}
                  disabled={isAddingUrl || !imageUrl}
                  className="h-10 px-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                >
                  {isAddingUrl ? '...' : 'Thêm URL'}
                </button>
              </div>

              {/* Image Preview / Upload Zone */}
              <div
                onClick={() => !selectedImage && fileInputRef.current?.click()}
                className={`aspect-[3/4] rounded-[24px] border-2 border-dashed transition-all duration-500 overflow-hidden relative group ${
                  selectedImage ? 'border-gray-200 dark:border-white/10' : 'border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.01] hover:border-emerald-500/40 cursor-pointer'
                }`}
              >
                {selectedImage ? (
                  <img src={selectedImage.previewUrl} className="w-full h-full object-cover" alt="Original" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                    </div>
                    <p className="text-sm font-black text-gray-900 dark:text-white">Tải lên ảnh mẫu</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">Hoặc dán link ở trên</p>
                  </div>
                )}
                {selectedImage && (
                  <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/80 dark:bg-black/60 backdrop-blur-md flex items-center justify-center text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                    <span className="material-symbols-outlined text-xl">edit</span>
                  </button>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

              {/* === MAIN ACTION BUTTONS — RIGHT AFTER IMAGE === */}
              {selectedImage && (
                <div className="mt-5 space-y-3 animate-slideUp">

                  {/* Big Detect Button */}
                  <button
                    onClick={() => loadImageAndDetect(selectedImage)}
                    disabled={isDetecting}
                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 shadow-lg ${
                      isDetecting
                        ? 'bg-gray-200 dark:bg-white/10 text-gray-400 cursor-wait'
                        : detectedItems.length > 0
                          ? 'bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-500 border border-gray-200 dark:border-white/10'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5'
                    }`}
                  >
                    {isDetecting ? (
                      <>
                        <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                        Đang nhận diện AI...
                      </>
                    ) : detectedItems.length > 0 ? (
                      <>
                        <span className="material-symbols-outlined text-xl">refresh</span>
                        Nhận diện lại
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xl">search</span>
                        🔍 Nhận diện vật thể
                      </>
                    )}
                  </button>

                  {/* Big Extract All Button */}
                  {detectedItems.length > 0 && detectedItems.some(it => it.status === 'idle') && (
                    <button
                      onClick={handleAutoExtractAll}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-pink-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300 shadow-lg"
                    >
                      <span className="material-symbols-outlined text-xl">content_cut</span>
                      ✂️ Tách tất cả ({detectedItems.filter(it => it.status === 'idle').length} món)
                    </button>
                  )}
                </div>
              )}

              {/* Detected Items List */}
              {(detectedItems.length > 0 || isDetecting) && (
                <div className="mt-5">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
                    Phát hiện: {detectedItems.length} vật thể
                  </label>
                  <div className="space-y-2">
                    {isDetecting ? (
                      <div className="py-6 text-center">
                        <div className="w-10 h-10 border-[3px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase animate-pulse">Đang phân tích ảnh...</p>
                      </div>
                    ) : detectedItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04] rounded-xl group hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm">checkroom</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{item.label}</p>
                            <p className="text-[9px] text-gray-500 truncate max-w-[150px]">{item.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleExtractItem(i)}
                          disabled={item.status !== 'idle'}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            item.status === 'done' ? 'bg-emerald-500 text-white' :
                            item.status === 'loading' ? 'bg-gray-200 dark:bg-white/10 text-emerald-500' :
                            'bg-gray-200 dark:bg-white/10 text-gray-400 group-hover:bg-emerald-500 group-hover:text-white'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-xs ${item.status === 'loading' ? 'animate-spin' : ''}`}>
                            {item.status === 'done' ? 'check' : item.status === 'loading' ? 'progress_activity' : 'arrow_forward'}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Name — Moved to bottom, less priority */}
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/[0.04]">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Tên sản phẩm (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="VD: Áo sơ mi lụa..."
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* ========== RIGHT COLUMN (8/12) — RESULTS GRID ========== */}
          <div className="lg:col-span-8 animate-slideUp" style={{ animationDelay: '0.1s' }}>
            {extractedImages.length > 0 && (
              <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Kết quả ({extractedImages.length} ảnh)</p>
                <button
                  onClick={() => extractedImages.forEach(handleDownload)}
                  className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Tải tất cả
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {extractedImages.map((img, i) => {
                const isSaving = savingIds.has(img.id);
                const isSaved = savedIds.has(img.id);
                return (
                  <div key={img.id} className="bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] rounded-[28px] overflow-hidden shadow-xl animate-scaleIn group" style={{ animationDelay: `${i * 80}ms` }}>
                    {/* Image */}
                    <div className="aspect-[3/4] relative bg-[repeating-conic-gradient(#f3f4f6_0%_25%,#ffffff_0%_50%)] dark:bg-[repeating-conic-gradient(#1a1025_0%_25%,#0f0a17_0%_50%)] bg-[length:16px_16px]">
                      <img src={img.url} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-700" alt={img.label} />
                    </div>

                    {/* Label + Actions */}
                    <div className="p-4 border-t border-gray-200 dark:border-white/[0.04] space-y-3">
                      <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest text-center">{img.label}</p>

                      <div className="flex items-center gap-2">
                        {/* Download */}
                        <button
                          onClick={() => handleDownload(img)}
                          title="Tải về PNG"
                          className="flex-1 h-9 rounded-xl bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          Tải về
                        </button>

                        {/* Save to Library */}
                        <button
                          onClick={() => handleSaveToLibrary(img)}
                          disabled={isSaving || isSaved}
                          title={isSaved ? "Đã lưu" : "Lưu vào Thư viện"}
                          className={`flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                            isSaved ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            isSaving ? 'bg-gray-100 dark:bg-white/[0.04] text-gray-400 animate-pulse' :
                            'bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 hover:bg-primary hover:text-white'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-sm ${isSaving ? 'animate-spin' : ''}`}>
                            {isSaved ? 'check_circle' : isSaving ? 'progress_activity' : 'bookmark_add'}
                          </span>
                          {isSaved ? 'Đã lưu' : isSaving ? '...' : 'Lưu'}
                        </button>

                        {/* Send to Studio */}
                        <button
                          onClick={() => handleSendToStudio(img)}
                          title="Đưa sang Studio"
                          className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pending placeholders */}
              {detectedItems.filter(it => it.status !== 'done').map((item, i) => (
                <div key={`p-${i}`} className="aspect-[3/4] rounded-[28px] border-2 border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.01] flex flex-col items-center justify-center text-center p-6">
                  {item.status === 'loading' ? (
                    <div className="animate-spin text-emerald-500 mb-4"><span className="material-symbols-outlined text-4xl">progress_activity</span></div>
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-700 mb-4">hourglass_empty</span>
                  )}
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.status === 'loading' ? 'Đang tách...' : 'Chờ tách'}</p>
                  <p className="text-[9px] text-gray-400 mt-1">{item.label}</p>
                </div>
              ))}

              {/* Empty state */}
              {detectedItems.length === 0 && extractedImages.length === 0 && !isDetecting && (
                <div className="col-span-full py-32 text-center opacity-30">
                  <span className="material-symbols-outlined text-6xl text-gray-500 mb-4">layers</span>
                  <p className="text-[11px] font-black text-gray-500 uppercase tracking-[3px]">Tải ảnh để bắt đầu tách vật thể</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
