
import React from 'react';
import { Header } from '../components/Common';
import { LiveStatusDot } from '../components/LiveStatusDot';
import { AppState, CURRENT_VERSION } from '../types';
import { ApiSettings, DEFAULT_API_BASE_URL, exportProject, importProject } from '../services/apiSettings';
import { supabase } from '../services/supabase';

export const SettingsView = ({ state, updateState, apiSettings, updateApiSettings, setShowVersionModal }: { state: AppState, updateState: (s: Partial<AppState>) => void, apiSettings: ApiSettings, updateApiSettings: (s: Partial<ApiSettings>) => void, setShowVersionModal: (v: boolean) => void }) => {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <Header title="Cài đặt" />
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24 text-left">
        
        {/* --- GEMINI API SECTION --- */}
        <div className="bg-white dark:bg-surface-card rounded-3xl p-5 md:p-8 border border-gray-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-tr from-primary to-pink-500 flex items-center justify-center text-white shadow-lg shrink-0">
              <span className="material-symbols-outlined text-xl md:text-2xl">magic_button</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base md:text-lg dark:text-white text-gray-900">Google Gemini</h3>
              <p className="text-[11px] text-gray-500">Dịch vụ chính · {apiSettings.geminiModel === 'pro' ? 'Banana Pro' : 'Nano Banana 2'}</p>
            </div>
            <LiveStatusDot settings={apiSettings} type="gemini" />
          </div>
          <div className="space-y-4">
            <div className="relative">
              <input type="password" value={apiSettings.geminiKey}
                onChange={e => { updateApiSettings({ geminiKey: e.target.value, authMode: 'apikey', baseUrl: DEFAULT_API_BASE_URL }); }}
                placeholder="AIza... (từ Google AI Studio)" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono pr-10" />
              {apiSettings.geminiKey && <button onClick={() => updateApiSettings({ geminiKey: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><span className="material-symbols-outlined text-lg">close</span></button>}
            </div>
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">open_in_new</span> Lấy API Key tại Google AI Studio
            </a>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Model tạo ảnh</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => updateApiSettings({ geminiModel: 'fast' })}
                className={`p-3 rounded-xl border-2 text-left transition-all ${apiSettings.geminiModel === 'fast' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-white/10'}`}>
                <span className="font-bold text-xs dark:text-white">⚡ Nano Banana 2</span>
                <p className="text-[10px] text-gray-500 mt-0.5">Nhanh · 4K · gemini-3.1-flash</p>
              </button>
              <button onClick={() => updateApiSettings({ geminiModel: 'pro' })}
                className={`p-3 rounded-xl border-2 text-left transition-all ${apiSettings.geminiModel === 'pro' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-white/10'}`}>
                <span className="font-bold text-xs dark:text-white">🍌 Banana Pro</span>
                <p className="text-[10px] text-gray-500 mt-0.5">HD · Thinking · gemini-3-pro</p>
              </button>
            </div>
          </div>

          <details className="mt-4">
            <summary className="text-[11px] text-gray-400 cursor-pointer hover:text-gray-600 select-none flex items-center gap-1">
              🔧 Nâng cao: Bearer Token / Cookie <span className="text-[9px] bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold ml-1">Sắp ra mắt</span>
            </summary>
            <div className="mt-3 space-y-3 pl-0.5">
              <div className="bg-amber-50/50 dark:bg-amber-900/5 border border-amber-200/30 dark:border-amber-700/15 rounded-lg p-2.5">
                <p className="text-[10px] text-amber-700 dark:text-amber-400">
                  ⚠️ Cần Extension + Captcha solver. Đang phát triển — sẽ hỗ trợ labs.google miễn phí.
                </p>
              </div>
              <input type="password" value={apiSettings.bearerToken} onChange={e => updateApiSettings({ bearerToken: e.target.value, authMode: 'bearer' })}
                placeholder="ya29.a0... (Bearer Token)" className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs dark:text-white font-mono focus:outline-none" />
              <div className="flex gap-2">
                <input type="text" value={apiSettings.baseUrl} onChange={e => updateApiSettings({ baseUrl: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[11px] dark:text-white font-mono focus:outline-none" placeholder="Base URL..." />
                <button onClick={() => updateApiSettings({ baseUrl: DEFAULT_API_BASE_URL })} className="px-2.5 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-[11px] font-bold text-gray-500 hover:text-primary">Reset</button>
              </div>
            </div>
          </details>
        </div>

        {/* --- OPENAI API SECTION --- */}
        <div className="bg-white dark:bg-surface-card rounded-3xl p-5 md:p-8 border border-gray-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shrink-0">
              <span className="material-symbols-outlined text-xl md:text-2xl">smart_toy</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base md:text-lg dark:text-white text-gray-900">OpenAI</h3>
              <p className="text-[11px] text-gray-500">GPT Image 2 · Tùy chọn</p>
            </div>
            <LiveStatusDot settings={apiSettings} type="openai" />
          </div>
          <div className="relative">
            <input type="password" value={apiSettings.openaiKey} onChange={e => updateApiSettings({ openaiKey: e.target.value })}
              placeholder="sk-proj-... (từ OpenAI Platform)" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono pr-10" />
            {apiSettings.openaiKey && <button onClick={() => updateApiSettings({ openaiKey: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><span className="material-symbols-outlined text-lg">close</span></button>}
          </div>
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 mt-2">
            <span className="material-symbols-outlined text-xs">open_in_new</span> Lấy key tại OpenAI Platform
          </a>
        </div>

        {/* --- VIDEO TOGGLE --- */}
        <div className="bg-white dark:bg-surface-card rounded-3xl p-5 md:p-8 border border-gray-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shrink-0">
                <span className="material-symbols-outlined text-xl md:text-2xl">movie</span>
              </div>
              <div>
                <h3 className="font-bold text-base md:text-lg dark:text-white">Video AI</h3>
                <p className="text-[11px] text-gray-500">Veo 3.1 · 8s · 4K</p>
              </div>
            </div>
            <button onClick={() => updateApiSettings({ videoEnabled: !apiSettings.videoEnabled })} className={`w-14 h-8 rounded-full relative transition-colors shrink-0 ${apiSettings.videoEnabled ? 'bg-pink-500' : 'bg-gray-300 dark:bg-white/15'}`}>
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${apiSettings.videoEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>
          {apiSettings.videoEnabled && (
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
              <button onClick={() => updateApiSettings({ videoModel: 'standard' })}
                className={`p-3 rounded-xl border-2 text-left transition-all ${apiSettings.videoModel === 'standard' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/10' : 'border-gray-200 dark:border-white/10'}`}>
                <span className="font-bold text-xs dark:text-white">🎬 Veo 3.1</span>
                <p className="text-[10px] text-gray-500 mt-0.5">4K, audio</p>
              </button>
              <button onClick={() => updateApiSettings({ videoModel: 'lite' })}
                className={`p-3 rounded-xl border-2 text-left transition-all ${apiSettings.videoModel === 'lite' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/10' : 'border-gray-200 dark:border-white/10'}`}>
                <span className="font-bold text-xs dark:text-white">⚡ Lite</span>
                <p className="text-[10px] text-gray-500 mt-0.5">Nhanh, preview</p>
              </button>
            </div>
          )}
        </div>

        {/* --- EXPORT / IMPORT --- */}
        <div className="bg-white dark:bg-surface-card rounded-3xl p-5 md:p-8 border border-gray-200 dark:border-white/5 shadow-sm">
          <h4 className="font-bold text-sm dark:text-gray-300 text-gray-700 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">sync_alt</span> Xuất / Nhập cấu hình
          </h4>
          <div className="flex gap-2">
            <button onClick={() => { const json = exportProject(apiSettings); const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `fashion-ai-config-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url); }}
              className="flex-1 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-bold transition-all flex items-center justify-center gap-1.5 text-xs">
              <span className="material-symbols-outlined text-base">download</span> Xuất
            </button>
            <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'; input.onchange = (e: any) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { const result = importProject(ev.target?.result as string); if (result) { updateApiSettings(result); alert('Đã nhập cấu hình thành công!'); } else { alert('File không hợp lệ.'); } }; reader.readAsText(file); } }; input.click(); }}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 font-bold transition-all flex items-center justify-center gap-1.5 text-xs">
              <span className="material-symbols-outlined text-base">upload</span> Nhập
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">🔒 API Keys không xuất ra file.</p>
        </div>

        {/* --- PROFILE --- */}
        <div className="bg-white dark:bg-surface-card rounded-3xl p-5 md:p-8 border border-gray-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-4 mb-5">
            <img src={state.userProfile?.avatar} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-3 border-primary shadow-lg object-cover shrink-0" alt="Avatar" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg md:text-xl dark:text-white text-gray-900 truncate">{state.userProfile?.name} {state.userProfile?.isAdmin && <span className="bg-primary/10 text-primary text-[9px] px-1.5 py-0.5 rounded-full ml-1">ADMIN</span>}</p>
              <p className="text-xs text-gray-500 truncate">{state.userProfile?.email}</p>
            </div>
          </div>
          <div className="space-y-2">
            {state.userProfile?.isAdmin && (
              <button onClick={() => updateState({ view: 'ADMIN_PANEL' })} className="w-full py-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-bold transition-all flex items-center justify-center gap-2 text-sm">
                <span className="material-symbols-outlined text-lg">shield_person</span> Quản trị
              </button>
            )}
            <button onClick={() => supabase.auth.signOut()} className="w-full py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-bold transition-colors flex items-center justify-center gap-2 text-sm"><span className="material-symbols-outlined text-lg">logout</span> Đăng xuất</button>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-card rounded-3xl p-5 md:p-6 border border-gray-200 dark:border-white/5 shadow-sm flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><span className="material-symbols-outlined text-xl">dark_mode</span></div>
              <span className="font-bold text-sm dark:text-white">Giao diện tối</span>
           </div>
           <button onClick={() => updateState({ theme: state.theme === 'dark' ? 'light' : 'dark' })} className={`w-14 h-8 rounded-full relative transition-colors ${state.theme === 'dark' ? 'bg-primary' : 'bg-gray-300'}`}><div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${state.theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}></div></button>
        </div>
        <div className="text-center pb-4"><button onClick={() => setShowVersionModal(true)} className="text-gray-400 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"><span>Phiên bản {CURRENT_VERSION}</span><span className="material-symbols-outlined text-sm">info</span></button></div>
      </div>
    </div>
  );
};
