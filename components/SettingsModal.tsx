
import React, { useState, useEffect } from 'react';
import { Language, Theme, User } from '../types';
import { translations } from '../translations';

interface SettingsModalProps {
  language: Language;
  theme: Theme;
  appLogo?: string;
  currentUser: User;
  onUpdate: (lang: Language, theme: Theme, logo?: string) => void;
  onUpdatePassword: (newPass: string) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ language, theme: initialTheme, appLogo, currentUser, onUpdate, onUpdatePassword, onClose }) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SECURITY' | 'INTERFACE'>('GENERAL');
  const [tempLanguage, setTempLanguage] = useState<Language>(language);
  const [tempTheme, setTempTheme] = useState<Theme>(initialTheme);
  const [tempAppLogo, setTempAppLogo] = useState<string | undefined>(appLogo);
  
  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const t = translations[tempLanguage] || translations.vi;

  useEffect(() => {
    const root = document.documentElement;
    if (tempTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [tempTheme]);

  const handleSave = () => {
    if (activeTab === 'GENERAL' || activeTab === 'INTERFACE') {
      onUpdate(tempLanguage, tempTheme, tempAppLogo);
      onClose();
    } else {
      // Logic đổi mật khẩu
      setPasswordError('');
      setPasswordSuccess('');
      
      if (!oldPassword || !newPassword || !confirmPassword) {
        setPasswordError("Vui lòng nhập đầy đủ tất cả các trường!");
        return;
      }

      // Kiểm tra mật khẩu cũ (từ state hệ thống)
      if (oldPassword !== currentUser.password) {
        setPasswordError(t.wrongOldPassword);
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError("Mật khẩu mới và nhập lại không khớp!");
        return;
      }

      if (newPassword.length < 4) {
        setPasswordError("Mật khẩu mới phải có ít nhất 4 ký tự!");
        return;
      }

      onUpdatePassword(newPassword);
      setPasswordSuccess(t.passwordChanged);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleCancel = () => {
    const root = document.documentElement;
    if (initialTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    onClose();
  };

  const languageOptions: { id: Language; label: string; flag: string }[] = [
    { id: 'vi', label: 'Tiếng Việt', flag: 'VN' },
    { id: 'en', label: 'English', flag: 'US' },
    { id: 'zh', label: '中文', flag: 'CN' },
    { id: 'ru', label: 'Русский', flag: 'RU' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform animate-in zoom-in-95 duration-200">
        <header 
          className="px-8 pb-8 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 32px)' }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t.settings}</h2>
            <button onClick={handleCancel} className="text-slate-300 hover:text-rose-500 transition-colors">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button 
              onClick={() => setActiveTab('GENERAL')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'GENERAL' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              {t.general}
            </button>
            <button 
              onClick={() => setActiveTab('INTERFACE')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'INTERFACE' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              Giao Diện
            </button>
            <button 
              onClick={() => setActiveTab('SECURITY')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'SECURITY' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              {t.security}
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8 bg-white dark:bg-slate-900 min-h-[480px]">
          {activeTab === 'GENERAL' ? (
            <>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t.language}</label>
                <div className="grid grid-cols-1 gap-2">
                  {languageOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setTempLanguage(opt.id)}
                      className={`w-full py-4 px-6 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-between ${
                        tempLanguage === opt.id 
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                          : 'border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-400'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {tempLanguage === opt.id && <i className="fas fa-check-circle"></i>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t.theme}</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setTempTheme('light')}
                    className={`flex-1 py-5 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-3 transition-all ${
                      tempTheme === 'light' 
                        ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-lg shadow-amber-100' 
                        : 'border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-400'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tempTheme === 'light' ? 'bg-amber-400 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <i className="fas fa-sun text-lg"></i>
                    </div>
                    {t.light}
                  </button>
                  <button
                    onClick={() => setTempTheme('dark')}
                    className={`flex-1 py-5 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-3 transition-all ${
                      tempTheme === 'dark' 
                        ? 'border-indigo-600 bg-indigo-900/40 text-indigo-400 shadow-lg shadow-indigo-950/50' 
                        : 'border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-400'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tempTheme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <i className="fas fa-moon text-lg"></i>
                    </div>
                    {t.dark}
                  </button>
                </div>
              </div>
            </>
          ) : activeTab === 'INTERFACE' ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Logo Phần Mềm (In-App Logo)</label>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-center justify-center overflow-hidden shrink-0">
                      {tempAppLogo ? (
                        <img src={tempAppLogo} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center text-2xl">
                          <i className="fas fa-shield-halved"></i>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-xs font-bold transition-colors inline-block border border-blue-200 dark:border-blue-800">
                        <i className="fas fa-upload mr-2"></i> Tải ảnh lên
                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              // Chuyển thành base64
                              const base64 = event.target?.result as string;
                              setTempAppLogo(base64);
                            };
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </label>
                      {tempAppLogo && (
                        <button onClick={() => setTempAppLogo(undefined)} className="ml-2 px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl text-xs font-bold transition-colors">
                          Xóa
                        </button>
                      )}
                      <p className="text-[9px] text-slate-400 mt-2">Ảnh vuông 1:1 (khuyên dùng 256x256), định dạng PNG/JPG</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Icon Cài Đặt (Desktop/Mobile)</label>
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4">
                  <p className="text-xs text-amber-700 dark:text-amber-500 mb-3 leading-relaxed">
                    <strong>Lưu ý kỹ thuật:</strong> Biểu tượng ứng dụng ngoài màn hình máy tính và điện thoại <strong>không thể thay đổi trực tiếp từ giao diện này</strong> vì Apple/macOS yêu cầu phải đóng gói cố định trong lúc Build.
                  </p>
                  <div className="space-y-2 text-[10px] text-slate-600 dark:text-slate-400">
                    <p><i className="fas fa-desktop text-blue-500 w-4"></i> <strong>Cho Máy Tính (Mac):</strong> Chuẩn bị 1 ảnh <code className="bg-white dark:bg-slate-800 px-1 rounded text-slate-800 dark:text-slate-300">512x512 px</code> lưu vào thư mục <code className="bg-white dark:bg-slate-800 px-1 rounded text-slate-800 dark:text-slate-300">build/icon.png</code></p>
                    <p><i className="fas fa-mobile-alt text-blue-500 w-4"></i> <strong>Cho Điện Thoại (iOS):</strong> Chuẩn bị 1 ảnh <code className="bg-white dark:bg-slate-800 px-1 rounded text-slate-800 dark:text-slate-300">1024x1024 px</code> (không nền trong suốt) đưa vào thư mục <code className="bg-white dark:bg-slate-800 px-1 rounded text-slate-800 dark:text-slate-300">ios/App/App/Assets.xcassets/AppIcon.appiconset</code></p>
                    <p className="pt-2 font-bold italic text-amber-600 dark:text-amber-500">*Vui lòng liên hệ Kỹ thuật viên để build lại ứng dụng sau khi đổi ảnh cài đặt.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.oldPassword}</label>
                <input 
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 dark:text-white"
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.newPassword}</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 dark:text-white"
                  placeholder="Nhập mật khẩu mới"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nhập lại mật khẩu mới</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 dark:text-white"
                  placeholder="Xác nhận mật khẩu mới"
                />
              </div>

              {passwordError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 rounded-2xl text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-pulse">
                  <i className="fas fa-exclamation-circle"></i>
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-2xl text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                  <i className="fas fa-check-circle"></i>
                  {passwordSuccess}
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="p-8 bg-slate-50 dark:bg-slate-950/50 flex gap-4">
           <button 
             onClick={handleCancel} 
             className="flex-1 py-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
           >
             {t.cancel}
           </button>
           <button 
             onClick={handleSave} 
             className="flex-1 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:opacity-90 transition-all active:scale-95"
           >
             {activeTab === 'GENERAL' || activeTab === 'INTERFACE' ? t.save : "THAY ĐỔI"}
           </button>
        </footer>
      </div>
    </div>
  );
};

export default SettingsModal;
