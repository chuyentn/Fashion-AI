import React, { useState, useRef } from 'react';
import { Header } from '../components/Common';
import { analyzeCampaignIntake, fileToBase64, generateBannerImage } from '../services/geminiService';
import { ProductIntakeResult, ImageFile, AppState } from '../types';

export const ProductIntakeView = ({ state, onBack, updateState, apiSettings }: { state: AppState, onBack: () => void, updateState: (s: Partial<AppState>) => void, apiSettings: any }) => {
  const [urlInput, setUrlInput] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchStatus, setBatchStatus] = useState<{current: number, total: number} | null>(null);
  const [activeResultIndex, setActiveResultIndex] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);
  const [generatingBannerIndex, setGeneratingBannerIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const results = state.intakeHistory || [];
  const result = activeResultIndex >= 0 ? results[activeResultIndex] : null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);
      const newImages: ImageFile[] = [];
      for (const file of files) {
        if (images.length + newImages.length >= 4) break;
        try {
          const base64 = await fileToBase64(file);
          newImages.push({
            id: `img-${Date.now()}-${Math.random()}`,
            file: file,
            previewUrl: URL.createObjectURL(file),
            base64,
            mimeType: file.type
          });
        } catch (err) {
          console.error("Lỗi đọc file:", err);
        }
      }
      setImages(prev => [...prev, ...newImages].slice(0, 4));
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleAnalyze = async () => {
    const urls = urlInput.split(/[\n,]/).map(u => u.trim()).filter(u => u.length > 0);
    
    if (urls.length === 0 && !description && images.length === 0) {
      setError("Vui lòng nhập Link, Mô tả hoặc Upload ảnh sản phẩm.");
      return;
    }
    
    setError(null);
    setIsProcessing(true);
    
    const newResults: ProductIntakeResult[] = [];
    
    try {
      if (urls.length > 1) {
        setBatchStatus({ current: 0, total: urls.length });
        for (let i = 0; i < urls.length; i++) {
          setBatchStatus({ current: i + 1, total: urls.length });
          const data = await analyzeCampaignIntake(urls[i], description, images, apiSettings);
          newResults.push(data);
        }
      } else {
        const data = await analyzeCampaignIntake(urls[0] || "", description, images, apiSettings);
        newResults.push(data);
      }
      
      const updatedHistory = [...newResults, ...results].slice(0, 50); // Keep last 50
      updateState({ intakeHistory: updatedHistory });
      setActiveResultIndex(0);
      setBatchStatus(null);
      setUrlInput('');
      setDescription('');
      setImages([]);
    } catch (err: any) {
      setError(err.message || "Lỗi phân tích.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendToVideo = () => {
    if (result?.veo_payload) {
      updateState({ 
        view: 'VIDEO', 
        pendingVeoPayload: result.veo_payload 
      });
    }
  };

  const handleRenderBanner = async (banner: any, index: number) => {
    if (!result) return;
    setGeneratingBannerIndex(index);
    try {
      const img = await generateBannerImage(banner, result.product_metadata, images, apiSettings);
      if (img) {
         // We could save this to the result history but for now just show alert or preview
         alert("Đã tạo xong ảnh banner! Bạn có thể xem trong Library.");
      }
    } catch (err) {
      alert("Lỗi tạo ảnh banner.");
    } finally {
      setGeneratingBannerIndex(null);
    }
  };

  const handleCopyCommand = () => {
    if (result?.veo_payload) {
      navigator.clipboard.writeText(JSON.stringify(result.veo_payload));
      alert("Đã copy Veo Command!");
    }
  };

  const handleDownloadCommand = () => {
    if (result?.veo_payload) {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.veo_payload));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `veo_hook_${result.product_metadata?.title?.replace(/\s+/g, '_') || 'product'}.json`);
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f7f6f8] dark:bg-[#110b18] overflow-y-auto no-scrollbar relative animate-fadeIn">
      <Header title="Product Intake AI" backAction={onBack} />

      <div className="p-6 md:p-10 space-y-8 studio-container relative z-10 pb-20 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: INPUT */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] rounded-[32px] p-8 shadow-xl">
              <h3 className="text-xl font-black mb-6 uppercase tracking-wider text-gray-900 dark:text-white">Dữ liệu đầu vào</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Link Affiliate / Nguồn (Dán nhiều link, mỗi link 1 dòng)</label>
                  <textarea 
                    placeholder="https://shopee.vn/...&#10;https://tiktok.com/..." 
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    className="w-full h-24 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none transition-colors resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Mô tả thêm (Tùy chọn)</label>
                  <textarea 
                    placeholder="Dán mô tả sản phẩm vào đây nếu link bị chặn CORS..." 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full h-24 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Ảnh tham chiếu (Tối đa 4: Product, Outfit, Model, BG)</label>
                  <div className="flex flex-wrap gap-4">
                    {images.map(img => (
                      <div key={img.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 group">
                        <img src={img.previewUrl} className="w-full h-full object-cover" alt="ref" />
                        <button onClick={() => handleRemoveImage(img.id)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                    {images.length < 4 && (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/20 flex items-center justify-center cursor-pointer hover:border-primary hover:text-primary transition-colors text-gray-400"
                      >
                        <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                <button 
                  onClick={handleAnalyze} 
                  disabled={isProcessing}
                  className="w-full btn-primary py-4 text-sm mt-4 uppercase tracking-[2px]"
                >
                  {isProcessing ? (batchStatus ? `Đang xử lý (${batchStatus.current}/${batchStatus.total})...` : 'Đang phân tích...') : 'Phân tích & Lên Concept'}
                </button>
              </div>
            </div>

            {/* HISTORY LIST */}
            {results.length > 0 && (
              <div className="bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] rounded-[32px] p-8 shadow-xl">
                <h3 className="text-sm font-black mb-4 uppercase tracking-wider text-gray-500">Lịch sử Chiến dịch ({results.length})</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                  {results.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setActiveResultIndex(idx)}
                      className={`p-4 rounded-2xl cursor-pointer border transition-all ${activeResultIndex === idx ? 'bg-primary/10 border-primary' : 'bg-gray-50 dark:bg-white/[0.02] border-transparent hover:border-white/10'}`}
                    >
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.product_metadata?.title || 'Không tên'}</p>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">{item.product_metadata?.category} • {item.product_metadata?.price_segment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: OUTPUT */}
          <div className="space-y-6">
            {result ? (
              <div className="bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] rounded-[32px] p-8 shadow-xl space-y-8 animate-slideUp">
                
                {/* 1. PRODUCT METADATA */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-primary uppercase tracking-[2px]">1. Product Metadata</h3>
                    <div className="text-[10px] font-bold px-3 py-1 bg-green-500/10 text-green-500 rounded-full">
                      Confidence: {Math.round((result.product_metadata?.confidence || 0) * 100)}%
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">{result.product_metadata?.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{result.product_metadata?.category} • {result.product_metadata?.price_segment}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.product_metadata?.style_tags?.map((tag, i) => <span key={i} className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-white/5 rounded-md border border-gray-200 dark:border-white/10 uppercase">{tag}</span>)}
                      {result.product_metadata?.colors?.map((color, i) => <span key={i} className="text-[10px] px-2 py-1 bg-pink-500/10 text-pink-500 rounded-md uppercase">{color}</span>)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-200 dark:border-white/5">
                      <p><strong className="text-gray-900 dark:text-white">Audience:</strong> {result.product_metadata?.audience}</p>
                      <p className="mt-2"><strong className="text-gray-900 dark:text-white">Selling Points:</strong> {result.product_metadata?.selling_points?.join(' • ')}</p>
                    </div>
                  </div>
                </div>

                {/* 2. BANNERS */}
                <div>
                  <h3 className="text-sm font-black text-pink-500 uppercase tracking-[2px] mb-4">2. Banner Concepts</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {result.banners?.map((banner, i) => (
                      <div key={i} className="p-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-1 h-full ${banner.type === 'sale' ? 'bg-orange-500' : banner.type === 'editorial' ? 'bg-purple-500' : 'bg-pink-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">{banner.type}</span>
                        <p className="text-sm text-gray-900 dark:text-white font-medium mb-2">{banner.concept}</p>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-primary font-bold">CTA: {banner.cta}</p>
                          <button 
                            onClick={() => handleRenderBanner(banner, i)}
                            disabled={generatingBannerIndex !== null}
                            className="text-[10px] font-bold uppercase text-pink-500 hover:text-pink-600 transition-colors flex items-center gap-1"
                          >
                            {generatingBannerIndex === i ? 'Đang render...' : '🎨 Render Ảnh'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. VEO COMMAND */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-emerald-500 uppercase tracking-[2px]">3. Veo 3.1 Command (JSON)</h3>
                    <button 
                      onClick={handleSendToVideo}
                      className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">movie_filter</span>
                      🪄 Đưa vào xưởng quay
                    </button>
                  </div>
                  <div className="relative group">
                    <textarea 
                      readOnly
                      value={JSON.stringify(result.veo_payload)}
                      className="w-full h-24 bg-gray-900 text-emerald-400 font-mono text-[10px] p-4 rounded-2xl resize-none outline-none border border-gray-800 focus:border-emerald-500/50"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button onClick={handleCopyCommand} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-colors" title="Copy">
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                      <button onClick={handleDownloadCommand} className="w-8 h-8 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 flex items-center justify-center backdrop-blur-md transition-colors" title="Download">
                        <span className="material-symbols-outlined text-[16px]">download</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 italic">Copy chuỗi JSON này dán vào hệ thống render hoặc lưu file để chạy ffmpeg/cli.</p>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[32px] p-10 text-center opacity-50">
                <span className="material-symbols-outlined text-6xl text-gray-400 mb-4 animate-pulse">insights</span>
                <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Chưa có dữ liệu</p>
                <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">Nhập thông tin sản phẩm và nhấn phân tích để bắt đầu.</p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};
