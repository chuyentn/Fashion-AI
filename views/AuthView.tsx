
import React, { useState } from 'react';
import { supabase, ensureProfileExists } from '../services/supabase';

// ===== PRODUCTION SITE URL =====
// Must point to /app.html — the React SPA that handles auth tokens
// Root URL is the static landing page and cannot process OAuth callbacks
const SITE_URL = 'https://fashion.breaths.live/app.html';

export const AuthView = ({ onAuthSuccess }: { onAuthSuccess: (session: any) => void }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: SITE_URL }
      });
      if (error) throw error;
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi đăng nhập Google', type: 'error' });
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (mode === 'SIGNUP') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: SITE_URL
          }
        });
        if (error) throw error;
        if (data.user) await ensureProfileExists(data.user.id, email, fullName);
        
        // Show confirmation modal and auto-switch to LOGIN
        setRegisteredEmail(email);
        setShowConfirmModal(true);
        
        // Auto-switch to LOGIN after 3 seconds
        setTimeout(() => {
          setMode('LOGIN');
          setPassword('');
          setShowConfirmModal(false);
          setMessage({ text: '✅ Bạn có thể đăng nhập ngay nếu đã xác nhận email.', type: 'success' });
        }, 5000);

      } else if (mode === 'LOGIN') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) onAuthSuccess(data.session);
      } else if (mode === 'FORGOT') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `https://fashion.breaths.live/app.html#reset-password`
        });
        if (error) throw error;
        setMessage({ text: '📧 Link đặt lại mật khẩu đã được gửi đến email của bạn!', type: 'success' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Có lỗi xảy ra', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#f7f6f8] dark:bg-[#0a0510] relative overflow-hidden font-sans text-gray-900 dark:text-white animate-fadeIn transition-colors duration-300">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[150px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Decorative floating shapes */}
      <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-gray-400/20 dark:bg-white/20 rounded-full animate-ping pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-primary/30 rounded-full animate-ping [animation-delay:1s] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white dark:bg-white/[0.03] backdrop-blur-3xl border border-gray-200 dark:border-white/[0.08] p-8 md:p-10 rounded-[48px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl relative z-10 animate-scaleIn">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-[#a413ec] via-[#c040ff] to-pink-500 rounded-[24px] flex items-center justify-center text-white mx-auto mb-6 shadow-[0_0_40px_rgba(164,19,236,0.3)] rotate-3">
            <span className="material-symbols-outlined text-4xl font-bold">flare</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">FashionStudio</h1>
          <p className="text-[10px] font-black text-primary uppercase tracking-[4px] mt-2">Creative AI Platform</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-start gap-3 animate-slideUp ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            <span className="material-symbols-outlined text-lg shrink-0">{message.type === 'error' ? 'error' : 'check_circle'}</span>
            <span className="flex-1 leading-relaxed">{message.text}</span>
          </div>
        )}

        <button onClick={handleGoogleLogin} disabled={loading} className="w-full h-14 bg-gray-50 dark:bg-white hover:bg-gray-200 dark:hover:bg-gray-100 text-gray-900 font-black rounded-[20px] shadow-sm dark:shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] mb-8 disabled:opacity-50 text-[11px] uppercase tracking-widest border border-gray-200 dark:border-white/20 hover:shadow-md dark:hover:shadow-white/20">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Tiếp tục với Google
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.08]"></div>
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-[3px]">Hoặc Email</span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.08]"></div>
        </div>

        <form onSubmit={handleAuth} className="space-y-5 text-left">
          {mode === 'SIGNUP' && (
            <div className="space-y-2 animate-slideUp">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[2px] ml-1">Họ và tên</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 material-symbols-outlined text-xl group-focus-within:text-primary transition-colors">person</span>
                <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="input-studio w-full pl-12" placeholder="Nguyễn Văn A" />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[2px] ml-1">Địa chỉ Email</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 material-symbols-outlined text-xl group-focus-within:text-primary transition-colors">mail</span>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-studio w-full pl-12" placeholder="name@company.com" />
            </div>
          </div>
          {mode !== 'FORGOT' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[2px] ml-1">Mật khẩu</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 material-symbols-outlined text-xl group-focus-within:text-primary transition-colors">lock</span>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-studio w-full pl-12" placeholder="••••••••" />
              </div>
            </div>
          )}
          <button disabled={loading} className="btn-primary w-full h-14 mt-6 text-[11px] disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
              mode === 'LOGIN' ? 'Đăng nhập Studio' : mode === 'SIGNUP' ? 'Đăng ký ngay' : 'Đặt lại mật khẩu'
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-gray-200 dark:border-white/[0.06] flex flex-col gap-4 text-center">
          {mode === 'LOGIN' ? (
            <>
              <button onClick={() => setMode('SIGNUP')} className="text-[11px] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-bold uppercase tracking-widest">Chưa có tài khoản? <span className="text-primary font-black ml-1 border-b border-primary/30 pb-0.5">Đăng ký ngay</span></button>
              <button onClick={() => setMode('FORGOT')} className="text-[10px] text-gray-600 hover:text-gray-900 dark:hover:text-gray-400 transition-colors uppercase tracking-[2px] font-bold">Quên mật khẩu?</button>
            </>
          ) : (
            <button onClick={() => { setMode('LOGIN'); setShowConfirmModal(false); }} className="text-[11px] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-bold uppercase tracking-widest">Đã có tài khoản? <span className="text-primary font-black ml-1 border-b border-primary/30 pb-0.5">Đăng nhập</span></button>
          )}
        </div>
      </div>
      
      {/* Bottom Footer Info */}
      <div className="absolute bottom-8 left-0 right-0 text-center opacity-30 hover:opacity-100 transition-opacity duration-500">
        <p className="text-[9px] font-black uppercase tracking-[4px]">Powered by <span className="text-primary">DeepMind AI</span> & ChuyenTN</p>
      </div>

      {/* ===== EMAIL CONFIRMATION POPUP MODAL ===== */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-fadeIn">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => { setShowConfirmModal(false); setMode('LOGIN'); }} />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1a1025] border border-gray-200 dark:border-white/[0.08] rounded-[36px] p-8 shadow-2xl animate-[scaleIn_0.4s_ease-out] text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500/20">
              <span className="material-symbols-outlined text-5xl text-emerald-500 animate-[bounceIn_0.5s_ease-out]">mark_email_read</span>
            </div>
            
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
              Đăng ký thành công! 🎉
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Chúng tôi đã gửi email xác nhận đến:
            </p>
            <div className="bg-gray-100 dark:bg-white/5 rounded-2xl px-5 py-3 mb-6 border border-gray-200 dark:border-white/10">
              <p className="text-sm font-black text-primary tracking-tight truncate">{registeredEmail}</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              Vui lòng mở hộp thư email và bấm vào link xác nhận để kích hoạt tài khoản. 
              Sau khi xác nhận, bạn có thể đăng nhập ngay.
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <a 
                href={`https://mail.google.com/mail/u/0/#search/from%3Anoreply+FashionStudio`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full h-12 text-[10px] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">open_in_new</span>
                Mở Gmail ngay
              </a>
              <button 
                onClick={() => { setShowConfirmModal(false); setMode('LOGIN'); setPassword(''); }}
                className="w-full h-12 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                Chuyển sang Đăng nhập
              </button>
            </div>

            {/* Auto-redirect countdown */}
            <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-4 animate-pulse">
              Tự động chuyển sang đăng nhập sau 5 giây...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
