
import React from 'react';
import { UserProfile } from '../types';
import { supabase } from '../services/supabase';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  userProfile: UserProfile | null;
}

export const Sidebar = ({ activeView, onNavigate, userProfile }: SidebarProps) => {
  const menuItems = [
    { id: 'HOME', label: 'Trang chủ', icon: 'home' },
    { id: 'CREATE', label: 'Thiết kế mới', icon: 'auto_awesome' },
    { id: 'EXTRACT', label: 'Tách đồ áo', icon: 'content_cut' },
    { id: 'VIDEO', label: 'Video Studio', icon: 'movie' },
    { id: 'LIBRARY', label: 'Thư viện', icon: 'collections' },
    ...(userProfile?.isAdmin ? [{ id: 'ADMIN_PANEL', label: 'Quản trị', icon: 'shield_person' }] : []),
    { id: 'SETTINGS', label: 'Cài đặt', icon: 'settings' },
  ];

  return (
    <aside className="w-[280px] h-full bg-white dark:bg-background-dark border-r border-gray-100 dark:border-white/5 flex flex-col shrink-0">
      {/* Branding */}
      <div className="p-10 flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-[#a855f7] rounded-[18px] flex items-center justify-center text-white shadow-2xl shadow-primary/30 rotate-3">
          <span className="material-symbols-outlined text-2xl font-bold">flare</span>
        </div>
        <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter dark:text-white text-gray-900 leading-none">FashionStudio</h1>
            <span className="text-[9px] font-black text-primary uppercase tracking-[2px] mt-1">Creative AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 space-y-3 py-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-[24px] font-black transition-all duration-300 group ${
              activeView === item.id
                ? 'bg-primary text-white shadow-2xl shadow-primary/30 scale-[1.02]'
                : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            <span className={`material-symbols-outlined transition-transform duration-500 ${activeView === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
            </span>
            <span className="text-[13px] uppercase tracking-wider">{item.label}</span>
            {activeView === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]"></div>
            )}
          </button>
        ))}
      </nav>

      {/* User Session */}
      <div className="p-8 border-t border-gray-100 dark:border-white/5 space-y-6">
        <div className="flex items-center gap-4 px-2">
          <div className="relative">
              <img
                src={userProfile?.avatar || `https://ui-avatars.com/api/?name=${userProfile?.name || 'User'}`}
                className="w-12 h-12 rounded-[18px] border-2 border-primary/20 object-cover shadow-lg"
                alt="Avatar"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-background-dark rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-black dark:text-white text-gray-900 truncate tracking-tight">
              {userProfile?.name || 'Người dùng'}
            </p>
            <p className="text-[10px] font-bold text-gray-400 truncate uppercase tracking-widest">{userProfile?.isAdmin ? 'Quản trị viên' : 'Nhà thiết kế'}</p>
          </div>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-[24px] font-black transition-all text-[11px] uppercase tracking-widest border border-red-500/10"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};
