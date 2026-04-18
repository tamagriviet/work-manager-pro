
import React, { useMemo } from 'react';
import { User, Language, Task } from '../types';
import { translations } from '../translations';

interface AdminDashboardProps {
  users: User[];
  tasks: Task[];
  language: Language;
  onSelectUser: (user: User) => void;
  onEditUser: (user: User) => void;
  notifications: any[];
  setNotifications: any;
  showNotifications: boolean;
  setShowNotifications: (v: boolean) => void;
  unreadCount: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, tasks, language, onSelectUser, onEditUser, notifications, setNotifications, showNotifications, setShowNotifications, unreadCount }) => {
  const t = translations[language] || translations.vi;

  // Xây dựng cây phân cấp - Loại bỏ root-admin khỏi danh sách hiển thị trong cây
  const hierarchy = useMemo(() => {
    const userMap: Record<string, User[]> = {};
    users.forEach(u => {
      // Không đưa chính tài khoản Root Admin vào danh sách con để hiển thị
      if (u.email === 'tam.agriviet@gmail.com' || u.id === 'root-admin') return;

      const parentId = u.reportsTo || 'root-admin';
      if (!userMap[parentId]) userMap[parentId] = [];
      userMap[parentId].push(u);
    });
    return userMap;
  }, [users]);

  const treeStyles = `
  .org-tree {
    display: flex;
    justify-content: center;
  }
  .org-tree ul {
    padding-top: 20px;
    position: relative;
    display: flex;
    justify-content: center;
    transition: all 0.5s;
  }
  .org-tree li {
    float: left;
    text-align: center;
    list-style-type: none;
    position: relative;
    padding: 20px 10px 0 10px;
    transition: all 0.5s;
  }
  .org-tree li::before, .org-tree li::after {
    content: '';
    position: absolute;
    top: 0;
    right: 50%;
    border-top: 2px solid #cbd5e1;
    width: 50%;
    height: 20px;
  }
  .dark .org-tree li::before, .dark .org-tree li::after {
    border-top-color: #334155;
  }
  .org-tree li::after {
    right: auto;
    left: 50%;
    border-left: 2px solid #cbd5e1;
  }
  .dark .org-tree li::after {
    border-left-color: #334155;
  }
  .org-tree li:only-child::after, .org-tree li:only-child::before {
    display: none;
  }
  .org-tree li:only-child {
    padding-top: 0;
  }
  .org-tree li:first-child::before, .org-tree li:last-child::after {
    border: 0 none;
  }
  .org-tree li:last-child::before {
    border-right: 2px solid #cbd5e1;
    border-radius: 0 5px 0 0;
  }
  .dark .org-tree li:last-child::before {
    border-right-color: #334155;
  }
  .org-tree li:first-child::after {
    border-radius: 5px 0 0 0;
  }
  .org-tree ul::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    border-left: 2px solid #cbd5e1;
    width: 0;
    height: 20px;
    transform: translateX(-50%);
  }
  .dark .org-tree ul::before {
    border-left-color: #334155;
  }
  /* Remove top connector from the very first root UL */
  .org-tree > ul::before {
    display: none;
  }
  .org-tree > ul {
    padding-top: 0;
  }
  `;

  const renderNode = (user: User) => {
    const children = hierarchy[user.id] || [];
    
    // Cấu hình màu sắc đồng nhất theo cấp bậc (Role-based Coloring)
    const roleStyles: Record<string, string> = {
      ADMIN: 'bg-rose-600 border-rose-200 text-rose-600 shadow-rose-500/10',
      DEPT_HEAD: 'bg-amber-500 border-amber-200 text-amber-600 shadow-amber-500/10',
      MANAGER: 'bg-indigo-600 border-indigo-200 text-indigo-600 shadow-indigo-500/10',
      EMPLOYEE: 'bg-slate-500 border-slate-200 text-slate-500 shadow-slate-500/10'
    };
    
    const currentStyle = roleStyles[user.role] || roleStyles.EMPLOYEE;
    const userTasksCount = tasks.filter(tk => tk.userId === user.id && !tk.deletedAt).length;

    return (
      <li key={user.id} className="animate-in fade-in zoom-in-95 duration-500">
        <div className="inline-block relative">
          <div className={`bg-white dark:bg-slate-900 border-2 border-t-[8px] p-5 rounded-3xl shadow-xl flex flex-col items-center gap-2 w-[240px] relative z-10 mx-auto hover:-translate-y-2 hover:shadow-2xl transition-all ${currentStyle.split(' ')[1]} ${currentStyle.replace('bg-', 'border-t-')}`}>
            <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center font-black text-white text-xl shadow-lg ${currentStyle.split(' ')[0]}`}>
              {user.fullName.charAt(0)}
            </div>
            <div className="text-center w-full min-w-0 mt-1">
              <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase truncate tracking-tight">{user.fullName}</h4>
              <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 truncate ${currentStyle.split(' ')[2]}`}>
                {user.jobTitle}
              </p>
              <span className="text-[8px] font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 mt-2 inline-block">
                {t[`role_${user.role}` as keyof typeof t]}
              </span>
            </div>
            
            <div className="flex items-center gap-3 mt-3 w-full justify-center border-t border-slate-50 dark:border-slate-800/50 pt-3">
              <button onClick={() => onSelectUser(user)} className="w-9 h-9 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-500 rounded-xl flex items-center justify-center transition-all border border-slate-100 dark:border-slate-700">
                 <i className="fas fa-eye text-xs"></i>
              </button>
              <button onClick={() => onEditUser(user)} className="w-9 h-9 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-amber-500 rounded-xl flex items-center justify-center transition-all border border-slate-100 dark:border-slate-700">
                 <i className="fas fa-pen text-xs"></i>
              </button>
            </div>
            
            <div className={`absolute -top-3 -right-3 px-3 py-1 bg-white dark:bg-slate-900 border-2 rounded-full text-[10px] font-black shadow-sm ${currentStyle.split(' ')[1]} ${currentStyle.split(' ')[2]}`}>
              {userTasksCount} TASK
            </div>
          </div>
        </div>

        {/* Render con đệ quy */}
        {children.length > 0 && (
          <ul>
            {children.map(child => renderNode(child))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="p-6 md:p-12 h-full overflow-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto space-y-12 pb-20">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">{t.orgChart}</h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3">Quản trị cấu trúc doanh nghiệp</p>
          </div>
          <div className="hidden md:flex items-center gap-6">
             <div className="px-8 py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] flex items-center gap-4 shadow-sm">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Hệ thống thời gian thực</span>
             </div>
             <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all border-2 border-slate-100 dark:border-slate-800 relative shadow-sm">
                  <i className="fas fa-bell text-lg"></i>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Thông báo</h3>
                      {unreadCount > 0 && <span className="text-[9px] bg-rose-500 text-white px-2 py-1 rounded-full font-bold">{unreadCount} mới</span>}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 && <p className="text-center text-[10px] text-slate-400 p-4">Không có thông báo nào</p>}
                      {notifications.map(n => (
                        <div key={n.id} onClick={() => {
                          setNotifications((prev: any) => prev.map((x: any) => x.id === n.id ? {...x, isRead: true} : x));
                          if (n.type === 'update-ready' && window.electronAPI) {
                            window.electronAPI.quitAndInstall();
                          }
                        }} className={`p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                          <p className={`text-xs ${!n.isRead ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{n.text}</p>
                          {n.type === 'update-ready' && (
                            <button className="mt-2 text-[10px] bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold shadow-lg shadow-blue-500/30">
                              <i className="fas fa-sync-alt mr-1"></i> Cập nhật & Khởi động lại
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
             </div>
          </div>
        </header>

        <div className="relative pt-12 overflow-x-auto custom-scrollbar pb-20 w-full flex justify-center">
           <style>{treeStyles}</style>
           <div className="org-tree min-w-max">
             <ul>
               {hierarchy['root-admin'] && hierarchy['root-admin'].map(user => renderNode(user))}
             </ul>
           </div>
        </div>

        {users.length <= 1 && (
           <div className="py-20 text-center opacity-30 italic font-bold text-slate-400 uppercase tracking-[0.2em]">
              Chưa có nhân sự nào được tạo trong hệ thống
           </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
