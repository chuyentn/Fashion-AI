
import React, { useState, useEffect } from 'react';
import { Header } from '../components/Common';
import { AdminResource, HistoryItem, UserProfile } from '../types';
import { fetchAdminResources } from '../services/supabase';
import { useTranslation } from 'react-i18next';

export const LibraryView = ({ userProfile, history, onOpenHistory, onViewImage, onOpenAdmin }: { userProfile: UserProfile | null, history: HistoryItem[], onOpenHistory: (item: HistoryItem) => void, onViewImage: (url: string) => void, onOpenAdmin: () => void }) => {
  const { t } = useTranslation();
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAdminResources(undefined, userProfile?.id).then(data => {
      setResources(data);
      setLoading(false);
    });
  }, [userProfile?.id]);

  const models = resources.filter(r => r.type === 'REFERENCE');
  const products = resources.filter(r => r.type === 'PRODUCT');

  const ResourceGrid = ({ items, title, emptyMsg, icon, colorClass, animationDelay }: any) => (
    <section className="space-y-6 animate-slideUp" style={{ animationDelay }}>
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${colorClass} flex items-center justify-center shadow-lg`}>
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                {title} <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-3 py-1 rounded-xl border border-gray-200 dark:border-white/10">{items.length}</span>
            </h3>
        </div>
        {items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                {items.map((res: any) => (
                    <div key={res.id} className="group cursor-pointer space-y-3" onClick={() => onViewImage(res.url)}>
                        <div className="aspect-[3/4] rounded-[24px] overflow-hidden border border-gray-200 dark:border-white/[0.06] relative bg-white dark:bg-[#1a1025] shadow-sm dark:shadow-xl group-hover:shadow-[0_0_30px_rgba(164,19,236,0.15)] dark:group-hover:shadow-[0_0_30px_rgba(164,19,236,0.3)] group-hover:border-primary/40 group-hover:-translate-y-2 transition-all duration-500">
                            <img src={res.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={res.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl dark:shadow-2xl text-white">
                                    <span className="material-symbols-outlined text-2xl">zoom_in</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-2">
                            <p className="text-[11px] font-black text-gray-700 dark:text-gray-300 truncate uppercase tracking-widest group-hover:text-primary transition-colors">{res.name}</p>
                            <p className="text-[9px] text-gray-500 dark:text-gray-600 font-bold uppercase mt-1 tracking-[2px]">{res.type === 'REFERENCE' ? 'Reference Model' : 'E-commerce Product'}</p>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="card-premium rounded-[40px] p-16 text-center border border-dashed border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1025]">
                <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-white/10">
                    <span className="material-symbols-outlined text-gray-500 text-3xl">folder_off</span>
                </div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[4px]">{emptyMsg}</p>
            </div>
        )}
    </section>
  );

  return (
    <div className="flex-1 h-full overflow-y-auto no-scrollbar bg-[#f7f6f8] dark:bg-[#110b18] text-left animate-fadeIn relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[150px] pointer-events-none -translate-y-1/2"></div>
      
      <Header title={t('library.title')} />
      
      <div className="p-6 md:p-10 space-y-16 max-w-[1700px] mx-auto relative z-10 pb-32">
        {userProfile?.isAdmin && (
            <div className="card-premium rounded-[40px] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 animate-slideUp overflow-hidden bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08]">
                <div className="absolute top-[-50%] right-[-10%] w-80 h-80 bg-primary/5 dark:bg-primary/10 blur-[100px] pointer-events-none group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-colors duration-1000" />
                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 text-center md:text-left w-full">
                    <div className="w-16 h-16 rounded-3xl bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 text-primary flex items-center justify-center shadow-sm dark:shadow-lg group-hover:scale-110 transition-transform duration-500">
                        <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('library.admin')}</h4>
                        <p className="text-[11px] text-gray-500 mt-2 font-bold uppercase tracking-[2px] leading-relaxed">{t('library.adminDesc')}</p>
                    </div>
                </div>
                <button onClick={onOpenAdmin} className="btn-primary w-full md:w-auto px-10 py-5 text-[11px] relative z-10 whitespace-nowrap">{t('library.adminBtn')}</button>
            </div>
        )}

        <ResourceGrid items={models} title={t('library.models')} emptyMsg={t('library.modelsEmpty')} icon="face" colorClass="bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 dark:border-primary/30" animationDelay="0.1s" />
        <ResourceGrid items={products} title={t('library.products')} emptyMsg={t('library.productsEmpty')} icon="inventory_2" colorClass="bg-pink-500/10 dark:bg-pink-500/20 text-pink-500 dark:text-pink-400 border border-pink-500/20 dark:border-pink-500/30" animationDelay="0.2s" />

        <section className="space-y-10 pt-16 border-t border-gray-200 dark:border-white/[0.06] animate-slideUp" style={{ animationDelay: '0.3s' }}>
           <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 dark:text-orange-400 flex items-center justify-center shadow-sm dark:shadow-lg">
                        <span className="material-symbols-outlined text-2xl">history</span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-wider">{t('library.history')}</h3>
                </div>
           </div>
           
           {history.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {history.map((item, idx) => (
                   <div key={item.id} onClick={() => onOpenHistory(item)} className="group card-premium rounded-[40px] p-5 cursor-pointer hover:border-primary/40 dark:hover:border-primary/40 transition-all duration-500 animate-slideUp bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl" style={{ animationDelay: `${0.3 + (idx * 0.05)}s` }}>
                    <div className="aspect-[16/10] rounded-[32px] overflow-hidden mb-6 relative bg-gray-100 dark:bg-black/40 shadow-inner">
                      <img src={item.images[0]?.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Preview" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-xl border border-white/30">
                            <span className="material-symbols-outlined text-sm text-white">photo_library</span>
                            <span className="text-white text-[10px] font-black uppercase tracking-[2px]">{item.images.length} {t('library.versions')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-3 space-y-3 pb-2">
                        <h4 className="font-black truncate text-gray-900 dark:text-white text-lg tracking-tight group-hover:text-primary transition-colors">{item.prompt || "Fashion Concept"}</h4>
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[2px] flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                {new Date(item.timestamp).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}
                            </p>
                            <span className="w-10 h-10 rounded-[14px] bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm dark:shadow-md">
                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                            </span>
                        </div>
                    </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="card-premium rounded-[48px] p-24 text-center border border-dashed border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1025]">
                <p className="text-[11px] text-gray-500 font-black uppercase tracking-[4px]">{t('library.historyEmpty')}</p>
             </div>
           )}
        </section>
      </div>
    </div>
  );
};
