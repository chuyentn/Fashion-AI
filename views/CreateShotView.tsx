import React, { useState, useRef } from 'react';
import { Header } from '../components/Common';
import { ResourcePickerModal } from '../modals/LibraryModals';
import { AppState, ImageFile, AdminResource, ModelTier, FaceHideType } from '../types';
import { ApiSettings, saveApiSettings } from '../services/apiSettings';
import { fileToBase64 } from '../services/geminiService';
import { useTranslation } from 'react-i18next';

export const CreateShotView = ({ onBack, state, updateState, onGenerate, onOpenAdmin, apiSettings, setApiSettings }: { onBack: () => void, state: AppState, updateState: (k: Partial<AppState>) => void, onGenerate: () => void, onOpenAdmin: () => void, apiSettings: ApiSettings, setApiSettings: (s: ApiSettings) => void }) => {
  const refInputRef = useRef<HTMLInputElement>(null);
  const prodInputRef = useRef<HTMLInputElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [pickerOpen, setPickerOpen] = useState<{ type: 'REFERENCE' | 'PRODUCT', isOpen: boolean }>({ type: 'REFERENCE', isOpen: false });
  const { t } = useTranslation();
  
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
    } catch (err) { alert(t('error')); }
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

  const SectionHeader = ({ step, title, count, maxCount, icon, colorClass, buttons }: { step: number, title: string, count: number, maxCount?: number, icon: string, colorClass: string, buttons: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-2xl ${colorClass} flex items-center justify-center shadow-lg dark:shadow-black/20 animate-scaleIn`}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <div>
          <h3 className="text-gray-900 dark:text-white font-black text-lg tracking-tight flex items-center gap-2">
            {title}
            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-white/5 px-2.5 py-0.5 rounded-lg border border-gray-200 dark:border-white/5">
              {maxCount ? `${count}/${maxCount}` : `(${count})`}
            </span>
          </h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-600 font-bold uppercase tracking-widest mt-0.5">Bước {step} • Yêu cầu tối thiểu 1 ảnh</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">{buttons}</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#f7f6f8] dark:bg-[#110b18] text-left relative animate-fadeIn">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] pointer-events-none" />

      <Header title={t('create.title')} backAction={onBack} />
      
      <div className="flex-1 overflow-y-auto px-6 pb-40 md:px-10 w-full max-w-6xl mx-auto space-y-12 mt-6 no-scrollbar">
        
        {/* Section 1: Reference Images */}
        <section className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <SectionHeader step={1} title="Ảnh mẫu tham khảo" count={state.referenceImages.length} maxCount={5} icon="auto_stories" colorClass="bg-primary/10 dark:bg-primary/20 text-primary"
            buttons={<>
              <button onClick={() => setPickerOpen({ type: 'REFERENCE', isOpen: true })} className="btn-secondary px-4 py-2.5 text-[10px]">
                <span className="material-symbols-outlined text-sm mr-2">collections</span>Kho thư viện
              </button>
              <button onClick={() => refInputRef.current?.click()} className="btn-primary px-4 py-2.5 text-[10px] bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 border border-primary/20 shadow-none text-primary">
                <span className="material-symbols-outlined text-sm mr-2">add_circle</span>Tải lên
              </button>
            </>}
          />
          {state.referenceImages.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1">
              {state.referenceImages.map((img, i) => (
                <div key={img.id} className="relative w-40 md:w-48 shrink-0 aspect-[3/4] rounded-[32px] overflow-hidden group bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] shadow-md dark:shadow-2xl hover:shadow-primary/30 hover:border-primary/50 hover:-translate-y-2 transition-all duration-700" style={{ animationDelay: `${i * 60}ms` }}>
                   <img src={img.previewUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Ref" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                   <button onClick={() => updateState({ referenceImages: state.referenceImages.filter(i => i.id !== img.id) })} className="absolute top-4 right-4 w-8 h-8 bg-white/80 dark:bg-black/60 backdrop-blur-md text-gray-900 dark:text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white hover:scale-110 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                      <span className="material-symbols-outlined text-sm">close</span>
                   </button>
                </div>
              ))}
              {state.referenceImages.length < 5 && (
                <div onClick={() => refInputRef.current?.click()} className="w-40 md:w-48 shrink-0 aspect-[3/4] rounded-[32px] border-2 border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:border-primary/40 transition-all duration-500 group shadow-inner">
                   <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all text-gray-500 shadow-sm dark:shadow-none">
                      <span className="material-symbols-outlined text-2xl">add</span>
                   </div>
                   <p className="text-[10px] font-black text-gray-500 dark:text-gray-600 uppercase tracking-widest group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Thêm ảnh mẫu</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.015] hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:border-primary/20 transition-all duration-700 cursor-pointer group shadow-sm dark:shadow-none" onClick={() => refInputRef.current?.click()}>
              <div className="w-16 h-16 rounded-[24px] bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all text-primary">
                <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
              </div>
              <p className="text-base font-black text-gray-900 dark:text-white mb-2 tracking-tight">Kéo thả hoặc click để upload ảnh mẫu</p>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-[2px] mb-6">Hỗ trợ JPG, PNG, WEBP (Lên tới 5MB)</p>
              <button onClick={(e) => { e.stopPropagation(); setPickerOpen({ type: 'REFERENCE', isOpen: true }); }} className="btn-secondary px-6 py-3.5 bg-gray-50 dark:bg-white/[0.04]">
                <span className="material-symbols-outlined text-xl mr-2">collections</span>Chọn từ Thư viện Studio
              </button>
            </div>
          )}
          <input type="file" ref={refInputRef} onChange={(e) => handleFileChange(e, 'ref')} className="hidden" accept="image/*" multiple />
        </section>

        {/* Section 2: Product Images */}
        <section className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <SectionHeader step={2} title="Sản phẩm của bạn" count={state.productImages.length} icon="checkroom" colorClass="bg-pink-500/10 dark:bg-pink-500/20 text-pink-500 dark:text-pink-400"
            buttons={<>
              <button onClick={() => setPickerOpen({ type: 'PRODUCT', isOpen: true })} className="btn-secondary px-4 py-2.5 text-[10px]">
                <span className="material-symbols-outlined text-sm mr-2">inventory_2</span>Kho sản phẩm
              </button>
              <button onClick={() => prodInputRef.current?.click()} className="btn-primary px-4 py-2.5 text-[10px] bg-pink-500/10 dark:bg-pink-500/20 hover:bg-pink-500/20 dark:hover:bg-pink-500/30 border border-pink-500/20 shadow-none text-pink-500 dark:text-pink-400">
                <span className="material-symbols-outlined text-sm mr-2">add_circle</span>Tải lên
              </button>
            </>}
          />
          {state.productImages.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1">
              {state.productImages.map((img, i) => (
                <div key={img.id} className="relative w-40 md:w-48 shrink-0 aspect-square rounded-[32px] overflow-hidden group bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] shadow-md dark:shadow-2xl hover:shadow-pink-500/30 hover:border-pink-500/50 hover:-translate-y-2 transition-all duration-700">
                   <img src={img.previewUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Prod" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                   <button onClick={() => updateState({ productImages: state.productImages.filter(i => i.id !== img.id) })} className="absolute top-4 right-4 w-8 h-8 bg-white/80 dark:bg-black/60 backdrop-blur-md text-gray-900 dark:text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white hover:scale-110 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                      <span className="material-symbols-outlined text-sm">close</span>
                   </button>
                </div>
              ))}
              <div onClick={() => prodInputRef.current?.click()} className="w-40 md:w-48 shrink-0 aspect-square rounded-[32px] border-2 border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:border-pink-500/40 transition-all duration-500 group shadow-inner">
                   <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-pink-500 group-hover:text-white transition-all text-gray-500 shadow-sm dark:shadow-none">
                      <span className="material-symbols-outlined text-2xl">add</span>
                   </div>
                   <p className="text-[10px] font-black text-gray-500 dark:text-gray-600 uppercase tracking-widest group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Thêm sản phẩm</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.015] hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:border-pink-500/20 transition-all duration-700 cursor-pointer group shadow-sm dark:shadow-none" onClick={() => prodInputRef.current?.click()}>
              <div className="w-16 h-16 rounded-[24px] bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-pink-500 group-hover:text-white transition-all text-pink-500 dark:text-pink-400">
                <span className="material-symbols-outlined text-4xl">checkroom</span>
              </div>
              <p className="text-base font-black text-gray-900 dark:text-white mb-2 tracking-tight">Kéo thả hoặc click để upload sản phẩm</p>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-[2px] mb-6">Hỗ trợ ảnh mẫu / Flat-lay / Ma-nơ-canh</p>
              <button onClick={(e) => { e.stopPropagation(); setPickerOpen({ type: 'PRODUCT', isOpen: true }); }} className="btn-secondary px-6 py-3.5 bg-gray-50 dark:bg-white/[0.04]">
                <span className="material-symbols-outlined text-xl mr-2">inventory_2</span>Chọn từ Sản phẩm Studio
              </button>
            </div>
          )}
          <input type="file" ref={prodInputRef} onChange={(e) => handleFileChange(e, 'prod')} className="hidden" accept="image/*" multiple />
        </section>

        {/* Section 3: Creative Prompt */}
        <section className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <SectionHeader step={3} title="Sáng tạo không giới hạn" count={state.prompt ? 1 : 0} maxCount={1} icon="draw" colorClass="bg-purple-500/10 dark:bg-purple-500/20 text-purple-500 dark:text-purple-400"
            buttons={<></>}
          />
          <div className="bg-white dark:bg-[#1a1025] p-6 rounded-[32px] border border-gray-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl">
             <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Creative Prompt (Tùy chọn)</label>
             <textarea 
                value={state.prompt}
                onChange={e => updateState({ prompt: e.target.value })}
                className="input-studio w-full resize-none min-h-[100px]"
                placeholder="VD: Chuyển bối cảnh sang đường phố Tokyo mùa thu, giữ nguyên tư thế người mẫu..."
             />
             <p className="text-[10px] text-gray-500 font-bold mt-3 px-1">* Bỏ trống để AI sao chép chính xác 100% bối cảnh từ ảnh mẫu.</p>
          </div>
        </section>

        {/* Advanced Settings Card */}
        <div onClick={() => setShowSettings(true)} className="flex items-center justify-between p-6 rounded-[32px] bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:border-primary/30 transition-all duration-500 group animate-slideUp shadow-sm dark:shadow-none" style={{ animationDelay: '0.4s' }}>
           <div className="flex items-center gap-5">
             <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm dark:shadow-lg">
               <span className="material-symbols-outlined text-2xl">tune</span>
             </div>
             <div className="text-left">
               <p className="text-gray-900 dark:text-white text-base font-black tracking-tight">{t('create.advanced') || 'Cấu hình Studio Engine'}</p>
               <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-1">Tier: {state.modelTier} • {state.resolution} • Output: {state.outputCount} ảnh/sp</p>
             </div>
           </div>
           <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-lg group-hover:translate-x-0.5 transition-transform">chevron_right</span>
           </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 lg:left-[280px] right-0 p-6 bg-white/90 dark:bg-[#110b18]/90 backdrop-blur-3xl border-t border-gray-200 dark:border-white/[0.06] z-30">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="hidden md:block">
            <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[2.5px]">Sẵn sàng tạo mẫu thiết kế</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-600 font-bold uppercase mt-1 tracking-widest">Tự động tối ưu hóa bởi Fashion AI Studio</p>
          </div>
          <button 
            disabled={!isReady} 
            onClick={onGenerate} 
            className={`w-full sm:w-auto min-w-[320px] h-16 rounded-[24px] flex items-center justify-center gap-3 font-black text-base uppercase tracking-[2px] transition-all duration-500 ${isReady ? 'bg-gradient-to-r from-[#a413ec] via-[#b830f0] to-[#ec4899] text-white shadow-xl dark:shadow-2xl shadow-primary/30 dark:shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98]' : 'bg-gray-100 dark:bg-white/[0.04] text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-white/[0.06]'}`}
          >
            <span className="material-symbols-outlined text-2xl animate-pulse">{isReady ? 'auto_awesome' : 'hourglass_empty'}</span>
            {isReady ? `Tạo ${state.outputCount * state.productImages.length} thiết kế 4K` : 'Vui lòng chọn đủ ảnh'}
          </button>
        </div>
      </div>

      <ResourcePickerModal type={pickerOpen.type} isOpen={pickerOpen.isOpen} onClose={() => setPickerOpen({ ...pickerOpen, isOpen: false })} onSelect={handleLibrarySelect} userProfile={state.userProfile} onOpenAdmin={onOpenAdmin} />

      {/* Advanced Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-fadeIn" onClick={() => setShowSettings(false)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] rounded-t-[40px] sm:rounded-[48px] p-8 sm:p-10 max-h-[90vh] overflow-y-auto animate-scaleIn shadow-2xl dark:shadow-[0_0_100px_rgba(164,19,236,0.15)] no-scrollbar text-left">
             <div className="flex justify-between items-start mb-10">
                <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Studio Engine Config</h3>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[2px] mt-1.5">Tối ưu hóa hiệu suất và chất lượng AI</p>
                </div>
                <button onClick={() => setShowSettings(false)} className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-all">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
             </div>
             
             <div className="space-y-8">
                 <div className="bg-gray-50 dark:bg-white/[0.02] p-6 rounded-[32px] border border-gray-200 dark:border-white/[0.04]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><span className="material-symbols-outlined text-lg">rocket_launch</span></div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Dịch vụ xử lý (Generator)</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => updateSettingsLocal({ lastUsedService: 'gemini' })} className={`flex flex-col items-start gap-2 p-5 rounded-[24px] border-2 transition-all duration-300 ${apiSettings.lastUsedService === 'gemini' ? 'bg-primary/5 dark:bg-primary/10 border-primary/40 text-primary' : 'bg-white dark:bg-white/[0.01] border-gray-200 dark:border-white/[0.04] text-gray-600 hover:border-gray-300 dark:hover:border-white/10 shadow-sm dark:shadow-none'}`}>
                           <span className="text-sm font-black uppercase">Google Gemini</span>
                           <span className="text-[10px] font-bold opacity-70">Nano Banana 2 / Pro</span>
                        </button>
                        <button onClick={() => updateSettingsLocal({ lastUsedService: 'openai' })} className={`flex flex-col items-start gap-2 p-5 rounded-[24px] border-2 transition-all duration-300 ${apiSettings.lastUsedService === 'openai' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-white/[0.01] border-gray-200 dark:border-white/[0.04] text-gray-600 hover:border-gray-300 dark:hover:border-white/10 shadow-sm dark:shadow-none'}`}>
                           <span className="text-sm font-black uppercase">OpenAI GPT</span>
                           <span className="text-[10px] font-bold opacity-70">GPT Image 2 (Beta)</span>
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-white/[0.02] p-6 rounded-[32px] border border-gray-200 dark:border-white/[0.04]">
                   <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center"><span className="material-symbols-outlined text-lg">workspace_premium</span></div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Chất lượng AI (Model Tier)</p>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                       {(['BASIC', 'PRO'] as ModelTier[]).map((tier) => (
                          <button key={tier} onClick={() => updateState({ modelTier: tier })} className={`flex flex-col items-start gap-2 p-5 rounded-[24px] border-2 transition-all duration-300 ${state.modelTier === tier ? 'bg-primary/5 dark:bg-primary/10 border-primary/40 text-primary' : 'bg-white dark:bg-white/[0.01] border-gray-200 dark:border-white/[0.04] text-gray-600 hover:border-gray-300 dark:hover:border-white/10 shadow-sm dark:shadow-none'}`}>
                             <span className="text-sm font-black uppercase">{tier} ENGINE</span>
                             <span className="text-[10px] font-bold opacity-70">{tier === 'BASIC' ? 'Nhanh & Tối ưu' : 'Chất lượng cao (Premium)'}</span>
                          </button>
                       ))}
                   </div>
                </div>

                <div className="bg-gray-50 dark:bg-white/[0.02] p-6 rounded-[32px] border border-gray-200 dark:border-white/[0.04]">
                   <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                         <div className="w-11 h-11 rounded-2xl bg-pink-100 dark:bg-pink-500/15 text-pink-600 dark:text-pink-400 flex items-center justify-center shadow-sm dark:shadow-lg"><span className="material-symbols-outlined text-xl">face_retouching_off</span></div>
                         <div>
                            <p className="font-black text-gray-900 dark:text-white text-base tracking-tight">Che mặt người mẫu</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Privacy & Anonymization</p>
                         </div>
                      </div>
                      <div onClick={() => updateState({ faceHideEnabled: !state.faceHideEnabled })} className={`w-12 h-7 rounded-full relative cursor-pointer transition-all duration-500 ${state.faceHideEnabled ? 'bg-pink-500 shadow-md dark:shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'bg-gray-300 dark:bg-white/10'}`}>
                         <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-500 ${state.faceHideEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </div>
                   </div>
                   {state.faceHideEnabled && (
                      <div className="space-y-4 animate-slideUp">
                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Phong cách ẩn mặt</p>
                         <div className="grid grid-cols-2 gap-3">
                             {([
                                 { id: 'PHONE_SELFIE', icon: 'smartphone', label: 'Selfie Điện thoại' },
                                 { id: 'BACK_TURNED', icon: 'person_outline', label: 'Quay lưng' },
                                 { id: 'PROP_OBSCURED', icon: 'back_hand', label: 'Dùng vật phẩm' },
                                 { id: 'CROP_FACE', icon: 'crop_square', label: 'Cắt bỏ mặt' }
                             ] as { id: FaceHideType, icon: string, label: string }[]).map((opt) => (
                                <button key={opt.id} onClick={() => updateState({ faceHideType: opt.id })} className={`flex items-center gap-3 p-4 rounded-[20px] border-2 transition-all duration-300 ${state.faceHideType === opt.id ? 'bg-pink-50 dark:bg-pink-500/10 border-pink-500/40 text-pink-600 dark:text-pink-400' : 'bg-white dark:bg-white/[0.01] border-gray-200 dark:border-white/[0.04] text-gray-600 hover:border-gray-300 dark:hover:border-white/10 shadow-sm dark:shadow-none'}`}>
                                   <span className="material-symbols-outlined text-lg">{opt.icon}</span><span className="text-[11px] font-black uppercase tracking-wider">{opt.label}</span>
                                </button>
                             ))}
                         </div>
                      </div>
                   )}
                </div>

                <div className="bg-gray-50 dark:bg-white/[0.02] p-6 rounded-[32px] border border-gray-200 dark:border-white/[0.04]">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] mb-4 block px-1">Chèn chữ nghệ thuật (Overlay)</label>
                   <input 
                      type="text" 
                      value={state.overlayText} 
                      onChange={e => updateState({ overlayText: e.target.value })} 
                      placeholder="VD: New Collection 2026..." 
                      className="input-studio w-full" 
                      maxLength={50} 
                   />
                </div>

                <button onClick={() => setShowSettings(false)} className="btn-primary w-full h-14 text-sm mt-4">
                    Lưu cấu hình Studio
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
