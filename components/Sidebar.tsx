
import React, { useState } from 'react';
import { Language, User, Department } from '../types';
import { translations } from '../translations';
import { getCompanyColor } from '../constants';
import packageJson from '../package.json';

interface SidebarProps {
  currentUser: User;
  managerName?: string;
  companies: string[];
  departments?: Department[];
  language: Language;
  appLogo?: string;
  onAddTask: (content: string, company: string, isPriority: boolean) => void;
  onAddCompany: (company: string) => void;
  onOpenManageCompanies: () => void;
  onClearAll: () => void;
  onLogout: () => void;
  onOpenHistory: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onOpenManageUsers: () => void;
  onAddDepartment?: (name: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentUser, managerName, companies, departments = [], language, appLogo, onAddTask, onAddCompany, onOpenManageCompanies, onClearAll, onLogout, onOpenHistory, onOpenExport, onOpenSettings, onOpenManageUsers, onAddDepartment
}) => {
  const [content, setContent] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(companies[0] || '');
  const [isPriority, setIsPriority] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  
  const t = translations[language] || translations.vi;
  const isRootAdmin = currentUser.email === 'tam.agriviet@gmail.com';

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedCompany) return;
    onAddTask(content, selectedCompany, isPriority);
    setContent('');
    setIsPriority(false);
  };

  return (
      <div className={`w-full md:w-[380px] bg-white dark:bg-slate-950 flex-1 md:h-full flex flex-col p-6 md:p-10 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 shadow-sm md:shadow-none overflow-y-auto custom-scrollbar transition-colors ${isRootAdmin ? 'hidden md:flex' : ''}`}>

        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            {appLogo ? (
              <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white rounded-xl md:rounded-[1.2rem] shadow-xl overflow-hidden p-0.5 border border-slate-100">
                <img src={appLogo} alt="App Logo" className="w-full h-full object-contain rounded-lg md:rounded-xl" />
              </div>
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl md:rounded-[1.2rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                <i className="fas fa-shield-halved text-lg md:text-xl"></i>
              </div>
            )}
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tighter leading-tight uppercase pr-8 md:pr-0">{t.appName}</h1>
              <p className="text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest">{isRootAdmin ? t.systemAdmin : 'Enterprise Edition'}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-rose-500 transition-all border border-slate-100 dark:border-slate-800 hidden md:flex items-center justify-center"><i className="fas fa-power-off"></i></button>
        </div>

      <div className="mb-8 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.fullName}</p>
          <p className="font-black text-slate-800 dark:text-white text-sm">{currentUser.fullName}</p>
          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{currentUser.jobTitle}</p>
        </div>
      </div>

      {!isRootAdmin ? (
        <>
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button onClick={onOpenHistory} className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 flex flex-col items-center gap-2 hover:scale-105 transition-all">
              <i className="fas fa-chart-line"></i>
              <span className="text-[9px] font-black uppercase tracking-widest">{t.history}</span>
            </button>
            <button onClick={onOpenExport} className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 flex flex-col items-center gap-2 hover:scale-105 transition-all">
              <i className="fas fa-file-invoice"></i>
              <span className="text-[9px] font-black uppercase tracking-widest">{t.report}</span>
            </button>
          </div>

          <div className="flex-1">
            <form onSubmit={handleSubmitTask} className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.workingCompanies}</label>
                  <button type="button" onClick={onOpenManageCompanies} className="text-[10px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-widest">{t.manage}</button>
                </div>
                
                {/* Giao diện danh sách chọn công ty dàn hàng ngang, không thanh cuộn */}
                <div className="flex flex-wrap gap-2 py-1">
                  {companies.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic text-center py-4 bg-slate-50 dark:bg-slate-900 w-full rounded-xl">Chưa có công ty...</p>
                  ) : (
                    companies.map(c => {
                      const cpColor = getCompanyColor(c);
                      const isSelected = selectedCompany === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSelectedCompany(c)}
                          className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${
                            isSelected 
                              ? `${cpColor.badge} text-white border-transparent shadow-lg scale-105` 
                              : `bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-blue-400`
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.taskContent}</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t.placeholderContent} className="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none h-32 resize-none text-slate-800 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div onClick={() => setIsPriority(!isPriority)} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${isPriority ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isPriority ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                  {isPriority && <i className="fas fa-check text-[10px]"></i>}
                </div>
                <span className={`text-[11px] font-black uppercase tracking-widest ${isPriority ? 'text-rose-600' : 'text-slate-500 dark:text-slate-400'}`}>{t.isPriority}</span>
              </div>

              <button type="submit" className="w-full bg-slate-900 dark:bg-blue-600 hover:opacity-90 text-white font-black py-5 rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3 text-xs tracking-widest uppercase active:scale-95">
                <i className="fas fa-plus-circle"></i> {t.update}
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex-1 space-y-6">
           <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-[2rem]">
              <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">{t.systemAdmin}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{t.orgDesc}</p>
           </div>
           
           <div className="space-y-4">
             
             {/* Form thêm phòng ban mới */}
             <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
               <h3 className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Thêm sơ đồ mới</h3>
               <div className="flex flex-col gap-3">
                 <input 
                   type="text" 
                   value={newDeptName}
                   onChange={e => setNewDeptName(e.target.value)}
                   placeholder="Nhập tên phòng ban..."
                   className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
                 />
                 <button 
                   onClick={() => {
                     if (newDeptName.trim() && onAddDepartment) {
                       onAddDepartment(newDeptName.trim());
                       setNewDeptName('');
                     }
                   }}
                   disabled={!newDeptName.trim()}
                   className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                 >
                   <i className="fas fa-plus mr-2"></i> Tạo sơ đồ
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}
      
      <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button onClick={onOpenSettings} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
          <i className="fas fa-sliders-h text-sm"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">{t.settings}</span>
        </button>
        
        {/* Nút logout trên mobile */}
        <button onClick={onLogout} className="md:hidden flex items-center gap-2 text-rose-400 hover:text-rose-600 transition-colors">
          <i className="fas fa-power-off text-sm"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">Đăng xuất</span>
        </button>

        <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest hidden md:block">v{packageJson.version}</p>
      </div>
    </div>
  );
};

export default Sidebar;
