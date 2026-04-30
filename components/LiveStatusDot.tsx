
import React, { useState, useEffect, useRef } from 'react';
import { ApiSettings, verifyGeminiKey, verifyOpenAIKey } from '../services/apiSettings';

export const LiveStatusDot = ({ settings, type }: { settings: ApiSettings; type: 'gemini' | 'openai' }) => {
  const [status, setStatus] = useState<'idle' | 'checking' | 'live' | 'dead'>('idle');
  const [msg, setMsg] = useState('');
  const timerRef = useRef<any>(null);

  const credential = type === 'gemini' ? settings.geminiKey : settings.openaiKey;

  useEffect(() => {
    if (!credential || credential.length < 6) { setStatus('idle'); setMsg(''); return; }
    setStatus('checking');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const result = type === 'gemini' 
          ? await verifyGeminiKey(settings) 
          : await verifyOpenAIKey(settings.openaiKey, settings.openaiBaseUrl);
        setStatus(result.ok ? 'live' : 'dead');
        setMsg(result.message);
      } catch { setStatus('dead'); setMsg('Lỗi kết nối'); }
    }, 1500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [credential, settings.baseUrl, settings.openaiBaseUrl]);

  if (status === 'idle') return null;
  return (
    <div className="flex items-center gap-2 mt-2 animate-[fadeIn_0.3s]">
      {status === 'checking' && <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0"></span>}
      {status === 'live' && <span className="relative flex h-3 w-3 shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>}
      {status === 'dead' && <span className="relative flex h-3 w-3 shrink-0"><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
      <span className={`text-xs font-bold ${status === 'checking' ? 'text-gray-400' : status === 'live' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
        {status === 'checking' ? 'Đang kiểm tra...' : status === 'live' ? 'LIVE ✓' : 'DEAD ✗'}
      </span>
      {msg && status !== 'checking' && <span className="text-[10px] text-gray-400 truncate ml-1 hidden md:inline">{msg}</span>}
    </div>
  );
};
