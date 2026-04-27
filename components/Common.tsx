
import React from 'react';

export const Header = ({ title, backAction }: { title: string, backAction?: () => void }) => (
  <header className="sticky top-0 z-40 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-white/5 p-4 md:p-8 flex items-center gap-4 text-left shadow-sm">
    {backAction && (
      <button onClick={backAction} className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center dark:text-white text-gray-900 transition-colors">
        <span className="material-symbols-outlined">arrow_back</span>
      </button>
    )}
    <h2 className="text-2xl font-black dark:text-white text-gray-900 tracking-tight">{title}</h2>
  </header>
);

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
