
import React, { useState, useEffect } from 'react';
import { AdminResource } from '../types';
import { fetchAdminResources, uploadImageToSupabase, saveAdminResource, deleteAdminResource } from '../services/supabase';
import { useTranslation } from 'react-i18next';

export const AdminPanelView = ({ onBack, userId, onViewImage }: { onBack: () => void, userId: string, onViewImage: (url: string) => void }) => {
    const { t } = useTranslation();
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
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 text-left bg-[#f7f6f8] dark:bg-[#110b18] animate-fadeIn relative">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 blur-[100px] pointer-events-none -translate-y-1/2" />

            <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#110b18]/80 backdrop-blur-3xl border-b border-gray-200 dark:border-white/[0.06] p-5 md:px-10 md:py-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-11 h-11 rounded-[20px] bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.08] flex items-center justify-center text-gray-900 dark:text-white transition-all shadow-sm dark:shadow-xl">
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider">{t('admin.title')}</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[2px] mt-0.5">Admin Control Panel</p>
                    </div>
                </div>
                <button onClick={() => setShowAddForm(true)} className="btn-primary px-6 py-3 text-[11px] flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">add_circle</span> {t('admin.add')}
                </button>
            </header>

            <div className="p-6 md:p-10 max-w-[1600px] mx-auto studio-container">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {resources.map(res => (
                        <div key={res.id} className="group card-premium rounded-[32px] overflow-hidden">
                            <div className="aspect-[3/4] relative cursor-pointer" onClick={() => onViewImage(res.url)}>
                                <img src={res.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={res.name} />
                                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }} className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><span className="material-symbols-outlined text-lg">delete</span></button>
                                </div>
                                <div className="absolute top-3 left-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md border border-white/20 ${res.type === 'REFERENCE' ? 'bg-indigo-500/50' : 'bg-pink-500/50'}`}>
                                        {res.type === 'REFERENCE' ? 'Model' : 'Product'}
                                    </span>
                                </div>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <span className="material-symbols-outlined text-white text-3xl">zoom_in</span>
                                </div>
                            </div>
                            <div className="p-4 text-left border-t border-gray-100 dark:border-white/[0.04] bg-white dark:bg-[#1a1025]">
                                <p className="font-bold text-gray-900 dark:text-white truncate text-sm tracking-tight">{res.name}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 truncate">{res.description || "No description"}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showAddForm && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/90 backdrop-blur-md animate-fadeIn" onClick={() => setShowAddForm(false)} />
                    <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] rounded-[48px] p-8 md:p-10 shadow-2xl animate-scaleIn">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('admin.add')}</h3>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[2px] mt-1">Upload new studio asset</p>
                            </div>
                            <button onClick={() => setShowAddForm(false)} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.04] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="aspect-video rounded-[32px] border-2 border-dashed border-gray-200 dark:border-white/[0.1] bg-gray-50 dark:bg-white/[0.02] overflow-hidden flex flex-col items-center justify-center gap-3 relative cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.04] hover:border-primary/40 transition-all group" onClick={() => document.getElementById('admin-upload')?.click()}>
                                {newRes.previewUrl ? (
                                    <img src={newRes.previewUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-[20px] bg-gray-100 dark:bg-white/[0.04] text-gray-500 flex items-center justify-center group-hover:scale-110 group-hover:text-primary transition-all">
                                            <span className="material-symbols-outlined text-3xl">upload</span>
                                        </div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('video.upload')}</p>
                                    </>
                                )}
                                <input id="admin-upload" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </div>

                            <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/[0.06]">
                                <button onClick={() => setNewRes({...newRes, type: 'REFERENCE'})} className={`py-3 rounded-[14px] text-[10px] font-black uppercase tracking-[2px] transition-all ${newRes.type === 'REFERENCE' ? 'bg-primary text-white shadow-xl' : 'text-gray-500'}`}>{t('library.models')}</button>
                                <button onClick={() => setNewRes({...newRes, type: 'PRODUCT'})} className={`py-3 rounded-[14px] text-[10px] font-black uppercase tracking-[2px] transition-all ${newRes.type === 'PRODUCT' ? 'bg-pink-500 text-white shadow-xl' : 'text-gray-500'}`}>{t('library.products')}</button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('admin.name')}</label>
                                    <input type="text" placeholder="Nhập tên..." value={newRes.name} onChange={e => setNewRes({...newRes, name: e.target.value})} className="input-studio w-full" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('admin.description') || 'Mô tả'}</label>
                                    <textarea placeholder="Nhập mô tả..." value={newRes.description} onChange={e => setNewRes({...newRes, description: e.target.value})} className="input-studio w-full resize-none" rows={2} />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={handlePaste} className="btn-secondary flex-1 h-14 text-[10px] bg-gray-50 dark:bg-white/[0.04]">Dán ảnh</button>
                                <button disabled={!newRes.previewUrl || !newRes.name || saving} onClick={handleSave} className="btn-primary flex-[2] h-14 text-[10px] disabled:opacity-50">
                                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div> : t('save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
