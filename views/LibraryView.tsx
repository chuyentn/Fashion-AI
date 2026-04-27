
import React, { useState, useEffect } from 'react';
import { Header } from '../components/Common';
import { AdminResource, HistoryItem, UserProfile } from '../types';
import { fetchAdminResources } from '../services/supabase';

export const LibraryView = ({ userProfile, history, onOpenHistory, onViewImage, onOpenAdmin }: { userProfile: UserProfile | null, history: HistoryItem[], onOpenHistory: (item: HistoryItem) => void, onViewImage: (url: string) => void, onOpenAdmin: () => void }) => {
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

  const ResourceGrid = ({ items, title, emptyMsg, icon }: any) => (
    <section className="space-y-8">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <h3 className="text-2xl font-black dark:text-white text-gray-900 tracking-tight">
                {title} ({items.length})
            </h3>
        </div>
        {items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                {items.map((res: any) => (
                    <div key={res.id} className="group cursor-pointer space-y-3" onClick={() => onViewImage(res.url)}>
                        <div className="aspect-[3/4] rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 relative bg-gray-50 dark:bg-white/2 shadow-sm group-hover:shadow-2xl transition-all duration-500">
                            <img src={res.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={res.name} />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <span className="material-symbols-outlined text-white text-3xl">zoom_in</span>
                            </div>
                        </div>
                        <p className="text-[11px] font-black dark:text-white text-gray-900 truncate px-2 uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">{res.name}</p>
                    </div>
                ))}
            </div>
        ) : (
            <div className="bg-gray-50 dark:bg-white/5 rounded-[40px] p-16 text-center border-2 border-dashed border-gray-200 dark:border-white/10">
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{emptyMsg}</p>
            </div>
        )}
    </section>
  );

  return (
    <div className="flex-1 h-full overflow-y-auto no-scrollbar bg-white dark:bg-background-dark text-left">
      <Header title="Thư viện tài nguyên" />
      <div className="p-8 md:p-12 space-y-20 max-w-[1600px] mx-auto">
        {userProfile?.isAdmin && (
            <div className="bg-gradient-to-r from-primary/10 to-pink-500/10 p-10 rounded-[48px] border border-primary/10 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/30">
                        <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
                    </div>
                    <div>
                        <h4 className="text-xl font-black dark:text-white text-gray-900">Quản trị Kho tài nguyên</h4>
                        <p className="text-sm text-gray-500 mt-1 font-medium">Hệ thống quản lý mẫu ảnh và sản phẩm dùng chung cho toàn bộ Studio.</p>
                    </div>
                </div>
                <button onClick={onOpenAdmin} className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest">Mở bảng điều khiển</button>
            </div>
        )}

        <ResourceGrid items={models} title="Kho Ảnh Mẫu (Models)" emptyMsg="Chưa có ảnh mẫu." icon="face" />
        <ResourceGrid items={products} title="Kho Sản Phẩm (Products)" emptyMsg="Chưa có sản phẩm." icon="inventory_2" />

        <section className="space-y-10 pt-16 border-t border-gray-100 dark:border-white/5">
           <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">history</span>
                    </div>
                    <h3 className="text-2xl font-black dark:text-white text-gray-900 tracking-tight">Lịch sử thiết kế</h3>
                </div>
           </div>
           
           {history.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {history.map(item => (
                   <div key={item.id} onClick={() => onOpenHistory(item)} className="group bg-white dark:bg-surface-card rounded-[48px] p-5 border border-gray-100 dark:border-white/5 cursor-pointer hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none transition-all duration-500">
                    <div className="aspect-video rounded-[36px] overflow-hidden mb-6 relative bg-gray-50 dark:bg-white/2 shadow-inner">
                      <img src={item.images[0]?.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Preview" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-[10px] font-black uppercase tracking-[2px] bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">{item.images.length} ảnh đã tạo</span>
                      </div>
                    </div>
                    <div className="px-2 space-y-1">
                        <h4 className="font-black truncate dark:text-white text-gray-900 text-lg">{item.prompt || "Fashion Set"}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-xs">calendar_today</span>
                            {new Date(item.timestamp).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="bg-gray-50 dark:bg-white/5 rounded-[48px] p-24 text-center border-2 border-dashed border-gray-200 dark:border-white/10">
                <p className="text-gray-400 font-black uppercase tracking-widest">Chưa có lịch sử thiết kế.</p>
             </div>
           )}
        </section>
      </div>
    </div>
  );
};
