
import React, { useState } from 'react';
import { SaveToLibraryModal } from '../modals/LibraryModals';
import { ImageFile, DetectedItem, GeneratedImage, AspectRatio, UserProfile } from '../types';
import { ApiSettings } from '../services/apiSettings';
import { fileToBase64, detectImageObjects, generateExtractedProduct } from '../services/geminiService';
import { isValidGeminiKey } from '../services/apiSettings';

export const ExtractGarmentView = ({ onViewImage, userProfile, apiSettings }: { onViewImage: (url: string) => void, userProfile: UserProfile | null, apiSettings: ApiSettings }) => {
  const [image, setImage] = useState<ImageFile | null>(null);
  const [productName, setProductName] = useState("");
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  const [quality, setQuality] = useState<'1K' | '2K' | '4K'>('2K');
  const [ratio, setRatio] = useState<AspectRatio>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  
  const [generateMasterImage, setGenerateMasterImage] = useState(true);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [imageToSave, setImageToSave] = useState<GeneratedImage | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        try {
            const base64 = await fileToBase64(file);
            const newImage = {
                id: Math.random().toString(),
                file,
                previewUrl: URL.createObjectURL(file),
                base64,
                mimeType: file.type
            };
            setImage(newImage);
            setResults([]);
            setDetectedItems([]);
            setSelectedItems([]);
            
            setIsAnalyzing(true);
            const items = await detectImageObjects(newImage, apiSettings.geminiKey);
            setDetectedItems(items);
            const firstGarment = items.find(i => i.type === 'GARMENT');
            if(firstGarment) setSelectedItems([firstGarment.id]);
            setIsAnalyzing(false);
        } catch (err) { 
            console.error(err); 
            setIsAnalyzing(false);
        }
    }
  };

  const toggleItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
        setSelectedItems(selectedItems.filter(i => i !== itemId));
    } else {
        if (selectedItems.length < 5) {
            setSelectedItems([...selectedItems, itemId]);
        } else {
            alert("Bạn chỉ có thể chọn tối đa 5 vật thể.");
        }
    }
  };

  const handleGenerate = async () => {
    if (!isValidGeminiKey(apiSettings.geminiKey)) {
      alert('Vui lòng nhập Gemini API Key trong mục Cài đặt trước khi sử dụng.');
      return;
    }
    if (!image || selectedItems.length === 0) return;
    setIsGenerating(true);
    
    const itemsToProcess = detectedItems.filter(item => selectedItems.includes(item.id));
    const placeholders = itemsToProcess.map((item, i) => ({ 
        id: `loading-${i}`, 
        url: '', 
        isLoading: true,
        label: item.name
    }));

    const fashionItems = itemsToProcess.filter(i => i.type !== 'BACKGROUND');
    if (generateMasterImage && fashionItems.length > 0) {
        placeholders.push({
            id: `loading-master`,
            url: '',
            isLoading: true,
            label: 'Bộ sưu tập (Flat Lay)'
        });
    }

    setResults(placeholders);

    try {
        const generated = await generateExtractedProduct(
            image, 
            itemsToProcess, 
            quality, 
            ratio,
            generateMasterImage,
            apiSettings.geminiKey,
            (newImg) => {
             setResults(prev => {
                const updated = [...prev];
                const idx = updated.findIndex(p => p.label === newImg.label && p.isLoading);
                if (idx !== -1) updated[idx] = newImg;
                else {
                     const loadingIdx = updated.findIndex(p => p.isLoading);
                     if(loadingIdx !== -1) updated[loadingIdx] = newImg;
                }
                return updated;
             });
        });
        setResults(generated);
    } catch (e: any) {
        alert("Lỗi: " + e.message);
        setResults([]);
    } finally {
        setIsGenerating(false);
    }
  };

  const openSaveModal = (img: GeneratedImage) => {
      if (!userProfile?.id) {
          alert("Vui lòng đăng nhập để lưu.");
          return;
      }
      setImageToSave(img);
      setSaveModalOpen(true);
  };

  return (
    <div className="flex h-full overflow-hidden bg-white dark:bg-background-dark text-left">
        {/* Left Sidebar - Config */}
        <div className="w-[380px] h-full bg-white dark:bg-surface-card border-r border-gray-100 dark:border-white/5 flex flex-col p-6 space-y-8 overflow-y-auto no-scrollbar">
            <div className="space-y-4">
                <div onClick={() => document.getElementById('extract-upload')?.click()} className="aspect-square rounded-[32px] border-2 border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group shadow-inner">
                    {image ? (
                        <>
                            <img src={image.previewUrl} className="w-full h-full object-cover" alt="Upload" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <span className="text-white font-black text-sm uppercase tracking-widest bg-black/20 px-4 py-2 rounded-full border border-white/20">Thay đổi ảnh</span>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-8 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                                <span className="material-symbols-outlined text-4xl">upload_file</span>
                            </div>
                            <div>
                                <p className="text-sm font-black dark:text-white text-gray-900">Tải ảnh gốc</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Hỗ trợ PNG, JPG, WEBP</p>
                            </div>
                        </div>
                    )}
                    <input id="extract-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
            </div>

            <div className="space-y-6">
                <div>
                     <p className="text-[11px] font-black text-gray-400 uppercase tracking-[2px] mb-4">Phát hiện vật thể</p>
                     {isAnalyzing ? (
                         <div className="flex flex-col items-center justify-center py-10 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                             <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Đang phân tích ảnh...</p>
                         </div>
                     ) : detectedItems.length > 0 ? (
                         <div className="flex flex-col gap-3">
                             {detectedItems.map(item => (
                                 <button 
                                    key={item.id} 
                                    onClick={() => toggleItem(item.id)} 
                                    className={`p-4 rounded-2xl text-left border-2 transition-all flex items-start gap-4 ${
                                        selectedItems.includes(item.id) 
                                        ? 'bg-primary/5 border-primary text-primary shadow-lg shadow-primary/5' 
                                        : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-500 hover:border-gray-300 dark:hover:border-white/20'
                                    }`}
                                 >
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedItems.includes(item.id) ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-white/10'}`}>
                                        <span className="material-symbols-outlined text-xl">
                                            {item.type === 'BACKGROUND' ? 'landscape' : item.type === 'MODEL' ? 'person' : 'checkroom'}
                                        </span>
                                     </div>
                                     <div className="flex-1 min-w-0 py-0.5">
                                         <p className="text-xs font-black truncate">{item.name}</p>
                                         <p className="text-[10px] font-medium opacity-60 truncate mt-0.5">{item.description}</p>
                                     </div>
                                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-2.5 transition-colors ${selectedItems.includes(item.id) ? 'border-primary bg-primary' : 'border-gray-200 dark:border-white/20'}`}>
                                         {selectedItems.includes(item.id) && <span className="material-symbols-outlined text-[12px] text-white font-bold">check</span>}
                                     </div>
                                 </button>
                             ))}
                             <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest mt-2">Chọn tối đa 5 mục</p>
                         </div>
                     ) : (
                         <div className="p-8 text-center bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                             <p className="text-xs text-gray-400 font-bold">Chưa có vật thể nào được phát hiện.</p>
                         </div>
                     )}
                </div>

                {detectedItems.length > 0 && (
                    <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-xl">auto_stories</span>
                            </div>
                            <div>
                                <p className="text-xs font-black dark:text-white text-gray-900">Tạo ảnh tổng hợp</p>
                                <p className="text-[10px] text-gray-500 font-bold">(Master Image)</p>
                            </div>
                        </div>
                        <div onClick={() => setGenerateMasterImage(!generateMasterImage)} className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${generateMasterImage ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-300 dark:bg-white/20'}`}>
                             <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${generateMasterImage ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-white/5">
                 <p className="text-[11px] font-black text-gray-400 uppercase tracking-[2px]">Cấu hình xuất file</p>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                         <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Chất lượng</label>
                         <select value={quality} onChange={(e: any) => setQuality(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 text-xs font-black dark:text-white outline-none border border-transparent focus:border-primary transition-all">
                             <option value="1K">1K (Basic)</option>
                             <option value="2K">2K (HD)</option>
                             <option value="4K">4K (Ultra)</option>
                         </select>
                     </div>
                     <div className="space-y-2">
                         <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Tỷ lệ</label>
                         <select value={ratio} onChange={(e: any) => setRatio(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 text-xs font-black dark:text-white outline-none border border-transparent focus:border-primary transition-all">
                             <option value="1:1">1:1 (Vuông)</option>
                             <option value="16:9">16:9 (Ngang)</option>
                             <option value="9:16">9:16 (Dọc)</option>
                         </select>
                     </div>
                 </div>
            </div>

            <button 
                disabled={!image || isGenerating || selectedItems.length === 0} 
                onClick={handleGenerate} 
                className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/40 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
            >
                {isGenerating ? (
                    <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                    <>
                        <span className="material-symbols-outlined text-2xl">auto_fix_high</span>
                        <span>Tách & Tạo ảnh ({selectedItems.length + (generateMasterImage ? 1 : 0)})</span>
                    </>
                )}
            </button>
        </div>

        {/* Right Main Content - Results */}
        <div className="flex-1 bg-gray-50 dark:bg-black/20 p-8 md:p-12 flex flex-col overflow-y-auto no-scrollbar">
            {results.length > 0 ? (
                <div className={`grid gap-8 ${results.length === 1 ? 'max-w-3xl mx-auto w-full h-full flex items-center justify-center' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 auto-rows-min'}`}>
                    {results.map((img, idx) => (
                        <div key={img.id || idx} className={`bg-white dark:bg-surface-card rounded-[40px] overflow-hidden shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 relative group flex flex-col hover:scale-[1.02] transition-transform duration-500 ${results.length === 1 ? 'w-full aspect-[3/4]' : ''}`}>
                            <div className="flex-1 relative bg-white dark:bg-white/2 flex items-center justify-center p-6 min-h-[300px]">
                                {img.isLoading ? (
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Đang tách {img.label}...</p>
                                    </div>
                                ) : (
                                    <img src={img.url} className="w-full h-full object-contain max-h-[70vh] drop-shadow-2xl" alt="Result" />
                                )}
                            </div>
                            {!img.isLoading && (
                                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                    <button onClick={() => openSaveModal(img)} className="w-12 h-12 rounded-full bg-white dark:bg-surface-card text-primary shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95">
                                        <span className="material-symbols-outlined">save</span>
                                    </button>
                                    <button onClick={() => onViewImage(img.url)} className="w-12 h-12 rounded-full bg-white dark:bg-surface-card text-gray-900 dark:text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"><span className="material-symbols-outlined">zoom_in</span></button>
                                    <a href={img.url} download={`extracted-${idx}.png`} className="w-12 h-12 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"><span className="material-symbols-outlined">download</span></a>
                                </div>
                            )}
                            <div className="p-5 bg-white dark:bg-surface-card border-t border-gray-50 dark:border-white/5 shrink-0">
                                <p className="text-xs font-black dark:text-white text-gray-900 text-center truncate uppercase tracking-widest">{img.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                    <div className="w-32 h-32 rounded-[40px] bg-white dark:bg-white/5 shadow-xl flex items-center justify-center mb-8 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                        <span className="material-symbols-outlined text-6xl text-primary/30">checkroom</span>
                    </div>
                    <h3 className="text-2xl font-black dark:text-white text-gray-900 mb-4 tracking-tight">Studio Tách Đồ Áo AI</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">Tải ảnh mẫu lên để AI tự động nhận diện và tách các sản phẩm thời trang. Hỗ trợ xuất file chất lượng cao 4K không nền.</p>
                </div>
            )}
        </div>
        <SaveToLibraryModal isOpen={saveModalOpen} onClose={() => setSaveModalOpen(false)} image={imageToSave} userId={userProfile?.id || ''} />
    </div>
  );
};
