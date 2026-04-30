import React from 'react';
import { Header } from '../components/Common';
import { HistoryItem, UserProfile } from '../types';
import { useTranslation } from 'react-i18next';

export const DashboardView = ({ onStart, history, onOpenHistory, userProfile, onNavigate }: { onStart: () => void, history: HistoryItem[], onOpenHistory: (item: HistoryItem) => void, userProfile: UserProfile, onNavigate: (v: any) => void }) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 h-full overflow-y-auto no-scrollbar bg-[#f7f6f8] dark:bg-[#110b18] text-left relative animate-fadeIn">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-full lg:w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full lg:w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <Header title={`${t('dashboard.greeting')}, ${userProfile.name?.split(' ')[0] || 'Designer'}!`} />
      
      <div className="p-6 md:p-10 space-y-12 studio-container relative z-10 pb-20">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-[48px] bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] p-8 md:p-16 text-gray-900 dark:text-white shadow-xl dark:shadow-2xl dark:shadow-black/50 group animate-scaleIn">
           <div className="relative z-10 max-w-2xl space-y-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-[3px] text-primary-light">Studio Engine v3.1</span>
              </div>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tighter text-gray-900 dark:text-white">
                Sáng tạo thời trang <br/> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a413ec] via-[#c040ff] to-[#ec4899] animate-gradient">không giới hạn.</span>
              </h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-lg font-medium leading-relaxed">
                Nền tảng AI chuyên nghiệp giúp biến sản phẩm đơn lẻ thành những bộ ảnh lookbook đẳng cấp thế giới chỉ trong vài giây.
              </p>
              <div className="flex flex-wrap gap-5 pt-4">
                  <button onClick={onStart} className="btn-primary px-10 py-5 text-sm">
                     <span className="material-symbols-outlined text-2xl mr-2">auto_awesome</span>
                     {t('dashboard.quickAction.create')}
                  </button>
                  <button onClick={() => onNavigate('EXTRACT')} className="btn-secondary px-8 py-5 text-sm">
                     <span className="material-symbols-outlined text-2xl mr-2">content_cut</span>
                     {t('dashboard.quickAction.extract')}
                  </button>
              </div>
           </div>
           
           {/* Decorative elements - Only on desktop */}
           <div className="absolute top-1/2 right-[-10%] -translate-y-1/2 w-[500px] aspect-square rounded-full bg-primary/10 dark:bg-primary/20 blur-[120px] pointer-events-none group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors duration-1000" />
           <div className="absolute top-12 right-12 hidden xl:block opacity-40 group-hover:opacity-70 transition-all duration-1000 rotate-3 group-hover:rotate-0">
              <div className="w-72 h-96 rounded-[48px] border-2 border-gray-200 dark:border-white/20 backdrop-blur-xl overflow-hidden relative shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100/50 dark:from-white/10 via-transparent to-gray-300/50 dark:to-black/40" />
                <div className="absolute bottom-8 left-8 right-8 h-1 bg-gray-200 dark:bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-primary animate-pulse" />
                </div>
              </div>
              <div className="absolute -bottom-8 -left-8 w-48 h-64 rounded-[40px] border border-gray-200 dark:border-white/10 -rotate-12 backdrop-blur-md overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-100/50 dark:from-white/5 to-transparent" />
              </div>
           </div>
        </section>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
                { id: 'CREATE', title: t('dashboard.quickAction.create'), desc: t('dashboard.quickAction.createDesc'), icon: 'auto_awesome', color: 'from-primary/20 to-primary/5', iconColor: 'text-primary' },
                { id: 'EXTRACT', title: t('dashboard.quickAction.extract'), desc: t('dashboard.quickAction.extractDesc'), icon: 'checkroom', color: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-500 dark:text-emerald-400' },
                { id: 'VIDEO', title: t('dashboard.quickAction.video'), desc: t('dashboard.quickAction.videoDesc'), icon: 'movie', color: 'from-pink-500/20 to-pink-500/5', iconColor: 'text-pink-500 dark:text-pink-400' },
                { id: 'INTAKE', title: 'Product Intake', desc: 'Phân tích & trích xuất data (Affiliate)', icon: 'insights', color: 'from-orange-500/20 to-orange-500/5', iconColor: 'text-orange-500 dark:text-orange-400' }
            ].map((card, idx) => (
                <div 
                    key={card.id} 
                    onClick={() => onNavigate(card.id)} 
                    className="group bg-white dark:bg-[#1a1025] p-10 rounded-[40px] border border-gray-200 dark:border-white/[0.08] cursor-pointer hover:border-primary/40 dark:hover:border-primary/40 shadow-sm dark:shadow-none hover:shadow-xl dark:hover:shadow-2xl hover:shadow-primary/10 dark:hover:shadow-primary/15 transition-all duration-500 flex flex-col items-start gap-8 relative overflow-hidden animate-slideUp"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                >
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                    <div className={`w-16 h-16 rounded-[24px] bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:bg-gray-100 dark:group-hover:bg-white/[0.08] transition-all duration-500 ${card.iconColor} shadow-sm dark:shadow-xl`}>
                        <span className="material-symbols-outlined text-4xl">{card.icon}</span>
                    </div>
                    <div className="relative z-10 w-full">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider">{card.title}</h3>
                            <span className="material-symbols-outlined text-gray-400 dark:text-gray-700 group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
                        </div>
                        <p className="text-[12px] text-gray-500 font-bold mt-2 uppercase tracking-[2px] opacity-80">{card.desc}</p>
                    </div>
                </div>
            ))}
        </div>

        {/* Recent Section */}
        <section className="space-y-8 pt-8 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-500 dark:text-orange-400 flex items-center justify-center shadow-sm dark:shadow-lg">
                        <span className="material-symbols-outlined text-2xl">history</span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase tracking-[1px]">{t('library.history')}</h3>
                </div>
                <button onClick={() => onNavigate('LIBRARY')} className="btn-secondary px-5 py-2.5 text-[10px]">Xem tất cả</button>
            </div>
            
            {history.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                 {history.slice(0, 4).map(item => (
                    <div key={item.id} onClick={() => onOpenHistory(item)} className="group cursor-pointer space-y-4">
                       <div className="aspect-[4/5] rounded-[32px] overflow-hidden relative bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] shadow-md dark:shadow-2xl group-hover:shadow-primary/30 group-hover:border-primary/50 group-hover:-translate-y-2 transition-all duration-700">
                          <img src={item.images[0]?.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Recent" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 dark:from-black/90 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                          <div className="absolute bottom-5 left-5 right-5">
                            <p className="text-[11px] font-black text-white truncate uppercase tracking-[2px]">{item.prompt || 'Fashion Set'}</p>
                            <p className="text-[9px] text-gray-300 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">Lookbook Version</p>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-white/[0.01] rounded-[48px] py-24 text-center border border-dashed border-gray-300 dark:border-white/[0.1] animate-pulse">
                 <div className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-white/[0.03] flex items-center justify-center mb-6 mx-auto border border-gray-200 dark:border-white/5">
                    <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-700">folder_open</span>
                 </div>
                 <p className="text-[11px] text-gray-500 font-black uppercase tracking-[4px]">{t('library.historyEmpty')}</p>
              </div>
            )}
        </section>
      </div>
    </div>
  );
};
