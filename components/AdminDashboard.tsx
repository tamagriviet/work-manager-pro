
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

  const renderNode = (parentId: string, level: number = 0) => {
    const children = hierarchy[parentId] || [];
    if (children.length === 0) return null;

    return (
      <div className={`flex flex-col gap-8 ${level > 0 ? 'ml-12 md:ml-20 border-l-4 border-slate-100 dark:border-slate-800 pl-12 md:pl-20' : ''}`}>
        {children.map(user => {
          // Cấu hình màu sắc đồng nhất theo cấp bậc (Role-based Coloring)
          const roleStyles = {
            ADMIN: 'bg-rose-600 border-rose-200 text-rose-600 shadow-rose-500/10',
            DEPT_HEAD: 'bg-amber-500 border-amber-200 text-amber-600 shadow-amber-500/10',
            MANAGER: 'bg-indigo-600 border-indigo-200 text-indigo-600 shadow-indigo-500/10',
            EMPLOYEE: 'bg-slate-500 border-slate-200 text-slate-500 shadow-slate-500/10'
          };
          
          const currentStyle = roleStyles[user.role];
          const userTasksCount = tasks.filter(tk => tk.userId === user.id && !tk.deletedAt).length;

          return (
            <div key={user.id} className="relative animate-in slide-in-from-left-8 duration-500">
              <div className="flex items-center gap-6 group">
                {/* Node Card với màu sắc cấp bậc */}
                <div className={`bg-white dark:bg-slate-900 border-2 border-l-[10px] p-5 rounded-[2rem] shadow-xl flex items-center gap-5 min-w-[320px] hover:-translate-y-1 transition-all ${currentStyle.split(' ')[1]} ${currentStyle.replace('bg-', 'border-l-')}`}>
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-white text-xl shadow-lg ${currentStyle.split(' ')[0]}`}>
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase truncate tracking-tight">{user.fullName}</h4>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${currentStyle.split(' ')[2]}`}>
                      {user.jobTitle}
                    </p>
                    <span className="text-[8px] font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-400 mt-2 inline-block">
                      {t[`role_${user.role}` as keyof typeof t]}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                     <button onClick={() => onSelectUser(user)} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-500 rounded-xl flex items-center justify-center transition-all border border-slate-100 dark:border-slate-800">
                        <i className="fas fa-eye text-xs"></i>
                     </button>
                     <button onClick={() => onEditUser(user)} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-amber-500 rounded-xl flex items-center justify-center transition-all border border-slate-100 dark:border-slate-800">
                        <i className="fas fa-pen text-xs"></i>
                     </button>
                  </div>
                </div>
                
                {/* Badge thông tin công việc */}
                <div className={`px-5 py-2 bg-white dark:bg-slate-900 border-2 rounded-full text-[10px] font-black shadow-sm ${currentStyle.split(' ')[1]} ${currentStyle.split(' ')[2]}`}>
                  {userTasksCount} CÔNG VIỆC
                </div>
              </div>

              {/* Render con đệ quy */}
              {renderNode(user.id, level + 1)}
            </div>
          );
        })}
      </div>
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

        <div className="relative pt-12">
           {/* Bắt đầu vẽ từ những người báo cáo cho root-admin, nhưng không vẽ nút root-admin */}
           {renderNode('root-admin', 0)}
           
           {/* Fallback cho những user không có reportsTo nhưng không phải là con của admin (nếu có lỗi logic mapping) */}
           {hierarchy['root'] && renderNode('root', 0)}
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
