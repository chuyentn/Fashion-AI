
import React, { useState, useEffect } from 'react';
import { uploadImageToSupabase, saveAdminResource, fetchAdminResources } from '../services/supabase';
import { GeneratedImage, AdminResource, UserProfile } from '../types';

export const SaveToLibraryModal = ({ isOpen, onClose, image, userId }: { isOpen: boolean, onClose: () => void, image: GeneratedImage | null, userId: string }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<'PRODUCT' | 'REFERENCE'>('PRODUCT');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (image) setName(image.label || 'New Item');
    }, [image]);

    const handleSave = async () => {
        if (!image || !name || !userId) return;
        setLoading(true);
        try {
            const publicUrl = await uploadImageToSupabase(image.url, userId, 'admin');
            if (publicUrl) {
                await saveAdminResource({
                    name: name,
                    description: `Extracted from AI: ${image.label}`,
                    type: type,
                    url: publicUrl
                });
                alert("Đã lưu vào kho tài nguyên!");
                onClose();
            } else {
                alert("Lỗi upload ảnh.");
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi khi lưu.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !image) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-surface-card rounded-[32px] p-6 shadow-2xl animate-[slideUp_0.3s]">
                <h3 className="text-xl font-black mb-4 dark:text-white text-gray-900">Lưu vào Kho Tài Nguyên</h3>
                <div className="flex gap-4 mb-4">
                    <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200 dark:border-white/10">
                        <img src={image.url} className="w-full h-full object-contain" alt="Preview" />
                    </div>
                    <div className="flex-1 space-y-3">
                        <div className="space-y-1">
                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tên sản phẩm/mẫu</label>
                             <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-100 dark:bg-white/5 rounded-xl px-3 py-2 text-sm outline-none border border-transparent focus:border-primary dark:text-white" />
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => setType('PRODUCT')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'PRODUCT' ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}>Sản phẩm</button>
                             <button onClick={() => setType('REFERENCE')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'REFERENCE' ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}>Người mẫu</button>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Hủy</button>
                    <button disabled={loading || !name} onClick={handleSave} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Lưu ngay'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ResourcePickerModal = ({ type, isOpen, onClose, onSelect, userProfile, onOpenAdmin }: { type: 'REFERENCE' | 'PRODUCT', isOpen: boolean, onClose: () => void, onSelect: (res: AdminResource) => void, userProfile: UserProfile | null, onOpenAdmin: () => void }) => {
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchAdminResources(type).then(data => {
        setResources(data);
        setLoading(false);
      });
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white dark:bg-surface-card rounded-[32px] overflow-hidden flex flex-col h-[80vh] animate-[fadeIn_0.3s]">
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
           <div className="text-left">
              <h3 className="text-xl font-black dark:text-white text-gray-900">Chọn {type === 'REFERENCE' ? 'Ảnh mẫu' : 'Sản phẩm'}</h3>
              <p className="text-xs text-gray-500">Kho tài nguyên chuyên nghiệp có sẵn</p>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center dark:text-white text-gray-900 hover:bg-primary hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
           </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
           {loading ? (
             <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-sm text-gray-400">Đang tải tài nguyên...</p>
             </div>
           ) : resources.length > 0 ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {resources.map(res => (
                  <div key={res.id} onClick={() => onSelect(res)} className="group cursor-pointer space-y-2">
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 relative">
                       <img src={res.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={res.name} />
                       <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white text-primary px-3 py-1.5 rounded-full text-xs font-bold shadow-xl">Sử dụng</span>
                       </div>
                    </div>
                    <div className="text-left px-1">
                       <p className="text-sm font-bold dark:text-white text-gray-900 truncate">{res.name}</p>
                       <p className="text-[10px] text-gray-500 truncate">{res.description}</p>
                    </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                <span className="material-symbols-outlined text-6xl text-gray-200 dark:text-white/10">image_search</span>
                <p className="text-gray-500 text-sm">Kho tài nguyên trống.</p>
                {userProfile?.isAdmin && (
                    <button onClick={onOpenAdmin} className="px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-2 mx-auto">
                        <span className="material-symbols-outlined">add_circle</span> Xây dựng kho ngay
                    </button>
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
