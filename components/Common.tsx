import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';

export const Header = ({ title, backAction }: { title: string, backAction?: () => void }) => {
  const { i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#110b18]/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.04] px-6 py-4 md:px-8 md:py-5 flex items-center justify-between text-left">
      <div className="flex items-center gap-3">
        {backAction && (
          <button onClick={backAction} className="w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 active:scale-90">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
        )}
        <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h2>
      </div>
      
      <div className="flex items-center gap-3">
        <button onClick={toggleLanguage} className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors shadow-sm dark:shadow-none" title={i18n.language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}>
          {i18n.language === 'vi' ? '🇻🇳' : '🇺🇸'}
        </button>
        <button onClick={toggleTheme} className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors text-gray-600 dark:text-gray-400 shadow-sm dark:shadow-none" title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
          <span className="material-symbols-outlined text-[20px]">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>
    </header>
  );
};

export const ImageLightbox = ({ src, onClose }: { src: string | null, onClose: () => void }) => {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-[fadeIn_0.2s]" onClick={onClose}>
       <button onClick={onClose} className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
          <span className="material-symbols-outlined">close</span>
       </button>
       <img src={src} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} alt="Zoom" />
    </div>
  );
};
