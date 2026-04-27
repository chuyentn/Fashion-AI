
import React from 'react';
import { Header } from '../components/Common';
import { HistoryItem, UserProfile } from '../types';

export const DashboardView = ({ onStart, history, onOpenHistory, userProfile, onNavigate }: { onStart: () => void, history: HistoryItem[], onOpenHistory: (item: HistoryItem) => void, userProfile: UserProfile, onNavigate: (v: any) => void }) => {
  return (
    <div className="flex-1 h-full overflow-y-auto no-scrollbar bg-white dark:bg-background-dark text-left">
      <Header title={`Xin chào, ${userProfile.name?.split(' ')[0] || 'Designer'}!`} />
      <div className="p-8 md:p-12 space-y-12 max-w-[1600px] mx-auto">
        
        {/* Hero Section - Full Width Banner */}
        <section className="relative overflow-hidden rounded-[56px] bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#ec4899] p-12 md:p-20 text-white shadow-2xl shadow-primary/30 min-h-[500px] flex items-center">
           <div className="relative z-10 max-w-2xl space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-[2px]">AI Fashion Studio v2.8 PRO</span>
              </div>
              <h2 className="text-6xl md:text-7xl font-black leading-[1.1] tracking-tighter">
                Sáng tạo thời trang <br/> không giới hạn.
              </h2>
              <p className="text-xl text-white/90 max-w-lg font-medium leading-relaxed">
                Nền tảng AI chuyên nghiệp giúp biến sản phẩm đơn lẻ thành những bộ ảnh lookbook đẳng cấp thế giới.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                  <button onClick={onStart} className="px-10 py-5 bg-white text-[#a855f7] font-black rounded-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 text-lg uppercase tracking-widest">
                     <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                     Bắt đầu ngay
                  </button>
                  <button onClick={() => onNavigate('EXTRACT')} className="px-8 py-5 bg-black/10 backdrop-blur-md text-white font-black rounded-3xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-3 text-lg uppercase tracking-widest">
                     <span className="material-symbols-outlined text-2xl">content_cut</span>
                     Tách đồ áo
                  </button>
              </div>
           </div>
           
           {/* Abstract Shapes */}
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
           <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
           
           {/* Decoration */}
           <div className="absolute right-20 top-1/2 -translate-y-1/2 hidden xl:block">
              <div className="relative w-80 h-96 rounded-[60px] border-2 border-white/20 rotate-12 overflow-hidden backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-400 rounded-full blur-3xl opacity-50"></div>
           </div>
        </section>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
                { id: 'CREATE', title: 'Thiết kế mới', desc: 'Tạo ảnh mẫu AI 4K', icon: 'add_circle', color: 'bg-primary' },
                { id: 'EXTRACT', title: 'Tách đồ áo', desc: 'Bóc tách sản phẩm từ ảnh', icon: 'checkroom', color: 'bg-emerald-500' },
                { id: 'VIDEO', title: 'Video Studio', desc: 'Tạo Clip 8s từ ảnh mẫu', icon: 'movie', color: 'bg-pink-500' }
            ].map(card => (
                <div key={card.id} onClick={() => onNavigate(card.id)} className="group bg-white dark:bg-surface-card p-10 rounded-[48px] border border-gray-100 dark:border-white/5 cursor-pointer hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none transition-all duration-500 flex items-center gap-8 shadow-sm">
                    <div className={`w-20 h-20 rounded-[32px] ${card.color} text-white flex items-center justify-center shadow-2xl shadow-current/20 group-hover:scale-110 transition-transform duration-500`}>
                        <span className="material-symbols-outlined text-4xl">{card.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider">{card.title}</h3>
                        <p className="text-sm text-gray-500 font-bold mt-1 opacity-70">{card.desc}</p>
                    </div>
                    <span className="material-symbols-outlined text-gray-300 group-hover:text-primary group-hover:translate-x-2 transition-all">chevron_right</span>
                </div>
            ))}
        </div>

        {/* Recent Section */}
        <section className="space-y-10 pt-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">history</span>
                    </div>
                    <h3 className="text-3xl font-black dark:text-white text-gray-900 tracking-tight">Thiết kế gần đây</h3>
                </div>
                <button onClick={() => onNavigate('LIBRARY')} className="px-6 py-3 bg-gray-100 dark:bg-white/5 rounded-2xl text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm">Xem tất cả</button>
            </div>
            
            {history.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 {history.slice(0, 4).map(item => (
                    <div key={item.id} onClick={() => onOpenHistory(item)} className="group cursor-pointer space-y-4">
                       <div className="aspect-[4/3] rounded-[48px] overflow-hidden relative bg-gray-50 dark:bg-white/2 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                          <img src={item.images[0]?.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Recent" />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                       </div>
                       <div className="px-2">
                           <p className="text-lg font-black dark:text-white text-gray-900 truncate uppercase tracking-widest">{item.prompt}</p>
                           <p className="text-xs text-gray-400 font-bold mt-1">{new Date(item.timestamp).toLocaleDateString('vi-VN')}</p>
                       </div>
                    </div>
                 ))}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-white/5 rounded-[56px] p-24 text-center border-2 border-dashed border-gray-200 dark:border-white/10">
                 <div className="w-24 h-24 rounded-[32px] bg-white dark:bg-white/5 shadow-xl flex items-center justify-center mb-6 mx-auto opacity-50">
                    <span className="material-symbols-outlined text-5xl text-gray-300">folder_open</span>
                 </div>
                 <p className="text-lg text-gray-400 font-black uppercase tracking-[4px]">Chưa có lịch sử</p>
              </div>
            )}
        </section>
      </div>
    </div>
  );
};
