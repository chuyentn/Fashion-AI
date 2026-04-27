
import React, { useState } from 'react';
import { supabase, ensureProfileExists } from '../services/supabase';

export const AuthView = ({ onAuthSuccess }: { onAuthSuccess: (session: any) => void }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
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
          email, password, options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        if (data.user) await ensureProfileExists(data.user.id, email, fullName);
        setMessage({ text: 'Đăng ký thành công! Vui lòng kiểm tra email.', type: 'success' });
      } else if (mode === 'LOGIN') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) onAuthSuccess(data.session);
      } else if (mode === 'FORGOT') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage({ text: 'Link đặt lại mật khẩu đã được gửi!', type: 'success' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Có lỗi xảy ra', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background-dark relative overflow-hidden font-sans text-white">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[120px]"></div>
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] shadow-2xl relative z-10 animate-[fadeIn_0.5s]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-pink-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-3xl">auto_awesome</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Fashion Studio AI</h1>
          <p className="text-gray-400 text-sm mt-1">Nâng tầm thương hiệu thời trang</p>
        </div>
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-start gap-3 animate-[slideDown_0.3s] ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
            <span className="material-symbols-outlined text-lg mt-0.5">{message.type === 'error' ? 'error' : 'check_circle'}</span>
            <span className="flex-1">{message.text}</span>
          </div>
        )}
        <button onClick={handleGoogleLogin} disabled={loading} className="w-full py-4 bg-white text-gray-900 font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 mb-6 disabled:opacity-50">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Tiếp tục với Google
        </button>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-[1px] flex-1 bg-white/10"></div>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Hoặc Email</span>
          <div className="h-[1px] flex-1 bg-white/10"></div>
        </div>
        <form onSubmit={handleAuth} className="space-y-4 text-left">
          {mode === 'SIGNUP' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">Họ và tên</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 material-symbols-outlined text-xl">person</span>
                <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-600 outline-none focus:border-primary transition-colors" placeholder="Nguyễn Văn A" />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">Email</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 material-symbols-outlined text-xl">mail</span>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-600 outline-none focus:border-primary transition-colors" placeholder="name@company.com" />
            </div>
          </div>
          {mode !== 'FORGOT' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">Mật khẩu</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 material-symbols-outlined text-xl">lock</span>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-600 outline-none focus:border-primary transition-colors" placeholder="••••••••" />
              </div>
            </div>
          )}
          <button disabled={loading} className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4 active:scale-95 disabled:opacity-50">
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : (
              mode === 'LOGIN' ? 'Đăng nhập' : mode === 'SIGNUP' ? 'Đăng ký tài khoản' : 'Gửi yêu cầu đặt lại mật khẩu'
            )}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-3 text-center">
          {mode === 'LOGIN' ? (
            <>
              <button onClick={() => setMode('SIGNUP')} className="text-sm text-gray-400 hover:text-white transition-colors">Chưa có tài khoản? <span className="text-primary font-bold">Đăng ký ngay</span></button>
              <button onClick={() => setMode('FORGOT')} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Quên mật khẩu?</button>
            </>
          ) : (
            <button onClick={() => setMode('LOGIN')} className="text-sm text-gray-400 hover:text-white transition-colors">Đã có tài khoản? <span className="text-primary font-bold">Đăng nhập</span></button>
          )}
        </div>
      </div>
    </div>
  );
};
