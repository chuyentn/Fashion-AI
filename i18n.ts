import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// EN translations
const en = {
  translation: {
    // General
    "back": "Back",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "loading": "Loading...",
    "success": "Success",
    "error": "Error",
    "download": "Download",
    "settings": "Settings",
    "library": "Library",
    "history": "History",
    
    // Sidebar
    "menu.dashboard": "Dashboard",
    "menu.create": "Create Banner",
    "menu.video": "Video Studio",
    "menu.extract": "Extract Garment",
    "menu.library": "Library & History",
    "menu.admin": "Admin Panel",
    "menu.settings": "Settings",
    "menu.collapse": "Collapse",

    // Header
    "header.title": "Fashion Studio AI",
    
    // Dashboard
    "dashboard.greeting": "Welcome back",
    "dashboard.subtitle": "What would you like to create today?",
    "dashboard.stats.banners": "Banners Created",
    "dashboard.stats.videos": "Videos Generated",
    "dashboard.stats.models": "Models",
    "dashboard.quickAction.create": "Create Banner",
    "dashboard.quickAction.createDesc": "AI-powered banner generation",
    "dashboard.quickAction.video": "Video Studio",
    "dashboard.quickAction.videoDesc": "Create cinematic fashion videos",
    "dashboard.quickAction.extract": "Extract Garment",
    "dashboard.quickAction.extractDesc": "Background removal",
    "dashboard.quickAction.library": "Library",
    "dashboard.quickAction.libraryDesc": "Manage assets and history",

    // Extract Garment
    "extract.title": "Extract Garment",
    "extract.original": "Original Image",
    "extract.change": "Change",
    "extract.uploadModel": "Upload model image",
    "extract.support": "Supports JPG, PNG, WEBP",
    "extract.result": "Extraction Result",
    "extract.downloadPng": "Download PNG",
    "extract.extracting": "Extracting background...",
    "extract.noData": "No data",
    "extract.start": "Start Extraction",
    "extract.tips": "Studio Tips",
    "extract.tipsDesc": "Use high-resolution images with simple backgrounds for best results. The AI engine will automatically detect garments and remove the background with pixel-perfect accuracy.",

    // Library
    "library.title": "Resource Library",
    "library.admin": "Manage Library",
    "library.adminDesc": "Add new models or products to the system repository.",
    "library.adminBtn": "Manage Repository",
    "library.models": "Models Library",
    "library.modelsEmpty": "No models available.",
    "library.products": "Products Library",
    "library.productsEmpty": "No products available.",
    "library.history": "Generated Collections",
    "library.historyEmpty": "Design history is empty.",
    "library.versions": "Versions",
    
    // Video Studio
    "video.title": "Video Studio",
    "video.upload": "Create video from image",
    "video.uploadDesc": "Drag and drop or click to select fashion image",
    "video.config": "Director Configuration",
    "video.configDesc": "Camera angles, effects, and advanced transitions",
    "video.prompt": "Action Scenario",
    "video.promptPlaceholder": "Describe action, scene, outfit...",
    "video.camera": "Camera Angle",
    "video.speed": "Speed",
    "video.effects": "Effects",
    "video.transition": "Transition",
    "video.voice": "Audio / Voice (AI Support)",
    "video.status.idle": "Pending",
    "video.status.generating": "Generating...",
    "video.status.done": "Completed ✓",
    "video.status.error": "Error Retry",
    "video.generateNow": "Generate Now",
    "video.generateAll": "Generate All",
    "video.ready": "Ready to render",

    // Settings
    "settings.title": "System Settings",
    "settings.gemini": "Google Gemini Engine",
    "settings.geminiDesc": "Main AI Service",
    "settings.apiKey": "Gemini API Key",
    "settings.apiKeyPlaceholder": "AIza... (from Google AI Studio)",
    "settings.getKey": "Get API Key at Google AI Studio",
    "settings.modelOptimized": "Optimized Image Model",
    "settings.modelFast": "Ultra Fast · 4K",
    "settings.modelPro": "High Quality · Thinking",
    "settings.videoEngine": "Video AI Studio",
    "settings.videoEngineDesc": "Veo 3.1 · Cinematic Mode",
    "settings.videoStandard": "Veo 3.1",
    "settings.videoLite": "Lite Fast",
    "settings.dataManagement": "Project Data Management",
    "settings.export": "Export Config",
    "settings.import": "Import Config",
    "settings.admin": "Studio Admin",
    "settings.logout": "Logout",
    "settings.openai": "OpenAI API (Official)",
    "settings.openaiDesc": "Secondary AI Service",
    "settings.openaiKey": "OpenAI API Key",
    "settings.openaiBaseUrl": "Base URL (OpenAI / Proxy)",
    "settings.verify": "Test Connection",
    "settings.ready": "Ready",
    
    // Create Shot
    "create.title": "Create Banner",
    "create.generate": "Generate Banner",
    "create.advanced": "Advanced Settings",
    "create.prompt": "Design Prompt",
    "create.product": "Product",
    "create.model": "Model",
    "create.size": "Size & Format",
    "create.style": "Art Style",
    
    // Results
    "results.title": "Results",
    "results.save": "Save to Library",
    "results.new": "New Generation",
    "results.versions": "Generated Versions",
    
    // Admin
    "admin.title": "Admin Panel",
    "admin.add": "Add Resource",
    "admin.name": "Name",
    "admin.description": "Description",
    "admin.type": "Type",
    "admin.url": "Image URL",
    
    // Auth
    "auth.login": "Login",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.welcome": "Welcome to Fashion Studio AI",
    
    // Theme
    "theme.light": "Light Mode",
    "theme.dark": "Dark Mode",
  }
};

// VI translations
const vi = {
  translation: {
    // General
    "back": "Quay lại",
    "save": "Lưu",
    "cancel": "Hủy",
    "delete": "Xóa",
    "loading": "Đang tải...",
    "success": "Thành công",
    "error": "Lỗi",
    "download": "Tải xuống",
    "settings": "Cài đặt",
    "library": "Thư viện",
    "history": "Lịch sử",

    // Sidebar
    "menu.dashboard": "Bảng điều khiển",
    "menu.create": "Tạo Banner",
    "menu.video": "Video Studio",
    "menu.extract": "Tách Đồ Áo",
    "menu.library": "Thư viện & Lịch sử",
    "menu.admin": "Quản trị hệ thống",
    "menu.settings": "Cài đặt hệ thống",
    "menu.collapse": "Thu gọn",

    // Header
    "header.title": "Fashion Studio AI",

    // Dashboard
    "dashboard.greeting": "Chào mừng trở lại",
    "dashboard.subtitle": "Bạn muốn sáng tạo gì hôm nay?",
    "dashboard.stats.banners": "Banner Đã Tạo",
    "dashboard.stats.videos": "Video Đã Dựng",
    "dashboard.stats.models": "Người Mẫu",
    "dashboard.quickAction.create": "Tạo Banner Mới",
    "dashboard.quickAction.createDesc": "Khởi tạo chiến dịch hình ảnh AI",
    "dashboard.quickAction.video": "Video Studio",
    "dashboard.quickAction.videoDesc": "Dựng video thời trang Cinematic",
    "dashboard.quickAction.extract": "Tách Đồ Áo",
    "dashboard.quickAction.extractDesc": "Tách nền chuyên nghiệp",
    "dashboard.quickAction.library": "Thư Viện",
    "dashboard.quickAction.libraryDesc": "Quản lý tài nguyên & Lịch sử",

    // Extract Garment
    "extract.title": "Tách đồ áo",
    "extract.original": "Ảnh gốc",
    "extract.change": "Thay đổi",
    "extract.uploadModel": "Tải lên ảnh người mẫu",
    "extract.support": "Hỗ trợ JPG, PNG, WEBP",
    "extract.result": "Kết quả tách",
    "extract.downloadPng": "Tải về PNG",
    "extract.extracting": "Đang tách nền AI...",
    "extract.noData": "Chưa có dữ liệu",
    "extract.start": "Bắt đầu tách sản phẩm",
    "extract.tips": "Studio Tips",
    "extract.tipsDesc": "Sử dụng ảnh có độ phân giải cao và nền đơn giản để đạt kết quả tách tốt nhất. Hệ thống AI Engine sẽ tự động nhận diện trang phục và loại bỏ nền/người mẫu với độ chính xác cấp độ pixel.",

    // Library
    "library.title": "Thư viện tài nguyên",
    "library.admin": "Quản trị Kho tài nguyên",
    "library.adminDesc": "Thêm mẫu ảnh hoặc sản phẩm mới vào kho lưu trữ hệ thống.",
    "library.adminBtn": "Quản lý kho",
    "library.models": "Kho Ảnh Mẫu (Models)",
    "library.modelsEmpty": "Chưa có ảnh mẫu.",
    "library.products": "Kho Sản Phẩm (Products)",
    "library.productsEmpty": "Chưa có sản phẩm.",
    "library.history": "Bộ sưu tập đã tạo",
    "library.historyEmpty": "Lịch sử thiết kế đang trống.",
    "library.versions": "Phiên bản",

    // Video Studio
    "video.title": "Video Studio",
    "video.upload": "Tạo video từ hình ảnh",
    "video.uploadDesc": "Kéo thả hoặc click để chọn ảnh thời trang",
    "video.config": "Cấu hình Đạo diễn",
    "video.configDesc": "Góc máy, hiệu ứng, chuyển cảnh chuyên sâu",
    "video.prompt": "Kịch bản hành động",
    "video.promptPlaceholder": "Mô tả hành động, bối cảnh, trang phục...",
    "video.camera": "Góc máy",
    "video.speed": "Tốc độ",
    "video.effects": "Hiệu ứng",
    "video.transition": "Chuyển cảnh",
    "video.voice": "Âm thanh / Thoại (Phụ trợ AI)",
    "video.status.idle": "Chờ xử lý",
    "video.status.generating": "Đang tạo...",
    "video.status.done": "Hoàn tất ✓",
    "video.status.error": "Lỗi thử lại",
    "video.generateNow": "Tạo ngay",
    "video.generateAll": "Tạo tất cả video",
    "video.ready": "Sẵn sàng kết xuất",

    // Settings
    "settings.title": "Cài đặt hệ thống",
    "settings.gemini": "Google Gemini Engine",
    "settings.geminiDesc": "Dịch vụ AI chính",
    "settings.apiKey": "Gemini API Key",
    "settings.apiKeyPlaceholder": "AIza... (từ Google AI Studio)",
    "settings.getKey": "Lấy API Key tại Google AI Studio",
    "settings.modelOptimized": "Model tạo ảnh tối ưu",
    "settings.modelFast": "Tốc độ cực nhanh · 4K",
    "settings.modelPro": "Chất lượng cao · Thinking",
    "settings.videoEngine": "Video AI Studio",
    "settings.videoEngineDesc": "Veo 3.1 · Cinematic Mode",
    "settings.videoStandard": "Veo 3.1",
    "settings.videoLite": "Lite Fast",
    "settings.dataManagement": "Quản lý dữ liệu dự án",
    "settings.export": "Xuất cấu hình",
    "settings.import": "Nhập cấu hình",
    "settings.admin": "Quản trị",
    "settings.logout": "Đăng xuất",
    "settings.openai": "OpenAI API (Chính thức)",
    "settings.openaiDesc": "Dịch vụ AI bổ trợ",
    "settings.openaiKey": "OpenAI API Key",
    "settings.openaiBaseUrl": "Base URL (OpenAI / Proxy)",
    "settings.verify": "Kiểm tra kết nối",
    "settings.ready": "Sẵn sàng",
    
    // Create Shot
    "create.title": "Studio Sáng Tạo",
    "create.generate": "Tạo Banner",
    "create.advanced": "Cấu hình nâng cao",
    "create.prompt": "Chỉ đạo nghệ thuật (Prompt)",
    "create.product": "Sản phẩm",
    "create.model": "Người mẫu",
    "create.size": "Kích thước & Định dạng",
    "create.style": "Phong cách nghệ thuật",
    
    // Results
    "results.title": "Kết quả",
    "results.save": "Lưu thư viện",
    "results.new": "Tạo mới",
    "results.versions": "Phiên bản",
    
    // Admin
    "admin.title": "Quản trị hệ thống",
    "admin.add": "Thêm tài nguyên",
    "admin.name": "Tên",
    "admin.description": "Mô tả",
    "admin.type": "Loại",
    "admin.url": "URL Hình ảnh",
    
    // Auth
    "auth.login": "Đăng nhập",
    "auth.email": "Email",
    "auth.password": "Mật khẩu",
    "auth.welcome": "Chào mừng đến với Fashion Studio AI",
    
    // Theme
    "theme.light": "Chế độ Sáng",
    "theme.dark": "Chế độ Tối",
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en,
      vi
    },
    lng: "vi", // Default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
