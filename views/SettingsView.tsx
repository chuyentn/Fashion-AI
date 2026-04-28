
import React from 'react';
import { Header } from '../components/Common';
import { LiveStatusDot } from '../components/LiveStatusDot';
import { AppState, CURRENT_VERSION } from '../types';
import { 
  ApiSettings, 
  DEFAULT_API_BASE_URL, 
  exportProject, 
  importProject,
  verifyGeminiKey,
  verifyOpenAIKey,
  AuthMode,
  getAuthModeLabel
} from '../services/apiSettings';
import { supabase } from '../services/supabase';
import { useTranslation } from 'react-i18next';

export const SettingsView = ({ state, updateState, apiSettings, updateApiSettings, setShowVersionModal }: { state: AppState, updateState: (s: Partial<AppState>) => void, apiSettings: ApiSettings, updateApiSettings: (s: Partial<ApiSettings>) => void, setShowVersionModal: (v: boolean) => void }) => {
  const { t } = useTranslation();
  const [verifyingGemini, setVerifyingGemini] = React.useState(false);
  const [verifyingOpenAI, setVerifyingOpenAI] = React.useState(false);
  const [geminiStatus, setGeminiStatus] = React.useState<{ ok: boolean; message: string } | null>(null);
  const [openaiStatus, setOpenaiStatus] = React.useState<{ ok: boolean; message: string } | null>(null);

  const handleVerifyGemini = async () => {
    setVerifyingGemini(true);
    setGeminiStatus(null);
    const res = await verifyGeminiKey(apiSettings);
    setGeminiStatus(res);
    setVerifyingGemini(false);
  };

  const handleVerifyOpenAI = async () => {
    setVerifyingOpenAI(true);
    setOpenaiStatus(null);
    const res = await verifyOpenAIKey(apiSettings.openaiKey, apiSettings.openaiBaseUrl);
    setOpenaiStatus(res);
    setVerifyingOpenAI(false);
  };
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-[#f7f6f8] dark:bg-[#110b18] animate-fadeIn relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2"></div>
      
      <Header title={t('settings.title')} />
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10 pb-32 text-left relative z-10 studio-container">
        
        {/* --- AUTH MODE SELECTION --- */}
        <div className="card-premium rounded-[32px] p-6 md:p-8 animate-slideUp bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500">
              <span className="material-symbols-outlined text-2xl">vpn_key</span>
            </div>
            <div>
              <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">Cổng kết nối API</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Chọn phương thức xác thực hệ thống</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['apikey', 'bearer', 'cookie'] as AuthMode[]).map(mode => (
              <button key={mode} onClick={() => updateApiSettings({ authMode: mode })}
                className={`px-4 py-3 rounded-xl border-2 transition-all text-[10px] font-black uppercase tracking-widest ${apiSettings.authMode === mode ? 'border-primary bg-primary/10 text-primary' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                {getAuthModeLabel(mode).split(' (')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* --- GEMINI API SECTION --- */}
        <div className="card-premium rounded-[32px] p-6 md:p-10 animate-slideUp bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#a413ec] to-[#ec4899] flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0 group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-2xl">magic_button</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase tracking-wider">{t('settings.gemini')}</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{t('settings.geminiDesc')} · {apiSettings.geminiModel === 'pro' ? 'Banana Pro' : 'Nano Banana 2'}</p>
            </div>
            <LiveStatusDot settings={apiSettings} type="gemini" />
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('settings.apiKey')}</label>
              <div className="relative">
                <input type="password" value={apiSettings.geminiKey}
                  onChange={e => { updateApiSettings({ geminiKey: e.target.value, authMode: 'apikey', baseUrl: DEFAULT_API_BASE_URL }); }}
                  placeholder={t('settings.apiKeyPlaceholder')} className="input-studio w-full font-mono pr-14" />
                {apiSettings.geminiKey && (
                  <button onClick={() => updateApiSettings({ geminiKey: '' })} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-red-400 transition-colors bg-gray-100 dark:bg-white/5 rounded-full p-1">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:text-gray-900 dark:hover:text-white font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors ml-1">
                  <span className="material-symbols-outlined text-sm">open_in_new</span> {t('settings.getKey')}
                </a>
                <button onClick={handleVerifyGemini} disabled={verifyingGemini} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-2">
                  <span className={`material-symbols-outlined text-sm ${verifyingGemini ? 'animate-spin' : ''}`}>{verifyingGemini ? 'sync' : 'verified'}</span>
                  {t('settings.verify')}
                </button>
              </div>
              {geminiStatus && (
                <div className={`mt-3 p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest ${geminiStatus.ok ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {geminiStatus.message}
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-gray-200 dark:border-white/[0.06]">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block ml-1">{t('settings.modelOptimized')}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => updateApiSettings({ geminiModel: 'fast' })}
                  className={`p-6 rounded-[24px] border-2 transition-all text-left relative overflow-hidden group/btn ${apiSettings.geminiModel === 'fast' ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(164,19,236,0.15)]' : 'border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.04]'}`}>
                  <span className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider relative z-10 flex items-center gap-2">
                     <span className="material-symbols-outlined text-primary">bolt</span> Nano Banana 2
                  </span>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 relative z-10">{t('settings.modelFast')}</p>
                </button>
                <button onClick={() => updateApiSettings({ geminiModel: 'pro' })}
                  className={`p-6 rounded-[24px] border-2 transition-all text-left relative overflow-hidden group/btn ${apiSettings.geminiModel === 'pro' ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(164,19,236,0.15)]' : 'border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.04]'}`}>
                  <span className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider relative z-10 flex items-center gap-2">
                     <span className="material-symbols-outlined text-pink-500">workspace_premium</span> Banana Pro
                  </span>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 relative z-10">{t('settings.modelPro')}</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- VIDEO TOGGLE --- */}
        <div className="card-premium rounded-[32px] p-6 md:p-8 animate-slideUp bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ec4899] to-[#e11d48] flex items-center justify-center text-white shadow-lg shrink-0">
                <span className="material-symbols-outlined text-2xl">movie</span>
              </div>
              <div>
                <h3 className="font-black text-base text-gray-900 dark:text-white uppercase tracking-wider">{t('settings.videoEngine')}</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{t('settings.videoEngineDesc')}</p>
              </div>
            </div>
            <button onClick={() => updateApiSettings({ videoEnabled: !apiSettings.videoEnabled })} className={`w-14 h-8 rounded-full relative transition-all duration-500 shrink-0 ${apiSettings.videoEnabled ? 'bg-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.5)]' : 'bg-gray-200 dark:bg-white/[0.1]'}`}>
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-500 ${apiSettings.videoEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>
          
          {apiSettings.videoEnabled && (
            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-white/[0.06] animate-slideUp">
              <button onClick={() => updateApiSettings({ videoModel: 'standard' })}
                className={`p-5 rounded-[24px] border-2 transition-all text-left ${apiSettings.videoModel === 'standard' ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_30px_rgba(236,72,153,0.15)]' : 'border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.04]'}`}>
                <span className="font-black text-[11px] text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-pink-500 text-sm">movie_filter</span> {t('settings.videoStandard')}</span>
                <p className="text-[10px] text-gray-500 mt-2 uppercase font-bold tracking-widest">4K, Audio Support</p>
              </button>
              <button onClick={() => updateApiSettings({ videoModel: 'lite' })}
                className={`p-5 rounded-[24px] border-2 transition-all text-left ${apiSettings.videoModel === 'lite' ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_30px_rgba(236,72,153,0.15)]' : 'border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.04]'}`}>
                <span className="font-black text-[11px] text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-gray-400 text-sm">speed</span> {t('settings.videoLite')}</span>
                <p className="text-[10px] text-gray-500 mt-2 uppercase font-bold tracking-widest">Preview Mode</p>
              </button>
            </div>
          )}
        </div>

        {/* --- OPENAI API SECTION --- */}
        <div className="card-premium rounded-[32px] p-6 md:p-10 animate-slideUp bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-5 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#10a37f] to-[#1a73e8] flex items-center justify-center text-white shadow-lg shrink-0">
              <span className="material-symbols-outlined text-2xl">key</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase tracking-wider">{t('settings.openai')}</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{t('settings.openaiDesc')} · {apiSettings.openaiModel === 'gpt-image-2' ? 'GPT Image 2' : 'DALL-E 3'}</p>
            </div>
            <LiveStatusDot settings={apiSettings} type="openai" />
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('settings.openaiKey')}</label>
              <div className="relative">
                <input type="password" value={apiSettings.openaiKey}
                  onChange={e => updateApiSettings({ openaiKey: e.target.value })}
                  placeholder="sk-proj-..." className="input-studio w-full font-mono pr-14" />
                {apiSettings.openaiKey && (
                  <button onClick={() => updateApiSettings({ openaiKey: '' })} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-red-400 transition-colors bg-gray-100 dark:bg-white/5 rounded-full p-1">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('settings.openaiBaseUrl')}</label>
              <input type="text" value={apiSettings.openaiBaseUrl}
                onChange={e => updateApiSettings({ openaiBaseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1" className="input-studio w-full font-mono" />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button onClick={handleVerifyOpenAI} disabled={verifyingOpenAI} className="text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black hover:opacity-90 transition-all flex items-center gap-2 shadow-lg">
                <span className={`material-symbols-outlined text-sm ${verifyingOpenAI ? 'animate-spin' : ''}`}>{verifyingOpenAI ? 'sync' : 'done_all'}</span>
                {t('settings.verify')}
              </button>
              
              <button onClick={() => updateApiSettings({ openaiBaseUrl: 'https://api.openai.com/v1', openaiKey: '' })} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-500 flex items-center gap-1.5 transition-colors">
                <span className="material-symbols-outlined text-sm">restart_alt</span> Reset
              </button>
            </div>

            {openaiStatus && (
              <div className={`mt-4 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest leading-relaxed ${openaiStatus.ok ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                {openaiStatus.message}
              </div>
            )}
          </div>
        </div>

        {/* --- DATA MANAGEMENT --- */}
        <div className="card-premium rounded-[32px] p-6 md:p-8 animate-slideUp bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl" style={{ animationDelay: '0.2s' }}>
          <h4 className="font-black text-[10px] text-gray-500 uppercase tracking-[3px] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">sync_alt</span> {t('settings.dataManagement')}
          </h4>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => { const json = exportProject(apiSettings); const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `fashion-ai-config-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url); }}
              className="btn-primary flex-1 bg-primary/10 dark:bg-primary/20 text-primary border-primary/20 dark:border-primary/30 shadow-none hover:bg-primary/20 dark:hover:bg-primary/30 py-4 text-[10px]">
              <span className="material-symbols-outlined text-xl mr-2">download</span> {t('settings.export')}
            </button>
            <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'; input.onchange = (e: any) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { const result = importProject(ev.target?.result as string); if (result) { updateApiSettings(result); alert('Đã nhập cấu hình thành công!'); } else { alert('File không hợp lệ.'); } }; reader.readAsText(file); } }; input.click(); }}
              className="btn-secondary flex-1 py-4 text-[10px] bg-gray-100 dark:bg-white/[0.04]">
              <span className="material-symbols-outlined text-xl mr-2">upload</span> {t('settings.import')}
            </button>
          </div>
        </div>

        {/* --- PROFILE SECTION --- */}
        <div className="card-premium rounded-[40px] p-8 md:p-10 animate-slideUp bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl" style={{ animationDelay: '0.3s' }}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
                <img src={state.userProfile?.avatar} className="w-24 h-24 md:w-28 md:h-28 rounded-[32px] border-2 border-gray-200 dark:border-white/10 shadow-lg dark:shadow-2xl object-cover" alt="Avatar" />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1a1025]">
                    <span className="material-symbols-outlined text-lg">verified</span>
                </div>
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="font-black text-3xl text-gray-900 dark:text-white tracking-tight">{state.userProfile?.name}</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{state.userProfile?.email}</p>
              {state.userProfile?.isAdmin && (
                <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-[2px] border border-primary/20">
                        <span className="material-symbols-outlined text-[12px]">shield_person</span> {t('settings.admin')}
                    </span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto mt-6 md:mt-0">
                {state.userProfile?.isAdmin && (
                  <button onClick={() => updateState({ view: 'ADMIN_PANEL' })} className="w-full btn-primary bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 shadow-xl border-transparent py-4 text-[10px]">
                    <span className="material-symbols-outlined text-lg mr-2">admin_panel_settings</span> {t('settings.admin')}
                  </button>
                )}
                <button onClick={() => supabase.auth.signOut()} className="w-full btn-secondary bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-red-500/20 py-4 text-[10px]">
                    <span className="material-symbols-outlined text-lg mr-2">logout</span> {t('settings.logout')}
                </button>
            </div>
          </div>
        </div>

        <div className="text-center pb-8 pt-4">
            <button onClick={() => setShowVersionModal(true)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-[9px] font-black uppercase tracking-[3px] flex items-center justify-center gap-2 mx-auto bg-gray-100 dark:bg-white/[0.02] hover:bg-gray-200 dark:hover:bg-white/[0.05] px-4 py-2 rounded-full border border-gray-200 dark:border-white/5">
                <span>Studio Engine v{CURRENT_VERSION}</span>
                <span className="material-symbols-outlined text-sm">info</span>
            </button>
        </div>
      </div>
    </div>
  );
};
