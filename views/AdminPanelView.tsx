
import React, { useState, useEffect } from 'react';
import { AdminResource } from '../types';
import { fetchAdminResources, uploadImageToSupabase, saveAdminResource, deleteAdminResource } from '../services/supabase';

export const AdminPanelView = ({ onBack, userId, onViewImage }: { onBack: () => void, userId: string, onViewImage: (url: string) => void }) => {
    const [resources, setResources] = useState<AdminResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    
    const [newRes, setNewRes] = useState({ 
        name: '', 
        description: '', 
        type: 'REFERENCE' as 'REFERENCE' | 'PRODUCT', 
        file: null as File | null, 
        previewUrl: '' 
    });
    
    const [saving, setSaving] = useState(false);

    const refresh = () => {
        setLoading(true);
        fetchAdminResources().then(data => {
            setResources(data);
            setLoading(false);
        });
    };

    useEffect(() => { refresh(); }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setNewRes({ ...newRes, file: file, previewUrl: URL.createObjectURL(file) });
    };

    const handlePaste = async () => {
        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                if (item.types.some(t => t.startsWith('image/'))) {
                    const blob = await item.getType(item.types.find(t => t.startsWith('image/'))!);
                    const file = new File([blob], "admin_res.png", { type: blob.type });
                    setNewRes({ ...newRes, file: file, previewUrl: URL.createObjectURL(file) });
                }
            }
        } catch (err) { alert("Dán ảnh thất bại hoặc trình duyệt không hỗ trợ."); }
    };

    const handleSave = async () => {
        if (!newRes.file || !newRes.name) return;
        setSaving(true);
        try {
            const publicUrl = await uploadImageToSupabase(newRes.file, userId, 'admin');
            if (publicUrl) {
                await saveAdminResource({
                    name: newRes.name,
                    description: newRes.description,
                    type: newRes.type,
                    url: publicUrl
                });
                setShowAddForm(false);
                setNewRes({ name: '', description: '', type: 'REFERENCE', file: null, previewUrl: '' });
                refresh();
            } else {
                alert("Upload ảnh thất bại!");
            }
        } catch(err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Xóa tài nguyên này?")) {
            await deleteAdminResource(id);
            refresh();
        }
    };

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 text-left">
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-white/5 p-4 md:p-8 flex items-center justify-between">
                <div className="flex items-center gap-4 text-left">
                    <button onClick={onBack} className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center dark:text-white text-gray-900">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h2 className="text-2xl font-black dark:text-white text-gray-900">Quản trị Tài nguyên</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Admin Control Panel</p>
                    </div>
                </div>
                <button onClick={() => setShowAddForm(true)} className="px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30 flex items-center gap-2 hover:scale-105 transition-all">
                    <span className="material-symbols-outlined">add_circle</span> Thêm mới
                </button>
            </header>

            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {resources.map(res => (
                        <div key={res.id} className="group bg-white dark:bg-surface-card rounded-[32px] overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all">
                            <div className="aspect-[3/4] relative cursor-pointer" onClick={() => onViewImage(res.url)}>
                                <img src={res.url} className="w-full h-full object-cover" alt={res.name} />
                                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg"><span className="material-symbols-outlined text-sm">delete</span></button>
                                </div>
                                <div className="absolute top-2 left-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white ${res.type === 'REFERENCE' ? 'bg-indigo-500' : 'bg-pink-500'}`}>
                                        {res.type === 'REFERENCE' ? 'Model' : 'Product'}
                                    </span>
                                </div>
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-3xl">zoom_in</span>
                                </div>
                            </div>
                            <div className="p-4 text-left">
                                <p className="font-bold dark:text-white text-gray-900 truncate text-sm">{res.name}</p>
                                <p className="text-[10px] text-gray-500 truncate">{res.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showAddForm && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-surface-card rounded-[40px] p-8 shadow-2xl animate-[slideDown_0.3s]">
                        <h3 className="text-xl font-black mb-6 dark:text-white text-gray-900">Thêm tài nguyên mới</h3>
                        <div className="space-y-4">
                            <div className="aspect-[4/3] rounded-3xl border-2 border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 overflow-hidden flex flex-col items-center justify-center gap-3 relative cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors" onClick={() => document.getElementById('admin-upload')?.click()}>
                                {newRes.previewUrl ? (
                                    <img src={newRes.previewUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-4xl text-gray-300">upload</span>
                                        <p className="text-xs font-bold text-gray-500">Dán hoặc Click để tải ảnh</p>
                                    </>
                                )}
                                <input id="admin-upload" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handlePaste} className="flex-1 py-2.5 bg-gray-100 dark:bg-white/5 rounded-xl text-xs font-bold dark:text-white text-gray-900 border border-gray-200 dark:border-white/5">Dán từ Clipboard</button>
                            </div>
                            <input type="text" placeholder="Tên tài nguyên" value={newRes.name} onChange={e => setNewRes({...newRes, name: e.target.value})} className="w-full bg-gray-100 dark:bg-white/5 rounded-2xl px-5 py-3.5 outline-none focus:border-primary border border-transparent dark:text-white" />
                            <textarea placeholder="Mô tả..." value={newRes.description} onChange={e => setNewRes({...newRes, description: e.target.value})} className="w-full bg-gray-100 dark:bg-white/5 rounded-2xl px-5 py-3.5 outline-none focus:border-primary border border-transparent dark:text-white resize-none" rows={2} />
                            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl">
                                <button onClick={() => setNewRes({...newRes, type: 'REFERENCE'})} className={`py-2.5 rounded-xl text-xs font-bold transition-all ${newRes.type === 'REFERENCE' ? 'bg-primary text-white shadow-lg' : 'text-gray-500'}`}>Ảnh mẫu</button>
                                <button onClick={() => setNewRes({...newRes, type: 'PRODUCT'})} className={`py-2.5 rounded-xl text-xs font-bold transition-all ${newRes.type === 'PRODUCT' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-500'}`}>Sản phẩm</button>
                            </div>
                            <button disabled={!newRes.previewUrl || !newRes.name || saving} onClick={handleSave} className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30 active:scale-95 disabled:opacity-50 mt-4 transition-all">
                                {saving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Lưu tài nguyên'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
