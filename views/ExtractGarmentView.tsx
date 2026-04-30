import { UserProfile, ImageFile, GeneratedImage } from '../types';
import { useTranslation } from 'react-i18next';
import { fileToBase64, detectClothingItems, extractClothingItem } from '../services/geminiService';
import { loadApiSettings } from '../services/apiSettings';

export const ExtractGarmentView = ({ onBack, userProfile }: { onBack: () => void, userProfile: UserProfile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [productName, setProductName] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedItems, setDetectedItems] = useState<{ label: string, description: string, status: 'idle' | 'loading' | 'done' }[]>([]);
  const [extractedImages, setExtractedImages] = useState<GeneratedImage[]>([]);
  const apiSettings = loadApiSettings();
  const { t } = useTranslation();

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
      setSelectedImage(img);
      setDetectedItems([]);
      setExtractedImages([]);
      
      // Auto detect
      setIsDetecting(true);
      try {
        const items = await detectClothingItems(img, apiSettings);
        setDetectedItems(items.map(it => ({ ...it, status: 'idle' })));
      } catch (err) {
        alert("Lỗi nhận diện vật thể.");
      } finally {
        setIsDetecting(false);
      }
    }
  };

  const handleExtractItem = async (index: number) => {
    if (!selectedImage) return;
    const item = detectedItems[index];
    
    // Update status
    const newItems = [...detectedItems];
    newItems[index].status = 'loading';
    setDetectedItems(newItems);

    try {
      const result = await extractClothingItem(selectedImage, item.label, item.description, apiSettings);
      if (result) {
        setExtractedImages(prev => [...prev, result]);
        const updatedItems = [...newItems];
        updatedItems[index].status = 'done';
        setDetectedItems(updatedItems);
      }
    } catch (err) {
      alert(`Lỗi tách ${item.label}`);
      const updatedItems = [...newItems];
      updatedItems[index].status = 'idle';
      setDetectedItems(updatedItems);
    }
  };

  const handleAutoExtractAll = async () => {
    for (let i = 0; i < detectedItems.length; i++) {
        if (detectedItems[i].status === 'idle') {
            await handleExtractItem(i);
        }
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f7f6f8] dark:bg-[#110b18] text-left relative overflow-hidden animate-fadeIn">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      
      <Header title="Tách Đồ Áo" backAction={onBack} />
      
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-10 relative z-10 pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT COLUMN (4/12) */}
          <div className="lg:col-span-4 space-y-8 animate-slideUp">
             <div className="bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] rounded-[32px] p-6 shadow-xl">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Ảnh gốc</p>
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
                      <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">add_photo_alternate</span>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tải lên ảnh mẫu</p>
                    </div>
                  )}
                  {selectedImage && (
                    <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/80 dark:bg-black/60 backdrop-blur-md flex items-center justify-center text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

                <div className="mt-8 space-y-6">
                   <div>
                     <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Tên sản phẩm (Tùy chọn)</label>
                     <input 
                       type="text" 
                       placeholder="VD: Áo sơ mi lụa..." 
                       value={productName}
                       onChange={e => setProductName(e.target.value)}
                       className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-emerald-500 outline-none transition-colors"
                     />
                   </div>

                   {selectedImage && (
                     <div className="animate-slideUp">
                        <div className="flex justify-between items-center mb-4">
                           <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Phát hiện vật thể</label>
                           {detectedItems.length > 0 && (
                             <button onClick={handleAutoExtractAll} className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline">Tách tất cả</button>
                           )}
                        </div>
                        <div className="space-y-2">
                           {isDetecting ? (
                             <div className="py-4 text-center animate-pulse">
                                <p className="text-[10px] font-bold text-gray-500 uppercase">Đang nhận diện...</p>
                             </div>
                           ) : detectedItems.map((item, i) => (
                             <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04] rounded-xl group hover:border-emerald-500/30 transition-all">
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
                                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                    item.status === 'done' ? 'bg-emerald-500 text-white' : 
                                    item.status === 'loading' ? 'bg-gray-200 dark:bg-white/10 text-emerald-500 animate-spin' :
                                    'bg-gray-200 dark:bg-white/10 text-gray-400 group-hover:bg-emerald-500 group-hover:text-white'
                                  }`}
                                >
                                   <span className="material-symbols-outlined text-xs">
                                      {item.status === 'done' ? 'check' : item.status === 'loading' ? 'progress_activity' : 'arrow_forward'}
                                   </span>
                                </button>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* RIGHT COLUMN (8/12) - RESULTS GRID */}
          <div className="lg:col-span-8 animate-slideUp" style={{ animationDelay: '0.1s' }}>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {extractedImages.map((img, i) => (
                  <div key={img.id} className="bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] rounded-[32px] overflow-hidden shadow-xl animate-scaleIn group" style={{ animationDelay: `${i * 100}ms` }}>
                     <div className="aspect-[3/4] relative bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-repeat">
                        <img src={img.url} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-700" alt={img.label} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                           <button className="w-10 h-10 rounded-xl bg-white text-gray-900 flex items-center justify-center hover:scale-110 transition-transform">
                              <span className="material-symbols-outlined text-xl">download</span>
                           </button>
                        </div>
                     </div>
                     <div className="p-4 text-center border-t border-gray-200 dark:border-white/[0.04]">
                        <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">{img.label}</p>
                     </div>
                  </div>
                ))}
                
                {/* Empty placeholders */}
                {detectedItems.filter(it => it.status !== 'done').map((item, i) => (
                  <div key={`p-${i}`} className="aspect-[3/4] rounded-[32px] border-2 border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.01] flex flex-col items-center justify-center text-center p-6">
                     {item.status === 'loading' ? (
                        <div className="animate-spin text-emerald-500 mb-4"><span className="material-symbols-outlined text-4xl">progress_activity</span></div>
                     ) : (
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-4">hourglass_empty</span>
                     )}
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đang chờ: {item.label}</p>
                  </div>
                ))}

                {detectedItems.length === 0 && !isDetecting && (
                  <div className="col-span-full py-40 text-center opacity-30">
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
