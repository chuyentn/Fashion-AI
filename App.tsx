
import React, { useState, useRef, useEffect } from 'react';
import { 
    supabase, 
    saveProjectToSupabase, 
    fetchUserHistory, 
    fetchUserProfileAndSettings, 
    uploadImageToSupabase, 
    ensureProfileExists,
    fetchAdminResources, 
    saveAdminResource,
    deleteAdminResource,
    saveExtractedResult
} from './services/supabase';
import { AppState, ImageFile, GeneratedImage, HistoryItem, FaceHideType, ModelTier, AspectRatio, TextLanguage, FontStyleKey, UserProfile, AdminResource, DetectedItem } from './types';
import { generateFashionShots, generateExtractedProduct, detectImageObjects, fileToBase64 } from './services/geminiService';

// --- CONSTANTS ---
const ADMIN_EMAIL = 'thonganhkiet125@gmail.com';
const VERSION_HISTORY = [
  { version: '2.8.0', date: '02/03/2025', changes: ['Thêm tùy chọn tạo ảnh tổng hợp (Master Image)', 'Thêm nút lưu thủ công cho ảnh tách nền'] },
  { version: '2.7.0', date: '02/03/2025', changes: ['Nâng cấp Tách Đồ Áo: Tự động phát hiện vật thể & Tách nền trắng'] },
  { version: '2.6.0', date: '02/03/2025', changes: ['Thêm tính năng Tách Đồ Áo (Flat Lay)', 'Cải thiện giao diện Settings'] },
];

const CURRENT_VERSION = VERSION_HISTORY[0].version;

// --- SHARED COMPONENTS ---

const Header = ({ title, backAction }: { title: string, backAction?: () => void }) => (
  <header className="sticky top-0 z-40 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-white/5 p-4 md:p-8 flex items-center gap-4 text-left shadow-sm">
    {backAction && (
      <button onClick={backAction} className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center dark:text-white text-gray-900 transition-colors">
        <span className="material-symbols-outlined">arrow_back</span>
      </button>
    )}
    <h2 className="text-2xl font-black dark:text-white text-gray-900 tracking-tight">{title}</h2>
  </header>
);

const ImageLightbox = ({ src, onClose }: { src: string | null, onClose: () => void }) => {
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

// --- MODAL COMPONENTS ---

const SaveToLibraryModal = ({ isOpen, onClose, image, userId }: { isOpen: boolean, onClose: () => void, image: GeneratedImage | null, userId: string }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<'PRODUCT' | 'REFERENCE'>('PRODUCT');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (image) setName(image.label || 'New Item');
    }, [image]);

    const handleSave = async () => {
        if (!image || !name || !userId) return;
        setLoading(true);
        try {
            // 1. Upload the generated image to 'admin' bucket (acting as resource)
            const publicUrl = await uploadImageToSupabase(image.url, userId, 'admin');
            
            if (publicUrl) {
                // 2. Save to admin_resources
                await saveAdminResource({
                    name: name,
                    description: `Extracted from AI: ${image.label}`,
                    type: type,
                    url: publicUrl
                });
                alert("Đã lưu vào kho tài nguyên!");
                onClose();
            } else {
                alert("Lỗi upload ảnh.");
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi khi lưu.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !image) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-surface-card rounded-[32px] p-6 shadow-2xl animate-[slideUp_0.3s]">
                <h3 className="text-xl font-black mb-4 dark:text-white text-gray-900">Lưu vào Kho Tài Nguyên</h3>
                
                <div className="flex gap-4 mb-4">
                    <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200 dark:border-white/10">
                        <img src={image.url} className="w-full h-full object-contain" alt="Preview" />
                    </div>
                    <div className="flex-1 space-y-3">
                        <div className="space-y-1">
                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tên sản phẩm/mẫu</label>
                             <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-100 dark:bg-white/5 rounded-xl px-3 py-2 text-sm outline-none border border-transparent focus:border-primary dark:text-white" />
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => setType('PRODUCT')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'PRODUCT' ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}>Sản phẩm</button>
                             <button onClick={() => setType('REFERENCE')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'REFERENCE' ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}>Người mẫu</button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Hủy</button>
                    <button disabled={loading || !name} onClick={handleSave} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Lưu ngay'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ResourcePickerModal = ({ type, isOpen, onClose, onSelect, userProfile, onOpenAdmin }: { type: 'REFERENCE' | 'PRODUCT', isOpen: boolean, onClose: () => void, onSelect: (res: AdminResource) => void, userProfile: UserProfile | null, onOpenAdmin: () => void }) => {
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchAdminResources(type).then(data => {
        setResources(data);
        setLoading(false);
      });
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white dark:bg-surface-card rounded-[32px] overflow-hidden flex flex-col h-[80vh] animate-[fadeIn_0.3s]">
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
           <div className="text-left">
              <h3 className="text-xl font-black dark:text-white text-gray-900">Chọn {type === 'REFERENCE' ? 'Ảnh mẫu' : 'Sản phẩm'}</h3>
              <p className="text-xs text-gray-500">Kho tài nguyên chuyên nghiệp có sẵn</p>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center dark:text-white text-gray-900 hover:bg-primary hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
           {loading ? (
             <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-sm text-gray-400">Đang tải tài nguyên...</p>
             </div>
           ) : resources.length > 0 ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {resources.map(res => (
                  <div key={res.id} onClick={() => onSelect(res)} className="group cursor-pointer space-y-2">
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 relative">
                       <img src={res.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={res.name} />
                       <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white text-primary px-3 py-1.5 rounded-full text-xs font-bold shadow-xl">Sử dụng</span>
                       </div>
                    </div>
                    <div className="text-left px-1">
                       <p className="text-sm font-bold dark:text-white text-gray-900 truncate">{res.name}</p>
                       <p className="text-[10px] text-gray-500 truncate">{res.description}</p>
                    </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                <span className="material-symbols-outlined text-6xl text-gray-200 dark:text-white/10">image_search</span>
                <p className="text-gray-500 text-sm">Kho tài nguyên trống.</p>
                {userProfile?.isAdmin && (
                    <button onClick={onOpenAdmin} className="px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-2 mx-auto">
                        <span className="material-symbols-outlined">add_circle</span> Xây dựng kho ngay
                    </button>
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

// --- AUTH COMPONENTS ---

const AuthView = ({ onAuthSuccess }: { onAuthSuccess: (session: any) => void }) => {
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

// --- NAVIGATION & LAYOUT COMPONENTS ---

const Sidebar = ({ active, onNavigate, userProfile, onLogout }: { active: string, onNavigate: (v: any) => void, userProfile: UserProfile, onLogout: () => void }) => {
  const NavItem = ({ id, icon, label }: any) => (
    <button onClick={() => onNavigate(id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${active === id ? 'bg-primary text-white shadow-lg shadow-primary/30 font-bold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 dark:text-gray-400'}`}>
      <span className="material-symbols-outlined">{icon}</span>
      <span className="hidden md:block">{label}</span>
    </button>
  );

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-white dark:bg-surface-card border-r border-gray-200 dark:border-white/5 p-6">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-gradient-to-tr from-primary to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg">
           <span className="material-symbols-outlined">auto_awesome</span>
        </div>
        <h1 className="text-xl font-black dark:text-white text-gray-900 tracking-tighter">FashionStudio</h1>
      </div>
      
      <nav className="flex-1 space-y-2">
         <NavItem id="HOME" icon="home" label="Trang chủ" />
         <NavItem id="CREATE" icon="add_circle" label="Thiết kế mới" />
         <NavItem id="EXTRACT" icon="cut" label="Tách đồ áo" />
         <NavItem id="LIBRARY" icon="collections_bookmark" label="Thư viện" />
         {userProfile.isAdmin && <NavItem id="ADMIN_PANEL" icon="shield_person" label="Quản trị" />}
         <NavItem id="SETTINGS" icon="settings" label="Cài đặt" />
      </nav>

      <div className="pt-6 border-t border-gray-100 dark:border-white/5">
         <div className="flex items-center gap-3 mb-4 px-2">
            <img src={userProfile.avatar} className="w-10 h-10 rounded-full bg-gray-200 object-cover border-2 border-primary" alt="Avatar" />
            <div className="flex-1 overflow-hidden text-left">
               <p className="text-sm font-bold dark:text-white text-gray-900 truncate">{userProfile.name}</p>
               <p className="text-[10px] text-gray-500 truncate">{userProfile.email}</p>
            </div>
         </div>
         <button onClick={onLogout} className="w-full flex items-center gap-3 px-2 py-2 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors text-sm">
            <span className="material-symbols-outlined text-lg">logout</span> Đăng xuất
         </button>
      </div>
    </aside>
  );
};

const BottomNav = ({ active, onNavigate }: { active: string, onNavigate: (v: any) => void }) => {
  const NavItem = ({ id, icon, label }: any) => (
    <button onClick={() => onNavigate(id)} className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${active === id ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
      <span className={`material-symbols-outlined text-2xl ${active === id ? 'font-fill' : ''}`}>{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-surface-card border-t border-gray-200 dark:border-white/5 flex items-center justify-around z-50 pb-safe">
      <NavItem id="HOME" icon="home" label="Home" />
      <NavItem id="EXTRACT" icon="cut" label="Tách áo" />
      <div className="relative -top-6">
         <button onClick={() => onNavigate('CREATE')} className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/30 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-2xl">add</span>
         </button>
      </div>
      <NavItem id="LIBRARY" icon="collections_bookmark" label="Thư viện" />
      <NavItem id="SETTINGS" icon="settings" label="Cài đặt" />
    </div>
  );
};

// --- VIEW COMPONENTS ---

const ExtractGarmentView = ({ onViewImage, userProfile, apiKeySelected, handleOpenSelectKey }: { onViewImage: (url: string) => void, userProfile: UserProfile | null, apiKeySelected: boolean, handleOpenSelectKey: () => Promise<void> }) => {
  const [image, setImage] = useState<ImageFile | null>(null);
  const [productName, setProductName] = useState("");
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  const [quality, setQuality] = useState<'1K' | '2K' | '4K'>('2K');
  const [ratio, setRatio] = useState<AspectRatio>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  
  // New State: Generate Master Image
  const [generateMasterImage, setGenerateMasterImage] = useState(true);

  // Modal State
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [imageToSave, setImageToSave] = useState<GeneratedImage | null>(null);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        try {
            const base64 = await fileToBase64(file);
            const newImage = {
                id: Math.random().toString(),
                file,
                previewUrl: URL.createObjectURL(file),
                base64,
                mimeType: file.type
            };
            setImage(newImage);
            setResults([]);
            setDetectedItems([]);
            setSelectedItems([]);
            
            // Auto trigger analysis
            setIsAnalyzing(true);
            const items = await detectImageObjects(newImage);
            setDetectedItems(items);
            // Select first garment by default
            const firstGarment = items.find(i => i.type === 'GARMENT');
            if(firstGarment) setSelectedItems([firstGarment.id]);
            setIsAnalyzing(false);

        } catch (err) { 
            console.error(err); 
            setIsAnalyzing(false);
        }
    }
  };

  const toggleItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
        setSelectedItems(selectedItems.filter(i => i !== itemId));
    } else {
        if (selectedItems.length < 5) {
            setSelectedItems([...selectedItems, itemId]);
        } else {
            alert("Bạn chỉ có thể chọn tối đa 5 vật thể.");
        }
    }
  };

  const handleGenerate = async () => {
    if (!apiKeySelected) {
      await handleOpenSelectKey();
    }
    if (!image || selectedItems.length === 0) return;
    setIsGenerating(true);
    
    // Filter detected items based on selection
    const itemsToProcess = detectedItems.filter(item => selectedItems.includes(item.id));
    
    // Create placeholders
    const placeholders = itemsToProcess.map((item, i) => ({ 
        id: `loading-${i}`, 
        url: '', 
        isLoading: true,
        label: item.name
    }));

    // Add placeholder for master image if enabled
    const fashionItems = itemsToProcess.filter(i => i.type !== 'BACKGROUND');
    if (generateMasterImage && fashionItems.length > 0) {
        placeholders.push({
            id: `loading-master`,
            url: '',
            isLoading: true,
            label: 'Bộ sưu tập (Flat Lay)'
        });
    }

    setResults(placeholders);

    try {
        const generated = await generateExtractedProduct(
            image, 
            itemsToProcess, 
            quality, 
            ratio,
            generateMasterImage,
            (newImg) => {
             setResults(prev => {
                const updated = [...prev];
                // Find matching placeholder or just update first loading one with same label
                const idx = updated.findIndex(p => p.label === newImg.label && p.isLoading);
                if (idx !== -1) updated[idx] = newImg;
                else {
                    // Fallback for Master image async return
                     const loadingIdx = updated.findIndex(p => p.isLoading);
                     if(loadingIdx !== -1) updated[loadingIdx] = newImg;
                }
                return updated;
             });
        });
        setResults(generated);
    } catch (e: any) {
        if (e.message?.includes('Requested entity was not found')) {
            // We can't easily reset parent state from here without another prop, 
            // but we can at least inform the user.
            alert("Lỗi khóa API (Requested entity was not found). Vui lòng thử lại để chọn lại khóa.");
        } else {
            alert("Lỗi: " + e.message);
        }
        setResults([]);
    } finally {
        setIsGenerating(false);
    }
  };

  const openSaveModal = (img: GeneratedImage) => {
      if (!userProfile?.id) {
          alert("Vui lòng đăng nhập để lưu.");
          return;
      }
      setImageToSave(img);
      setSaveModalOpen(true);
  };

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-background-light dark:bg-background-dark text-left">
        {/* LEFT COLUMN: Input & Settings (30%) */}
        <div className="w-full md:w-1/3 bg-white dark:bg-surface-card border-r border-gray-200 dark:border-white/5 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar">
            <h2 className="text-xl font-black dark:text-white text-gray-900">Tách Đồ Áo</h2>
            
            {/* Upload */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ảnh gốc</label>
                <div onClick={() => document.getElementById('extract-upload')?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group">
                    {image ? (
                        <>
                            <img src={image.previewUrl} className="w-full h-full object-cover" alt="Upload" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white font-bold text-sm">Thay đổi ảnh</span>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-4">
                            <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">upload_file</span>
                            <p className="text-xs text-gray-500 font-bold">Tải ảnh mẫu</p>
                        </div>
                    )}
                    <input id="extract-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
            </div>

            {/* Smart Input */}
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tên sản phẩm (Tùy chọn)</label>
                    <input type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder="VD: Áo sơ mi lụa..." className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary dark:text-white" />
                </div>

                <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phát hiện vật thể</label>
                     {isAnalyzing ? (
                         <div className="flex flex-col items-center justify-center py-6 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                             <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                             <p className="text-[10px] text-gray-500">Đang phân tích ảnh...</p>
                         </div>
                     ) : detectedItems.length > 0 ? (
                         <div className="flex flex-col gap-2">
                             {detectedItems.map(item => (
                                 <button key={item.id} onClick={() => toggleItem(item.id)} className={`p-3 rounded-xl text-left border transition-all flex items-start gap-3 ${selectedItems.includes(item.id) ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'}`}>
                                     <span className="material-symbols-outlined text-lg mt-0.5 shrink-0">
                                         {item.type === 'BACKGROUND' ? 'landscape' : item.type === 'MODEL' ? 'person' : 'checkroom'}
                                     </span>
                                     <div className="flex-1 min-w-0"> {/* min-w-0 prevents flex item from overflowing */}
                                         <p className="text-xs font-bold truncate">{item.name}</p>
                                         <p className="text-[10px] opacity-70 truncate">{item.description}</p>
                                     </div>
                                     <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedItems.includes(item.id) ? 'border-primary bg-primary' : 'border-gray-400'}`}>
                                         {selectedItems.includes(item.id) && <span className="material-symbols-outlined text-[10px] text-white">check</span>}
                                     </div>
                                 </button>
                             ))}
                             <p className="text-[10px] text-right text-gray-400 italic mt-1">Chọn tối đa 5 mục</p>
                         </div>
                     ) : (
                         <div className="p-4 text-center bg-gray-50 dark:bg-white/5 rounded-xl text-xs text-gray-400">
                             Chưa có vật thể nào được phát hiện.
                         </div>
                     )}
                </div>

                {/* Master Image Toggle */}
                {detectedItems.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">collections</span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Tạo ảnh tổng hợp (Master)</span>
                        </div>
                        <div onClick={() => setGenerateMasterImage(!generateMasterImage)} className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${generateMasterImage ? 'bg-primary' : 'bg-gray-300 dark:bg-white/20'}`}>
                             <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${generateMasterImage ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Output Config */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                 <h3 className="font-bold dark:text-white text-gray-900 text-sm">Cấu hình xuất file</h3>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                         <label className="text-[10px] text-gray-500 font-bold">Chất lượng</label>
                         <select value={quality} onChange={(e: any) => setQuality(e.target.value)} className="w-full bg-gray-100 dark:bg-white/5 rounded-lg p-2 text-xs font-bold dark:text-white outline-none">
                             <option value="1K">1K (Basic)</option>
                             <option value="2K">2K (HD)</option>
                             <option value="4K">4K (Ultra)</option>
                         </select>
                     </div>
                     <div className="space-y-1">
                         <label className="text-[10px] text-gray-500 font-bold">Tỷ lệ</label>
                         <select value={ratio} onChange={(e: any) => setRatio(e.target.value)} className="w-full bg-gray-100 dark:bg-white/5 rounded-lg p-2 text-xs font-bold dark:text-white outline-none">
                             <option value="1:1">1:1 (Vuông)</option>
                             <option value="16:9">16:9 (Ngang)</option>
                             <option value="9:16">9:16 (Dọc)</option>
                         </select>
                     </div>
                 </div>
            </div>

            <button disabled={!image || isGenerating || selectedItems.length === 0} onClick={handleGenerate} className="mt-auto w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-all">
                {isGenerating ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <><span className="material-symbols-outlined">auto_fix_high</span> Tách & Tạo ảnh ({selectedItems.length + (generateMasterImage ? 1 : 0)})</>}
            </button>
        </div>

        {/* RIGHT COLUMN: Display Area (70%) */}
        <div className="w-full md:w-2/3 bg-gray-50 dark:bg-black/20 p-4 md:p-8 flex flex-col overflow-y-auto no-scrollbar">
            {results.length > 0 ? (
                <div className={`grid gap-6 ${results.length === 1 ? 'grid-cols-1 h-full' : 'grid-cols-2 md:grid-cols-3 auto-rows-min'}`}>
                    {results.map((img, idx) => (
                        <div key={img.id || idx} className={`bg-white dark:bg-surface-card rounded-3xl overflow-hidden shadow-sm border border-gray-200 dark:border-white/5 relative group flex flex-col ${results.length === 1 ? 'max-h-full' : ''}`}>
                            <div className="flex-1 relative bg-white flex items-center justify-center p-4 min-h-[300px]"> {/* White background forced */}
                                {img.isLoading ? (
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
                                        <p className="text-xs font-bold text-gray-400">Đang tách {img.label}...</p>
                                    </div>
                                ) : (
                                    <img src={img.url} className="w-full h-full object-contain max-h-[70vh]" alt="Result" />
                                )}
                            </div>
                            
                            {!img.isLoading && (
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openSaveModal(img)} className="w-10 h-10 rounded-full bg-white text-gray-900 shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-primary">save</span>
                                    </button>
                                    <button onClick={() => onViewImage(img.url)} className="w-10 h-10 rounded-full bg-white/90 text-gray-900 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"><span className="material-symbols-outlined">zoom_in</span></button>
                                    <a href={img.url} download={`extracted-${idx}.png`} className="w-10 h-10 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"><span className="material-symbols-outlined">download</span></a>
                                </div>
                            )}
                            <div className="p-3 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 shrink-0">
                                <p className="text-xs font-bold dark:text-white text-gray-900 text-center truncate">{img.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <span className="material-symbols-outlined text-8xl text-gray-300 dark:text-white/10 mb-4">checkroom</span>
                    <p className="text-xl font-bold text-gray-400 dark:text-white/30">Chưa có kết quả</p>
                    <p className="text-sm text-gray-400 max-w-xs mt-2">Tải ảnh lên, chọn vật thể và nhấn nút tạo để xem kết quả tách đồ.</p>
                </div>
            )}
        </div>

        {/* SAVE TO LIBRARY MODAL */}
        <SaveToLibraryModal isOpen={saveModalOpen} onClose={() => setSaveModalOpen(false)} image={imageToSave} userId={userProfile?.id || ''} />
    </div>
  );
};

const HomeView = ({ onStart, history, onOpenHistory, userProfile, onNavigate }: { onStart: () => void, history: HistoryItem[], onOpenHistory: (item: HistoryItem) => void, userProfile: UserProfile, onNavigate: (v: any) => void }) => {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-32 text-left">
      <Header title={`Xin chào, ${userProfile.name?.split(' ')[0] || 'Designer'}!`} />
      <div className="p-4 md:p-8 space-y-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-primary via-purple-600 to-pink-500 p-8 md:p-12 text-white shadow-2xl shadow-primary/30">
           <div className="relative z-10 max-w-xl">
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-widest mb-4 border border-white/20">AI Fashion Studio 2.8</span>
              <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Biến ý tưởng thành <br/>hiện thực thời trang.</h2>
              <p className="text-lg text-white/80 mb-8 max-w-md">Tạo ảnh người mẫu mặc sản phẩm của bạn với chất lượng studio chỉ trong vài giây.</p>
              <div className="flex gap-3">
                  <button onClick={onStart} className="px-8 py-4 bg-white text-primary font-bold rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                     <span className="material-symbols-outlined">add_a_photo</span> Bắt đầu thiết kế
                  </button>
                  <button onClick={() => onNavigate('EXTRACT')} className="px-6 py-4 bg-white/10 backdrop-blur-md text-white font-bold rounded-2xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2">
                     <span className="material-symbols-outlined">cut</span> Tách Đồ Áo
                  </button>
              </div>
           </div>
           {/* Abstract shapes */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-4">
           <div onClick={() => onNavigate('LIBRARY')} className="bg-white dark:bg-surface-card p-6 rounded-[32px] border border-gray-100 dark:border-white/5 cursor-pointer hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <span className="material-symbols-outlined">collections_bookmark</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Thư viện mẫu</h3>
              <p className="text-xs text-gray-500 mt-1">Quản lý Models & Products</p>
           </div>
           <div onClick={() => onNavigate('LIBRARY')} className="bg-white dark:bg-surface-card p-6 rounded-[32px] border border-gray-100 dark:border-white/5 cursor-pointer hover:shadow-lg transition-all group">
               <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <span className="material-symbols-outlined">history</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Lịch sử</h3>
              <p className="text-xs text-gray-500 mt-1">Xem lại các thiết kế cũ</p>
           </div>
        </section>

        {/* Recent History */}
        <section>
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black dark:text-white text-gray-900">Thiết kế gần đây</h3>
              <button onClick={() => onNavigate('LIBRARY')} className="text-primary text-sm font-bold">Xem tất cả</button>
           </div>
           {history.length > 0 ? (
             <div className="flex gap-4 overflow-x-auto no-scrollbar pb-8">
                {history.slice(0, 5).map(item => (
                   <div key={item.id} onClick={() => onOpenHistory(item)} className="flex-none w-64 group cursor-pointer">
                      <div className="aspect-[4/3] rounded-[24px] overflow-hidden mb-3 relative">
                         <img src={item.images[0]?.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="History" />
                         <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="material-symbols-outlined text-white">visibility</span>
                         </div>
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white truncate px-1">{item.prompt || "Fashion Set"}</h4>
                      <p className="text-xs text-gray-500 px-1">{new Date(item.timestamp).toLocaleDateString('vi-VN')}</p>
                   </div>
                ))}
             </div>
           ) : (
             <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-[32px] border border-dashed border-gray-200 dark:border-white/10">
                <p className="text-gray-400 font-medium">Chưa có thiết kế nào.</p>
             </div>
           )}
        </section>
      </div>
    </div>
  );
};

const ResultsView = ({ images, onBack, onHome, onViewImage, onRemix, currentProject }: { images: GeneratedImage[], onBack: () => void, onHome: () => void, onViewImage: (url: string) => void, onRemix: (item: HistoryItem) => void, currentProject?: HistoryItem }) => {
  const downloadImage = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `fashion-studio-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark text-left">
      <header className="flex items-center justify-between p-4 md:p-6 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-200 dark:border-white/5">
        <button onClick={onHome} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-900 dark:text-white">
          <span className="material-symbols-outlined">home</span>
        </button>
        <div className="flex gap-2">
           {currentProject && (
             <button onClick={() => onRemix(currentProject)} className="px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl text-xs flex items-center gap-2">
               <span className="material-symbols-outlined text-sm">edit</span> Remix
             </button>
           )}
           <button onClick={onBack} className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs shadow-lg shadow-primary/20">
             Tạo thêm
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {images.map((img, idx) => (
              <div key={img.id || idx} className="group relative rounded-[32px] overflow-hidden bg-gray-100 dark:bg-white/5 aspect-[3/4] shadow-sm hover:shadow-2xl transition-all duration-500">
                 {img.isLoading ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                      <p className="text-xs font-bold text-gray-400 animate-pulse">Đang thiết kế...</p>
                   </div>
                 ) : (
                   <>
                     <img src={img.url} className="w-full h-full object-cover" alt="Generated" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                        <div className="flex gap-3 justify-center">
                           <button onClick={() => onViewImage(img.url)} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-black transition-all">
                              <span className="material-symbols-outlined">zoom_in</span>
                           </button>
                           <button onClick={() => downloadImage(img.url, img.id)} className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                              <span className="material-symbols-outlined">download</span>
                           </button>
                        </div>
                     </div>
                   </>
                 )}
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

const AdminPanelView = ({ onBack, userId, onViewImage }: { onBack: () => void, userId: string, onViewImage: (url: string) => void }) => {
    const [resources, setResources] = useState<AdminResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    
    // New Resource State (including File object for delayed upload)
    const [newRes, setNewRes] = useState({ 
        name: '', 
        description: '', 
        type: 'REFERENCE' as 'REFERENCE' | 'PRODUCT', 
        file: null as File | null, 
        previewUrl: '' 
    });
    
    const [saving, setSaving] = useState(false);

    const refresh = () => {
        setLoading(true);
        fetchAdminResources().then(data => {
            setResources(data);
            setLoading(false);
        });
    };

    useEffect(() => { refresh(); }, []);

    // 1. Handle File Selection (Local Preview Only)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setNewRes({ ...newRes, file: file, previewUrl: URL.createObjectURL(file) });
    };

    // 2. Handle Paste (Local Preview Only)
    const handlePaste = async () => {
        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                if (item.types.some(t => t.startsWith('image/'))) {
                    const blob = await item.getType(item.types.find(t => t.startsWith('image/'))!);
                    const file = new File([blob], "admin_res.png", { type: blob.type });
                    setNewRes({ ...newRes, file: file, previewUrl: URL.createObjectURL(file) });
                }
            }
        } catch (err) { alert("Dán ảnh thất bại hoặc trình duyệt không hỗ trợ."); }
    };

    // 3. Handle Save (Upload -> DB Insert)
    const handleSave = async () => {
        if (!newRes.file || !newRes.name) return;
        setSaving(true);
        try {
            // Upload to Storage
            const publicUrl = await uploadImageToSupabase(newRes.file, userId, 'admin');
            if (publicUrl) {
                // Save to DB
                await saveAdminResource({
                    name: newRes.name,
                    description: newRes.description,
                    type: newRes.type,
                    url: publicUrl
                });
                setShowAddForm(false);
                setNewRes({ name: '', description: '', type: 'REFERENCE', file: null, previewUrl: '' });
                refresh();
            } else {
                alert("Upload ảnh thất bại!");
            }
        } catch(err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Xóa tài nguyên này?")) {
            await deleteAdminResource(id);
            refresh();
        }
    };

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 text-left">
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-white/5 p-4 md:p-8 flex items-center justify-between">
                <div className="flex items-center gap-4 text-left">
                    <button onClick={onBack} className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center dark:text-white text-gray-900">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h2 className="text-2xl font-black dark:text-white text-gray-900">Quản trị Tài nguyên</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Admin Control Panel</p>
                    </div>
                </div>
                <button onClick={() => setShowAddForm(true)} className="px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30 flex items-center gap-2 hover:scale-105 transition-all">
                    <span className="material-symbols-outlined">add_circle</span> Thêm mới
                </button>
            </header>

            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {resources.map(res => (
                        <div key={res.id} className="group bg-white dark:bg-surface-card rounded-[32px] overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all">
                            <div className="aspect-[3/4] relative cursor-pointer" onClick={() => onViewImage(res.url)}>
                                <img src={res.url} className="w-full h-full object-cover" alt={res.name} />
                                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg"><span className="material-symbols-outlined text-sm">delete</span></button>
                                </div>
                                <div className="absolute top-2 left-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white ${res.type === 'REFERENCE' ? 'bg-indigo-500' : 'bg-pink-500'}`}>
                                        {res.type === 'REFERENCE' ? 'Model' : 'Product'}
                                    </span>
                                </div>
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-3xl">zoom_in</span>
                                </div>
                            </div>
                            <div className="p-4 text-left">
                                <p className="font-bold dark:text-white text-gray-900 truncate text-sm">{res.name}</p>
                                <p className="text-[10px] text-gray-500 truncate">{res.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showAddForm && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-surface-card rounded-[40px] p-8 shadow-2xl animate-[slideDown_0.3s]">
                        <h3 className="text-xl font-black mb-6 dark:text-white text-gray-900">Thêm tài nguyên mới</h3>
                        <div className="space-y-4">
                            <div className="aspect-[4/3] rounded-3xl border-2 border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 overflow-hidden flex flex-col items-center justify-center gap-3 relative cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors" onClick={() => document.getElementById('admin-upload')?.click()}>
                                {newRes.previewUrl ? (
                                    <img src={newRes.previewUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-4xl text-gray-300">upload</span>
                                        <p className="text-xs font-bold text-gray-500">Dán hoặc Click để tải ảnh</p>
                                    </>
                                )}
                                <input id="admin-upload" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handlePaste} className="flex-1 py-2.5 bg-gray-100 dark:bg-white/5 rounded-xl text-xs font-bold dark:text-white text-gray-900 border border-gray-200 dark:border-white/5">Dán từ Clipboard</button>
                            </div>
                            <input type="text" placeholder="Tên tài nguyên" value={newRes.name} onChange={e => setNewRes({...newRes, name: e.target.value})} className="w-full bg-gray-100 dark:bg-white/5 rounded-2xl px-5 py-3.5 outline-none focus:border-primary border border-transparent dark:text-white" />
                            <textarea placeholder="Mô tả..." value={newRes.description} onChange={e => setNewRes({...newRes, description: e.target.value})} className="w-full bg-gray-100 dark:bg-white/5 rounded-2xl px-5 py-3.5 outline-none focus:border-primary border border-transparent dark:text-white resize-none" rows={2} />
                            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl">
                                <button onClick={() => setNewRes({...newRes, type: 'REFERENCE'})} className={`py-2.5 rounded-xl text-xs font-bold transition-all ${newRes.type === 'REFERENCE' ? 'bg-primary text-white shadow-lg' : 'text-gray-500'}`}>Ảnh mẫu</button>
                                <button onClick={() => setNewRes({...newRes, type: 'PRODUCT'})} className={`py-2.5 rounded-xl text-xs font-bold transition-all ${newRes.type === 'PRODUCT' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-500'}`}>Sản phẩm</button>
                            </div>
                            <button disabled={!newRes.previewUrl || !newRes.name || saving} onClick={handleSave} className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30 active:scale-95 disabled:opacity-50 mt-4 transition-all">
                                {saving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Lưu tài nguyên'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- LIBRARY VIEW ---
const LibraryView = ({ history, onOpenHistory, userProfile, onOpenAdmin, onViewImage }: { history: HistoryItem[], onOpenHistory: (item: HistoryItem) => void, userProfile: UserProfile | null, onOpenAdmin: () => void, onViewImage: (url: string) => void }) => {
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAdminResources(undefined, userProfile?.id).then(data => {
      setResources(data);
      setLoading(false);
    });
  }, [userProfile?.id]);

  const models = resources.filter(r => r.type === 'REFERENCE');
  const products = resources.filter(r => r.type === 'PRODUCT');

  const ResourceGrid = ({ items, title, emptyMsg, icon }: any) => (
    <section className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="text-xl font-black dark:text-white text-gray-900 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">{icon}</span>
                {title} ({items.length})
            </h3>
        </div>
        {items.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                {items.map((res: any) => (
                    <div key={res.id} className="flex-none w-40 space-y-2 group cursor-pointer" onClick={() => onViewImage(res.url)}>
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 relative group-hover:shadow-xl transition-all">
                            <img src={res.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={res.name} />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-2xl">zoom_in</span>
                            </div>
                        </div>
                        <p className="text-[11px] font-bold dark:text-white text-gray-900 truncate px-1">{res.name}</p>
                    </div>
                ))}
            </div>
        ) : (
            <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-10 text-center border border-dashed border-gray-200 dark:border-white/10">
                <p className="text-xs text-gray-400 font-bold">{emptyMsg}</p>
            </div>
        )}
    </section>
  );

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-32 text-left">
      <Header title="Thư viện" />
      <div className="p-4 md:p-8 space-y-12">
        
        {/* Banner to Create New if Admin */}
        {userProfile?.isAdmin && (
            <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10 flex items-center justify-between">
                <div>
                    <h4 className="font-black dark:text-white text-gray-900">Quản trị kho tài nguyên</h4>
                    <p className="text-xs text-gray-500 mt-1">Thêm mẫu ảnh hoặc sản phẩm mới vào kho.</p>
                </div>
                <button onClick={onOpenAdmin} className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform">Quản lý kho</button>
            </div>
        )}

        <ResourceGrid items={models} title="Kho Ảnh Mẫu (Models)" emptyMsg="Chưa có ảnh mẫu." icon="face" />
        <ResourceGrid items={products} title="Kho Sản Phẩm (Products)" emptyMsg="Chưa có sản phẩm." icon="inventory_2" />

        <section className="space-y-6 pt-10 border-t border-gray-100 dark:border-white/5">
           <h3 className="text-xl font-black dark:text-white text-gray-900 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400">history</span>
                Lịch sử thiết kế
           </h3>
           {history.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map(item => (
                  <div key={item.id} onClick={() => onOpenHistory(item)} className="group bg-white dark:bg-surface-card rounded-[40px] p-4 border border-gray-100 dark:border-white/5 cursor-pointer hover:shadow-xl transition-all">
                    <div className="aspect-video rounded-[32px] overflow-hidden mb-4 relative">
                      <img src={item.images[0]?.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Preview" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                        <span className="text-white text-[10px] font-bold">{item.images.length} ảnh đã tạo</span>
                      </div>
                    </div>
                    <h4 className="font-bold truncate px-2 dark:text-white text-gray-900">{item.prompt || "Fashion Set"}</h4>
                    <p className="text-[10px] text-gray-500 px-2 mt-1 uppercase font-bold tracking-widest">{new Date(item.timestamp).toLocaleDateString('vi-VN')}</p>
                  </div>
                ))}
             </div>
           ) : (
             <div className="bg-gray-50 dark:bg-white/5 rounded-[40px] p-12 text-center border-2 border-dashed border-gray-200 dark:border-white/10">
                <p className="text-gray-500 font-bold">Chưa có lịch sử.</p>
             </div>
           )}
        </section>
      </div>
    </div>
  );
};

const CreateShotView = ({ onBack, state, updateState, onGenerate, onOpenAdmin }: { onBack: () => void, state: AppState, updateState: (k: Partial<AppState>) => void, onGenerate: () => void, onOpenAdmin: () => void }) => {
  const refInputRef = useRef<HTMLInputElement>(null);
  const prodInputRef = useRef<HTMLInputElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [pickerOpen, setPickerOpen] = useState<{ type: 'REFERENCE' | 'PRODUCT', isOpen: boolean }>({ type: 'REFERENCE', isOpen: false });
  
  const processFiles = async (fileList: File[], type: 'ref' | 'prod') => {
    const processed = await Promise.all(fileList.map(async (file) => {
       try {
        const base64 = await fileToBase64(file);
        return {
          id: Math.random().toString(36).substr(2, 9),
          file,
          previewUrl: URL.createObjectURL(file),
          base64,
          mimeType: file.type
        } as ImageFile;
      } catch (err) { return null; }
    }));
    const validFiles = processed.filter(Boolean) as ImageFile[];
    if (validFiles.length === 0) return;
    if (type === 'ref') updateState({ referenceImages: [...state.referenceImages, ...validFiles].slice(0, 5) });
    else updateState({ productImages: [...state.productImages, ...validFiles] });
  };

  const handleLibrarySelect = async (res: AdminResource) => {
    try {
        const response = await fetch(res.url);
        const blob = await response.blob();
        const base64Full = await fileToBase64(new File([blob], "res.png", { type: blob.type }));
        const newFile: ImageFile = {
            id: `lib-${res.id}`,
            file: null, 
            previewUrl: res.url,
            base64: base64Full,
            mimeType: blob.type
        };
        if (pickerOpen.type === 'REFERENCE') updateState({ referenceImages: [...state.referenceImages, newFile].slice(0, 5) });
        else updateState({ productImages: [...state.productImages, newFile] });
        setPickerOpen({ ...pickerOpen, isOpen: false });
    } catch (err) { alert("Lỗi tải ảnh."); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ref' | 'prod') => {
    if (e.target.files) processFiles(Array.from(e.target.files), type);
  };

  const isReady = state.referenceImages.length > 0 && state.productImages.length > 0;

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark text-left">
      <Header title="Thiết kế mới" backAction={onBack} />
      <div className="flex-1 overflow-y-auto px-4 pb-36 md:p-8 w-full max-w-4xl mx-auto space-y-10 mt-6 no-scrollbar">
        
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 dark:text-white font-black flex items-center gap-2">
               <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm">1</span>
               Ảnh mẫu tham khảo ({state.referenceImages.length}/5)
            </h3>
            <div className="flex gap-2">
                <button onClick={() => setPickerOpen({ type: 'REFERENCE', isOpen: true })} className="text-primary bg-primary/10 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">auto_stories</span> Mở Kho Ảnh Mẫu
                </button>
                <button onClick={() => refInputRef.current?.click()} className="text-primary text-sm font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-lg">add_circle</span> Tải lên
                </button>
            </div>
          </div>
          {state.referenceImages.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
               {state.referenceImages.map((img) => (
                <div key={img.id} className="relative aspect-[3/4] rounded-3xl overflow-hidden group bg-white dark:bg-surface-card border border-white/5 shadow-lg">
                   <img src={img.previewUrl} className="w-full h-full object-cover" alt="Ref" />
                   <button onClick={() => updateState({ referenceImages: state.referenceImages.filter(i => i.id !== img.id) })} className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                      <span className="material-symbols-outlined text-sm">close</span>
                   </button>
                </div>
               ))}
               {state.referenceImages.length < 5 && (
                 <div onClick={() => refInputRef.current?.click()} className="aspect-[3/4] rounded-3xl border-2 border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-gray-400">add</span>
                 </div>
               )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center aspect-[21/9] rounded-[40px] border-2 border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer relative" onClick={() => refInputRef.current?.click()}>
              <span className="material-symbols-outlined text-4xl text-primary mb-3">add_photo_alternate</span>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Tải lên ảnh mẫu từ Pinterest / Instagram</p>
              <div className="mt-4 flex gap-3">
                 <button onClick={(e) => { e.stopPropagation(); setPickerOpen({ type: 'REFERENCE', isOpen: true }); }} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2"><span className="material-symbols-outlined text-sm">collections</span> Chọn từ Kho tài nguyên</button>
              </div>
            </div>
          )}
          <input type="file" ref={refInputRef} onChange={(e) => handleFileChange(e, 'ref')} className="hidden" accept="image/*" multiple />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-gray-900 dark:text-white font-black flex items-center gap-2">
               <span className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm">2</span>
               Sản phẩm của bạn ({state.productImages.length})
             </h3>
             <div className="flex gap-2">
                 <button onClick={() => setPickerOpen({ type: 'PRODUCT', isOpen: true })} className="text-pink-500 bg-pink-500/10 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">inventory_2</span> Kho Sản Phẩm
                 </button>
                 <button onClick={() => prodInputRef.current?.click()} className="text-primary text-sm font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-lg">add_circle</span> Tải lên
                 </button>
             </div>
          </div>
          {state.productImages.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {state.productImages.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-3xl overflow-hidden group bg-white dark:bg-surface-card border border-white/5 shadow-lg">
                   <img src={img.previewUrl} className="w-full h-full object-cover" alt="Prod" />
                   <button onClick={() => updateState({ productImages: state.productImages.filter(i => i.id !== img.id) })} className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                      <span className="material-symbols-outlined text-sm">close</span>
                   </button>
                </div>
              ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center aspect-[21/9] rounded-[40px] border-2 border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer" onClick={() => prodInputRef.current?.click()}>
                <span className="material-symbols-outlined text-4xl text-primary mb-3">checkroom</span>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Thêm ảnh sản phẩm</p>
                <div className="mt-4 flex gap-3">
                   <button onClick={(e) => { e.stopPropagation(); setPickerOpen({ type: 'PRODUCT', isOpen: true }); }} className="px-4 py-2 bg-pink-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-pink-500/20 flex items-center gap-2"><span className="material-symbols-outlined text-sm">inventory_2</span> Chọn từ Kho Sản phẩm</button>
                </div>
             </div>
          )}
          <input type="file" ref={prodInputRef} onChange={(e) => handleFileChange(e, 'prod')} className="hidden" accept="image/*" multiple />
        </section>

        <div onClick={() => setShowSettings(true)} className="flex items-center justify-between p-6 rounded-3xl bg-white dark:bg-surface-card border border-gray-200 dark:border-white/5 cursor-pointer hover:shadow-xl transition-all shadow-sm">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
               <span className="material-symbols-outlined">tune</span>
             </div>
             <div className="text-left">
               <p className="text-gray-900 dark:text-white text-sm font-bold">Cài đặt nâng cao</p>
               <p className="text-xs text-gray-500">{state.modelTier} • {state.resolution} • {state.outputCount} ảnh/sp</p>
             </div>
           </div>
           <span className="material-symbols-outlined text-gray-400">chevron_right</span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-background-dark/95 backdrop-blur-xl border-t border-gray-200 dark:border-white/5 z-30 md:static md:max-w-4xl md:mx-auto md:bg-transparent md:border-none">
        <button disabled={!isReady} onClick={onGenerate} className={`w-full h-16 rounded-[24px] flex items-center justify-center gap-3 font-black text-lg transition-all shadow-2xl ${isReady ? 'bg-primary text-white hover:bg-primary-hover shadow-primary/40' : 'bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed'}`}>
          <span className="material-symbols-outlined text-2xl">auto_awesome</span>
          {isReady ? `Tạo ${state.outputCount * state.productImages.length} thiết kế` : 'Vui lòng chọn đủ ảnh'}
        </button>
      </div>

      <ResourcePickerModal type={pickerOpen.type} isOpen={pickerOpen.isOpen} onClose={() => setPickerOpen({ ...pickerOpen, isOpen: false })} onSelect={handleLibrarySelect} userProfile={state.userProfile} onOpenAdmin={onOpenAdmin} />

      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-surface-card rounded-t-[40px] sm:rounded-[40px] p-6 sm:p-8 max-h-[85vh] overflow-y-auto animate-[slideUp_0.3s_ease-out] shadow-2xl no-scrollbar text-left">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Cài đặt nâng cao</h3>
                <button onClick={() => setShowSettings(false)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center dark:text-white text-gray-900"><span className="material-symbols-outlined">close</span></button>
             </div>
             <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-3xl border border-gray-100 dark:border-white/5">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Chất lượng AI (Model Tier)</p>
                   <div className="grid grid-cols-2 gap-2">
                       {['BASIC', 'PRO'].map((tier) => (
                          <button key={tier} onClick={() => updateState({ modelTier: tier as ModelTier })} className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${state.modelTier === tier ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-white/5 border-transparent text-gray-500'}`}>
                             <span className="text-xs font-black">{tier}</span>
                             <span className="text-[9px] opacity-70">{tier === 'BASIC' ? 'Nhanh & Miễn phí' : 'Chất lượng cao (Cần Key)'}</span>
                          </button>
                       ))}
                   </div>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-3xl border border-gray-100 dark:border-white/5">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center"><span className="material-symbols-outlined">face_retouching_off</span></div>
                         <div><p className="font-bold text-gray-900 dark:text-white text-sm">Che mặt người mẫu</p><p className="text-[10px] text-gray-500">Tự động ẩn khuôn mặt</p></div>
                      </div>
                      <div onClick={() => updateState({ faceHideEnabled: !state.faceHideEnabled })} className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${state.faceHideEnabled ? 'bg-pink-500' : 'bg-gray-300 dark:bg-white/20'}`}>
                         <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${state.faceHideEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </div>
                   </div>
                   {state.faceHideEnabled && (
                      <div className="space-y-2 animate-[fadeIn_0.2s]">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chọn kiểu che mặt</p>
                         <div className="grid grid-cols-2 gap-2">
                             {[{ id: 'PHONE_SELFIE', icon: 'smartphone', label: 'Selfie ĐT' }, { id: 'BACK_TURNED', icon: 'person', label: 'Quay lưng' }, { id: 'PROP_OBSCURED', icon: 'back_hand', label: 'Đồ vật/Tay' }, { id: 'CROP_FACE', icon: 'crop', label: 'Cắt mặt' }].map((opt) => (
                                <button key={opt.id} onClick={() => updateState({ faceHideType: opt.id as FaceHideType })} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${state.faceHideType === opt.id ? 'bg-pink-500/10 border-pink-500 text-pink-500' : 'bg-white dark:bg-white/5 border-transparent text-gray-500'}`}>
                                   <span className="material-symbols-outlined text-lg">{opt.icon}</span><span className="text-xs font-bold">{opt.label}</span>
                                </button>
                             ))}
                         </div>
                      </div>
                   )}
                </div>
                {/* Other settings remain unchanged */}
                <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2 block">Chèn chữ (Text Overlay)</label>
                   <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl space-y-3">
                      <input type="text" value={state.overlayText} onChange={e => updateState({ overlayText: e.target.value })} placeholder="Nhập chữ..." className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none dark:text-white" maxLength={50} />
                   </div>
                </div>
                <button onClick={() => setShowSettings(false)} className="w-full h-14 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">Áp dụng</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const App = () => {
  const [state, setState] = useState<AppState>({
    view: 'AUTH', theme: 'dark', referenceImages: [], productImages: [], prompt: '', outputCount: 2, resolution: '1K', aspectRatio: '1:1', modelTier: 'BASIC', 
    useAnalysisMode: false, faceHideEnabled: false, faceHideType: 'PHONE_SELFIE', overlayText: '', textLanguage: 'English', fontStyle: 'AUTO', generatedImages: [], history: [], userProfile: null, session: null
  });

  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [apiKeySelected, setApiKeySelected] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleOpenSelectKey = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setApiKeySelected(true); // Assume success per guidelines
    }
  };

  useEffect(() => {
    state.theme === 'dark' ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
  }, [state.theme]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) handleAuthSuccess(session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) handleAuthSuccess(session); else setState(prev => ({ ...prev, view: 'AUTH', session: null, userProfile: null }));
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = async (session: any) => {
    const user = session.user;
    const name = user.user_metadata?.full_name || user.user_metadata?.name;
    const isAdmin = user.email === ADMIN_EMAIL;
    await ensureProfileExists(user.id, user.email, name);
    const profile = await fetchUserProfileAndSettings(session.user.id);
    const prefs = profile?.preferences || {};
    const history = await fetchUserHistory(session.user.id);

    setState(prev => ({
      ...prev, ...prefs, session, history,
      userProfile: {
        id: session.user.id, name: profile?.full_name || name || session.user.email.split('@')[0], email: session.user.email, isAdmin,
        avatar: profile?.avatar_url || session.user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`
      },
      view: prev.view === 'AUTH' ? 'HOME' : prev.view
    }));
  };

  const updateState = (updates: Partial<AppState>) => setState(prev => ({ ...prev, ...updates }));

  const handleGenerate = async () => {
    if (state.modelTier === 'PRO' && !apiKeySelected) {
      await handleOpenSelectKey();
    }
    const total = state.productImages.length * state.outputCount;
    const placeholders = Array.from({ length: total }).map((_, i) => ({ id: `loading-${i}`, url: '', isLoading: true }));
    updateState({ view: 'RESULTS', generatedImages: placeholders });
    try {
      const finalImages = await generateFashionShots(
         state.referenceImages, state.productImages, state.prompt, state.outputCount, state.resolution, state.aspectRatio, state.modelTier,
         state.useAnalysisMode, state.faceHideEnabled, state.faceHideType, state.overlayText, state.textLanguage, state.fontStyle,
         (newImage) => {
            setState(p => {
                const imgs = [...p.generatedImages];
                const idx = imgs.findIndex(i => i.isLoading);
                if (idx !== -1) imgs[idx] = newImage;
                return { ...p, generatedImages: imgs };
            });
         }
      );
      const localItem: HistoryItem = { id: `temp-${Date.now()}`, timestamp: Date.now(), prompt: state.prompt, images: finalImages, referencePreviews: state.referenceImages.map(r => r.previewUrl), productPreviews: state.productImages.map(p => p.previewUrl), settings: { modelTier: state.modelTier, outputCount: state.outputCount, resolution: state.resolution, aspectRatio: state.aspectRatio, useAnalysisMode: state.useAnalysisMode, faceHideEnabled: state.faceHideEnabled, faceHideType: state.faceHideType, overlayText: state.overlayText, textLanguage: state.textLanguage, fontStyle: state.fontStyle } };
      setState(p => ({ ...p, generatedImages: finalImages, activeHistoryItem: localItem, history: [localItem, ...p.history] }));
      if (state.session?.user?.id) {
          saveProjectToSupabase(state.session.user.id, state.session.user.email, state.prompt, localItem.settings, state.referenceImages, state.productImages, finalImages).then((savedItem) => {
              if (savedItem) setState(p => ({ ...p, history: p.history.map(h => h.id === localItem.id ? savedItem : h) }));
          });
      }
    } catch (error: any) {
      if (error.message?.includes('Requested entity was not found')) {
        setApiKeySelected(false);
        alert("Lỗi khóa API (Requested entity was not found). Vui lòng chọn lại khóa API.");
      } else {
        alert("Lỗi AI: " + error.message);
      }
      updateState({ view: 'CREATE' });
    }
  };

  const handleOpenHistory = (item: HistoryItem) => updateState({ view: 'RESULTS', generatedImages: item.images, activeHistoryItem: item });

  if (state.view === 'AUTH') return <AuthView onAuthSuccess={handleAuthSuccess} />;

  return (
    <div className="flex h-screen overflow-hidden font-sans">
       <Sidebar active={state.view} onNavigate={(v: any) => updateState({ view: v })} userProfile={state.userProfile!} onLogout={() => supabase.auth.signOut()} />
       <main className="flex-1 relative overflow-hidden flex flex-col">
          {state.view === 'HOME' && <HomeView onStart={() => updateState({ view: 'CREATE' })} history={state.history} onOpenHistory={handleOpenHistory} userProfile={state.userProfile!} onNavigate={(v: any) => updateState({ view: v })} />}
          {state.view === 'CREATE' && <CreateShotView onBack={() => updateState({ view: 'HOME' })} state={state} updateState={updateState} onGenerate={handleGenerate} onOpenAdmin={() => updateState({ view: 'ADMIN_PANEL' })} />}
          {state.view === 'EXTRACT' && <ExtractGarmentView onViewImage={setZoomImage} userProfile={state.userProfile} apiKeySelected={apiKeySelected} handleOpenSelectKey={handleOpenSelectKey} />}
          {state.view === 'RESULTS' && <ResultsView images={state.generatedImages} onBack={() => updateState({ view: 'CREATE' })} onHome={() => updateState({ view: 'HOME' })} onViewImage={setZoomImage} onRemix={item => updateState({ ...item.settings, prompt: item.prompt, view: 'CREATE', resolution: item.settings.resolution })} currentProject={state.activeHistoryItem} />}
          {state.view === 'LIBRARY' && <LibraryView history={state.history} onOpenHistory={handleOpenHistory} userProfile={state.userProfile} onOpenAdmin={() => updateState({ view: 'ADMIN_PANEL' })} onViewImage={setZoomImage} />}
          {state.view === 'ADMIN_PANEL' && <AdminPanelView onBack={() => updateState({ view: 'HOME' })} userId={state.userProfile?.id || ''} onViewImage={setZoomImage} />}
          {state.view === 'SETTINGS' && (
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <Header title="Cài đặt" />
              <div className="p-8 max-w-2xl mx-auto space-y-6 pb-24 text-left">
                {/* Settings Content... */}
                <div className="bg-white dark:bg-surface-card rounded-[32px] p-8 border border-gray-200 dark:border-white/5 shadow-sm">
                  <h3 className="font-bold mb-6 text-lg dark:text-white text-gray-900">Hồ sơ của bạn</h3>
                  {/* ... User Profile Info ... */}
                  <div className="flex items-center gap-6 mb-8">
                    <img src={state.userProfile?.avatar} className="w-24 h-24 rounded-full border-4 border-primary shadow-lg object-cover" alt="Avatar" />
                    <div className="flex-1 space-y-1">
                      <p className="font-bold text-2xl dark:text-white text-gray-900">{state.userProfile?.name} {state.userProfile?.isAdmin && <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full ml-2">ADMIN</span>}</p>
                      <p className="text-sm text-gray-500 font-medium">{state.userProfile?.email}</p>
                    </div>
                  </div>
                  {state.userProfile?.isAdmin && (
                    <button onClick={() => updateState({ view: 'ADMIN_PANEL' })} className="w-full py-4 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 font-bold transition-all mb-3 flex items-center justify-center gap-2">
                       <span className="material-symbols-outlined">shield_person</span> Quản trị Tài nguyên
                    </button>
                  )}
                  <button onClick={() => supabase.auth.signOut()} className="w-full py-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 font-bold transition-colors flex items-center justify-center gap-2"><span className="material-symbols-outlined">logout</span> Đăng xuất</button>
                </div>
                {/* Theme Toggle */}
                <div className="bg-white dark:bg-surface-card rounded-[32px] p-8 border border-gray-200 dark:border-white/5 shadow-sm flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><span className="material-symbols-outlined text-2xl">dark_mode</span></div>
                      <div><p className="font-bold text-lg dark:text-white text-gray-900">Giao diện tối</p><p className="text-sm text-gray-500">Chuyển đổi giao diện sáng/tối</p></div>
                   </div>
                   <button onClick={() => updateState({ theme: state.theme === 'dark' ? 'light' : 'dark' })} className={`w-16 h-9 rounded-full relative transition-colors ${state.theme === 'dark' ? 'bg-primary' : 'bg-gray-300'}`}><div className={`absolute top-1 left-1 w-7 h-7 bg-white rounded-full shadow-sm transition-transform ${state.theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`}></div></button>
                </div>
                <div className="text-center pb-4"><button onClick={() => setShowVersionModal(true)} className="text-gray-400 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"><span>Phiên bản {CURRENT_VERSION}</span><span className="material-symbols-outlined text-sm">info</span></button></div>
              </div>
            </div>
          )}
       </main>
       <BottomNav active={state.view} onNavigate={(v: any) => updateState({ view: v })} />
       <ImageLightbox src={zoomImage} onClose={() => setZoomImage(null)} />
    </div>
  );
};

export default App;
