import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../services/supabase';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  userProfile: UserProfile | null;
}

const SIDEBAR_COLLAPSED_KEY = 'fashion-sidebar-collapsed';

export const Sidebar = ({ activeView, onNavigate, userProfile }: SidebarProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'; } catch { return false; }
  });
  const { t } = useTranslation();

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed)); } catch {}
  }, [isCollapsed]);

  const menuItems = [
    { id: 'HOME', label: t('menu.dashboard'), icon: 'home' },
    { id: 'CREATE', label: t('menu.create'), icon: 'auto_awesome' },
    { id: 'EXTRACT', label: t('menu.extract'), icon: 'content_cut' },
    { id: 'VIDEO', label: t('menu.video'), icon: 'movie' },
    { id: 'LIBRARY', label: t('menu.library'), icon: 'collections' },
    ...(userProfile?.isAdmin ? [{ id: 'ADMIN_PANEL', label: t('menu.admin'), icon: 'shield_person' }] : []),
    { id: 'SETTINGS', label: t('menu.settings'), icon: 'settings' },
  ];

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* ========== MOBILE TOGGLE ========== */}
      <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-5 left-5 z-[100] w-12 h-12 rounded-2xl bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-900 dark:text-white shadow-2xl active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined">{isMobileOpen ? 'close' : 'menu'}</span>
      </button>

      {/* ========== SIDEBAR ========== */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-[90] h-full
        bg-white/95 dark:bg-[#110b18]/95 lg:bg-white/80 lg:dark:bg-[#110b18]/80
        backdrop-blur-3xl border-r border-gray-200 dark:border-white/[0.04]
        flex flex-col shrink-0 overflow-hidden
        transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-[84px] w-[280px]' : 'w-[280px]'}
      `}>
        {/* Ambient glow */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* ====== BRANDING + COLLAPSE TOGGLE ====== */}
        <div className={`relative z-10 flex items-center gap-3 transition-all duration-500 ${isCollapsed ? 'lg:px-0 lg:justify-center px-8 justify-start' : 'px-8'} pt-7 pb-5`}>
          {/* Logo */}
          <div className="w-11 h-11 bg-gradient-to-br from-[#a413ec] via-[#c040ff] to-[#ec4899] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/25 rotate-3 hover:rotate-0 transition-transform duration-500 shrink-0 cursor-pointer"
            onClick={() => handleNavigate('HOME')}
          >
            <span className="material-symbols-outlined text-2xl font-bold">flare</span>
          </div>
          
          {/* Brand Text — hidden when collapsed on desktop */}
          <div className={`flex flex-col min-w-0 overflow-hidden transition-all duration-500 ${isCollapsed ? 'lg:w-0 lg:opacity-0 w-auto opacity-100' : 'w-auto opacity-100'}`}>
            <h1 className="text-xl font-black tracking-tighter text-gray-900 dark:text-white leading-none whitespace-nowrap">FashionStudio</h1>
            <span className="text-[9px] font-extrabold text-primary/80 uppercase tracking-[3px] mt-1 whitespace-nowrap">Creative AI</span>
          </div>

          {/* Collapse Toggle — Desktop Only */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex items-center justify-center w-8 h-8 rounded-xl
              bg-gray-100 dark:bg-white/[0.04] hover:bg-primary/10 dark:hover:bg-primary/20
              text-gray-400 hover:text-primary
              border border-gray-200/50 dark:border-white/[0.06] hover:border-primary/30
              transition-all duration-300 group
              ${isCollapsed ? 'lg:absolute lg:top-7 lg:right-1/2 lg:translate-x-1/2 lg:mt-14' : 'ml-auto shrink-0'}
            `}
            title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            <span className={`material-symbols-outlined text-[18px] transition-transform duration-500 group-hover:scale-110 ${isCollapsed ? 'rotate-180' : ''}`}>
              chevron_left
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className={`h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/[0.08] to-transparent transition-all duration-500 ${isCollapsed ? 'lg:mx-4 mx-8' : 'mx-8'}`} />

        {/* ====== NAVIGATION ====== */}
        <nav className={`flex-1 py-5 space-y-1 relative z-10 overflow-y-auto no-scrollbar transition-all duration-500 ${isCollapsed ? 'lg:px-3 px-5' : 'px-5'}`}>
          {menuItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <div key={item.id} className="relative group/nav">
                <button
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center rounded-[18px] font-bold transition-all duration-300 group relative overflow-hidden
                    ${isCollapsed ? 'lg:justify-center lg:px-0 lg:py-3.5 justify-start px-5 py-3.5' : 'px-5 py-3.5'}
                    ${isActive
                      ? 'bg-gradient-to-r from-[#a413ec]/90 to-[#a413ec]/70 text-white shadow-xl shadow-primary/25'
                      : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.04]'
                    }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/[0.08] to-white/0 animate-[shimmer_3s_ease-in-out_infinite]" />
                  )}
                  <span className={`material-symbols-outlined text-[22px] relative z-10 transition-all duration-300 shrink-0
                    ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-primary'}
                    ${isCollapsed ? 'lg:mx-auto' : 'mr-4'}
                  `}>
                    {item.icon}
                  </span>
                  <span className={`text-[12px] uppercase tracking-[1.5px] relative z-10 font-black whitespace-nowrap overflow-hidden transition-all duration-500
                    ${isCollapsed ? 'lg:w-0 lg:opacity-0 w-auto opacity-100' : 'w-auto opacity-100'}
                  `}>
                    {item.label}
                  </span>
                  {isActive && !isCollapsed && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] relative z-10 shrink-0" />
                  )}
                </button>

                {/* Tooltip — Desktop Collapsed Only */}
                {isCollapsed && (
                  <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3.5 py-2 rounded-xl
                    bg-gray-900 dark:bg-[#1a1025] text-white text-[10px] font-black uppercase tracking-widest
                    shadow-2xl border border-white/10
                    opacity-0 group-hover/nav:opacity-100 pointer-events-none
                    transition-all duration-200 translate-x-1 group-hover/nav:translate-x-0
                    whitespace-nowrap z-[200]"
                  >
                    {item.label}
                    {/* Arrow */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-[#1a1025] rotate-45 border-l border-b border-white/10" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ====== USER SESSION ====== */}
        <div className={`border-t border-gray-200 dark:border-white/[0.06] relative z-10 transition-all duration-500
          ${isCollapsed ? 'lg:p-3 p-6' : 'p-6'}
          space-y-4
        `}>
          {/* User Info */}
          <div className={`flex items-center transition-all duration-500
            ${isCollapsed ? 'lg:justify-center lg:px-0 justify-start px-1' : 'px-1'}
            gap-3.5
          `}>
            <div className="relative group shrink-0">
              <img
                src={userProfile?.avatar || `https://ui-avatars.com/api/?name=${userProfile?.name || 'User'}`}
                className={`rounded-2xl border border-primary/20 object-cover shadow-xl group-hover:border-primary transition-all
                  ${isCollapsed ? 'lg:w-10 lg:h-10 w-11 h-11' : 'w-11 h-11'}
                `}
                alt="Avatar"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#110b18] rounded-full" />
            </div>
            <div className={`flex-1 min-w-0 text-left overflow-hidden transition-all duration-500 ${isCollapsed ? 'lg:w-0 lg:opacity-0 w-auto opacity-100' : 'w-auto opacity-100'}`}>
              <p className="text-[14px] font-black text-gray-900 dark:text-white truncate tracking-tight leading-tight">
                {userProfile?.name || 'User'}
              </p>
              <p className="text-[9px] font-black text-gray-500 truncate uppercase tracking-[1.5px] mt-0.5">{userProfile?.isAdmin ? 'Studio Admin' : 'Designer'}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={() => supabase.auth.signOut()}
            className={`w-full flex items-center justify-center gap-2.5 text-red-500 dark:text-red-400/90 hover:text-white
              bg-red-50 dark:bg-red-500/[0.05] hover:bg-red-500 dark:hover:bg-red-500/80
              rounded-2xl font-black transition-all text-[10px] uppercase tracking-[2px]
              border border-red-200 dark:border-red-500/[0.1] hover:border-transparent group
              ${isCollapsed ? 'lg:px-0 lg:py-3 px-6 py-3.5' : 'px-6 py-3.5'}
            `}
          >
            <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform shrink-0">logout</span>
            <span className={`overflow-hidden whitespace-nowrap transition-all duration-500 ${isCollapsed ? 'lg:w-0 lg:opacity-0 w-auto opacity-100' : 'w-auto opacity-100'}`}>
              {t('settings.logout')}
            </span>
          </button>
        </div>
      </aside>

      {/* ========== MOBILE OVERLAY ========== */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm animate-fadeIn" 
        />
      )}
    </>
  );
};
