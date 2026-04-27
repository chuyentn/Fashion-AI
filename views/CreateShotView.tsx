
import React, { useState, useRef } from 'react';
import { Header } from '../components/Common';
import { ResourcePickerModal } from '../modals/LibraryModals';
import { AppState, ImageFile, AdminResource, ModelTier, FaceHideType } from '../types';
import { ApiSettings, saveApiSettings } from '../services/apiSettings';
import { fileToBase64 } from '../services/geminiService';

export const CreateShotView = ({ onBack, state, updateState, onGenerate, onOpenAdmin, apiSettings, setApiSettings }: { onBack: () => void, state: AppState, updateState: (k: Partial<AppState>) => void, onGenerate: () => void, onOpenAdmin: () => void, apiSettings: ApiSettings, setApiSettings: (s: ApiSettings) => void }) => {
  const refInputRef = useRef<HTMLInputElement>(null);
  const prodInputRef = useRef<HTMLInputElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [pickerOpen, setPickerOpen] = useState<{ type: 'REFERENCE' | 'PRODUCT', isOpen: boolean }>({ type: 'REFERENCE', isOpen: false });
  
  const processFiles = async (fileList: File[], type: 'ref' | 'prod') => {
    const processed = await Promise.all(fileList.map(async (file) => {
       try {
        const base64 = await fileToBase64(file);
        return {
          id: Math.random().toString(36).substr(2, 9),
          file,
          previewUrl: URL.createObjectURL(file),
          base64,
          mimeType: file.type
        } as ImageFile;
      } catch (err) { return null; }
    }));
    const validFiles = processed.filter(Boolean) as ImageFile[];
    if (validFiles.length === 0) return;
    if (type === 'ref') updateState({ referenceImages: [...state.referenceImages, ...validFiles].slice(0, 5) });
    else updateState({ productImages: [...state.productImages, ...validFiles] });
  };

  const handleLibrarySelect = async (res: AdminResource) => {
    try {
        const response = await fetch(res.url);
        const blob = await response.blob();
        const base64Full = await fileToBase64(new File([blob], "res.png", { type: blob.type }));
        const newFile: ImageFile = {
            id: `lib-${res.id}`,
            file: null, 
            previewUrl: res.url,
            base64: base64Full,
            mimeType: blob.type
        };
        if (pickerOpen.type === 'REFERENCE') updateState({ referenceImages: [...state.referenceImages, newFile].slice(0, 5) });
        else updateState({ productImages: [...state.productImages, newFile] });
        setPickerOpen({ ...pickerOpen, isOpen: false });
    } catch (err) { alert("Lỗi tải ảnh."); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ref' | 'prod') => {
    if (e.target.files) processFiles(Array.from(e.target.files), type);
  };

  const isReady = state.referenceImages.length > 0 && state.productImages.length > 0;

  const updateSettingsLocal = (updates: Partial<ApiSettings>) => {
    const newSettings = { ...apiSettings, ...updates };
    setApiSettings(newSettings);
    saveApiSettings(newSettings);
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark text-left">
      <Header title="Thiết kế mới" backAction={onBack} />
      <div className="flex-1 overflow-y-auto px-4 pb-36 md:p-8 w-full max-w-4xl mx-auto space-y-10 mt-6 no-scrollbar">
        
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 dark:text-white font-black flex items-center gap-2">
               <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm">1</span>
               Ảnh mẫu tham khảo ({state.referenceImages.length}/5)
            </h3>
            <div className="flex gap-2">
                <button onClick={() => setPickerOpen({ type: 'REFERENCE', isOpen: true })} className="text-primary bg-primary/10 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">auto_stories</span> Mở Kho Ảnh Mẫu
                </button>
                <button onClick={() => refInputRef.current?.click()} className="text-primary text-sm font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-lg">add_circle</span> Tải lên
                </button>
            </div>
          </div>
          {state.referenceImages.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
               {state.referenceImages.map((img) => (
                <div key={img.id} className="relative aspect-[3/4] rounded-3xl overflow-hidden group bg-white dark:bg-surface-card border border-white/5 shadow-lg">
                   <img src={img.previewUrl} className="w-full h-full object-cover" alt="Ref" />
                   <button onClick={() => updateState({ referenceImages: state.referenceImages.filter(i => i.id !== img.id) })} className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                      <span className="material-symbols-outlined text-sm">close</span>
                   </button>
                </div>
               ))}
               {state.referenceImages.length < 5 && (
                 <div onClick={() => refInputRef.current?.click()} className="aspect-[3/4] rounded-3xl border-2 border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-gray-400">add</span>
                 </div>
               )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center aspect-[21/9] rounded-[40px] border-2 border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer relative" onClick={() => refInputRef.current?.click()}>
              <span className="material-symbols-outlined text-4xl text-primary mb-3">add_photo_alternate</span>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Tải lên ảnh mẫu từ Pinterest / Instagram</p>
              <div className="mt-4 flex gap-3">
                 <button onClick={(e) => { e.stopPropagation(); setPickerOpen({ type: 'REFERENCE', isOpen: true }); }} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2"><span className="material-symbols-outlined text-sm">collections</span> Chọn từ Kho tài nguyên</button>
              </div>
            </div>
          )}
          <input type="file" ref={refInputRef} onChange={(e) => handleFileChange(e, 'ref')} className="hidden" accept="image/*" multiple />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-gray-900 dark:text-white font-black flex items-center gap-2">
               <span className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm">2</span>
               Sản phẩm của bạn ({state.productImages.length})
             </h3>
             <div className="flex gap-2">
                 <button onClick={() => setPickerOpen({ type: 'PRODUCT', isOpen: true })} className="text-pink-500 bg-pink-500/10 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">inventory_2</span> Kho Sản Phẩm
                 </button>
                 <button onClick={() => prodInputRef.current?.click()} className="text-primary text-sm font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-lg">add_circle</span> Tải lên
                 </button>
             </div>
          </div>
          {state.productImages.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {state.productImages.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-3xl overflow-hidden group bg-white dark:bg-surface-card border border-white/5 shadow-lg">
                   <img src={img.previewUrl} className="w-full h-full object-cover" alt="Prod" />
                   <button onClick={() => updateState({ productImages: state.productImages.filter(i => i.id !== img.id) })} className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                      <span className="material-symbols-outlined text-sm">close</span>
                   </button>
                </div>
              ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center aspect-[21/9] rounded-[40px] border-2 border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer" onClick={() => prodInputRef.current?.click()}>
                <span className="material-symbols-outlined text-4xl text-primary mb-3">checkroom</span>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Thêm ảnh sản phẩm</p>
                <div className="mt-4 flex gap-3">
                   <button onClick={(e) => { e.stopPropagation(); setPickerOpen({ type: 'PRODUCT', isOpen: true }); }} className="px-4 py-2 bg-pink-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-pink-500/20 flex items-center gap-2"><span className="material-symbols-outlined text-sm">inventory_2</span> Chọn từ Kho Sản phẩm</button>
                </div>
             </div>
          )}
          <input type="file" ref={prodInputRef} onChange={(e) => handleFileChange(e, 'prod')} className="hidden" accept="image/*" multiple />
        </section>

        <div onClick={() => setShowSettings(true)} className="flex items-center justify-between p-6 rounded-3xl bg-white dark:bg-surface-card border border-gray-200 dark:border-white/5 cursor-pointer hover:shadow-xl transition-all shadow-sm">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
               <span className="material-symbols-outlined">tune</span>
             </div>
             <div className="text-left">
               <p className="text-gray-900 dark:text-white text-sm font-bold">Cài đặt nâng cao</p>
               <p className="text-xs text-gray-500">{state.modelTier} • {state.resolution} • {state.outputCount} ảnh/sp</p>
             </div>
           </div>
           <span className="material-symbols-outlined text-gray-400">chevron_right</span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-background-dark/95 backdrop-blur-xl border-t border-gray-200 dark:border-white/5 z-30 md:static md:max-w-4xl md:mx-auto md:bg-transparent md:border-none">
        <button disabled={!isReady} onClick={onGenerate} className={`w-full h-16 rounded-[24px] flex items-center justify-center gap-3 font-black text-lg transition-all shadow-2xl ${isReady ? 'bg-primary text-white hover:bg-primary-hover shadow-primary/40' : 'bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed'}`}>
          <span className="material-symbols-outlined text-2xl">auto_awesome</span>
          {isReady ? `Tạo ${state.outputCount * state.productImages.length} thiết kế` : 'Vui lòng chọn đủ ảnh'}
        </button>
      </div>

      <ResourcePickerModal type={pickerOpen.type} isOpen={pickerOpen.isOpen} onClose={() => setPickerOpen({ ...pickerOpen, isOpen: false })} onSelect={handleLibrarySelect} userProfile={state.userProfile} onOpenAdmin={onOpenAdmin} />

      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-surface-card rounded-t-[40px] sm:rounded-[40px] p-6 sm:p-8 max-h-[85vh] overflow-y-auto animate-[slideUp_0.3s_ease-out] shadow-2xl no-scrollbar text-left">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Cài đặt nâng cao</h3>
                <button onClick={() => setShowSettings(false)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center dark:text-white text-gray-900"><span className="material-symbols-outlined">close</span></button>
             </div>
             <div className="space-y-6">
                 <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-3xl border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Dịch vụ xử lý (Generator)</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => updateSettingsLocal({ lastUsedService: 'gemini' })} className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${apiSettings.lastUsedService === 'gemini' ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-white/5 border-transparent text-gray-500'}`}>
                           <span className="text-xs font-black">Google Gemini</span>
                           <span className="text-[9px] opacity-70">Nano Banana 2 / Pro</span>
                        </button>
                        <button onClick={() => updateSettingsLocal({ lastUsedService: 'openai' })} className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${apiSettings.lastUsedService === 'openai' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' : 'bg-white dark:bg-white/5 border-transparent text-gray-500'}`}>
                           <span className="text-xs font-black">OpenAI GPT</span>
                           <span className="text-[9px] opacity-70">GPT Image 2</span>
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-3xl border border-gray-100 dark:border-white/5">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Chất lượng AI (Model Tier)</p>
                   <div className="grid grid-cols-2 gap-2">
                       {(['BASIC', 'PRO'] as ModelTier[]).map((tier) => (
                          <button key={tier} onClick={() => updateState({ modelTier: tier })} className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${state.modelTier === tier ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-white/5 border-transparent text-gray-500'}`}>
                             <span className="text-xs font-black">{tier}</span>
                             <span className="text-[9px] opacity-70">{tier === 'BASIC' ? 'Nhanh & Miễn phí' : 'Chất lượng cao (Cần Key)'}</span>
                          </button>
                       ))}
                   </div>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-3xl border border-gray-100 dark:border-white/5">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center"><span className="material-symbols-outlined">face_retouching_off</span></div>
                         <div><p className="font-bold text-gray-900 dark:text-white text-sm">Che mặt người mẫu</p><p className="text-[10px] text-gray-500">Tự động ẩn khuôn mặt</p></div>
                      </div>
                      <div onClick={() => updateState({ faceHideEnabled: !state.faceHideEnabled })} className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${state.faceHideEnabled ? 'bg-pink-500' : 'bg-gray-300 dark:bg-white/20'}`}>
                         <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${state.faceHideEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </div>
                   </div>
                   {state.faceHideEnabled && (
                      <div className="space-y-2 animate-[fadeIn_0.2s]">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chọn kiểu che mặt</p>
                         <div className="grid grid-cols-2 gap-2">
                             {([
                                { id: 'PHONE_SELFIE', icon: 'smartphone', label: 'Selfie ĐT' },
                                { id: 'BACK_TURNED', icon: 'person', label: 'Quay lưng' },
                                { id: 'PROP_OBSCURED', icon: 'back_hand', label: 'Đồ vật/Tay' },
                                { id: 'CROP_FACE', icon: 'crop', label: 'Cắt mặt' }
                             ] as { id: FaceHideType, icon: string, label: string }[]).map((opt) => (
                                <button key={opt.id} onClick={() => updateState({ faceHideType: opt.id })} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${state.faceHideType === opt.id ? 'bg-pink-500/10 border-pink-500 text-pink-500' : 'bg-white dark:bg-white/5 border-transparent text-gray-500'}`}>
                                   <span className="material-symbols-outlined text-lg">{opt.icon}</span><span className="text-xs font-bold">{opt.label}</span>
                                </button>
                             ))}
                         </div>
                      </div>
                   )}
                </div>
                <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2 block">Chèn chữ (Text Overlay)</label>
                   <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl space-y-3">
                      <input type="text" value={state.overlayText} onChange={e => updateState({ overlayText: e.target.value })} placeholder="Nhập chữ..." className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none dark:text-white" maxLength={50} />
                   </div>
                </div>
                <button onClick={() => setShowSettings(false)} className="w-full h-14 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">Áp dụng</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
