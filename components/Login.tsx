import React, { useState, useEffect } from 'react';
import { authenticateUser } from '../services/storageService';
import packageJson from '../package.json';
import { getServerUrl, setServerUrl } from '../services/configService';

interface LoginProps {
  onLogin: (email: string, pass: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const savedEmail = localStorage.getItem('saved_email');
    const savedPassword = localStorage.getItem('saved_password');
    const autoLogin = localStorage.getItem('auto_login');
    
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true); // Tự động tích lại nếu đã từng ghi nhớ
    }
    if (savedPassword) setPassword(savedPassword);
    
    if (autoLogin === 'true' && savedEmail && savedPassword) {
      setRememberMe(true);
      performLogin(savedEmail, savedPassword, true);
    }
  }, []);
  
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(getServerUrl());

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setServerUrl(tempUrl);
    setShowSettings(false);
    window.location.reload(); // Tải lại trang để áp dụng URL mới
  };

  const performLogin = async (loginEmail: string, loginPass: string, shouldRemember: boolean) => {
    setError('');
    setLoading(true);

    try {
      const result = await authenticateUser({ email: loginEmail, password: loginPass });
      if (result.success) {
        if (shouldRemember) {
          localStorage.setItem('saved_email', loginEmail);
          localStorage.setItem('saved_password', loginPass);
          localStorage.setItem('auto_login', 'true');
        } else {
          localStorage.removeItem('saved_email');
          localStorage.removeItem('saved_password');
          localStorage.removeItem('auto_login');
        }
        onLogin(loginEmail, loginPass);
      } else {
        setError(result.message);
        localStorage.removeItem('auto_login');
      }
    } catch (err: any) {
      setError(err.message);
      localStorage.removeItem('auto_login');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(email, password, rememberMe);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-[440px] bg-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
        
        <div className="absolute top-6 right-6">
          <button type="button" onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center shadow-sm">
            <i className="fas fa-cog"></i>
          </button>
        </div>
        
        {showSettings && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center p-6 rounded-[3.5rem]">
            <div className="w-full bg-white border border-slate-100 shadow-2xl rounded-3xl p-8 animate-in zoom-in-95 duration-200">
               <h3 className="text-lg font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-3">
                 <i className="fas fa-server text-blue-500"></i> Cấu hình Máy chủ
               </h3>
               <form onSubmit={handleSaveSettings} className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ API Server</label>
                   <input type="text" value={tempUrl} onChange={e => setTempUrl(e.target.value)} placeholder="http://192.168.1.15:3000" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700 text-xs" />
                   <p className="text-[9px] text-slate-400 italic mt-2 ml-1">Để trống hoặc điền http://localhost:3000 nếu dùng nội bộ trên máy này.</p>
                 </div>
                 <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setShowSettings(false)} className="flex-1 py-4 rounded-xl font-black text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors uppercase tracking-widest">Hủy</button>
                   <button type="submit" className="flex-1 py-4 rounded-xl font-black text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all uppercase tracking-widest">Lưu & Tải lại</button>
                 </div>
               </form>
            </div>
          </div>
        )}
        
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white text-4xl mx-auto mb-6 shadow-xl shadow-blue-500/20">
            <i className="fas fa-shield-halved"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Work Manager Pro</h1>
          <p className="text-slate-400 font-bold text-[10px] mt-2 uppercase tracking-[0.2em]">Hệ thống quản trị nội bộ</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-[11px] font-black uppercase">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email công vụ</label>
            <input
              type="email"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@agriviet.com"
              className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
            <input
              type="password"
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700"
            />
          </div>

          <div className="flex items-center gap-2 px-1">
            <input 
              type="checkbox" 
              id="rememberMe" 
              checked={rememberMe} 
              onChange={(e) => setRememberMe(e.target.checked)} 
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer select-none">
              Ghi nhớ đăng nhập
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-black text-white font-black py-6 rounded-2xl shadow-2xl transition-all active:scale-95 mt-4 disabled:opacity-50 uppercase text-xs tracking-widest"
          >
            {loading ? <i className="fas fa-spinner animate-spin"></i> : 'Xác thực hệ thống'}
          </button>
        </form>

        <div className="mt-10 text-center">
           <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">v{packageJson.version} Enterprise Edition</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
