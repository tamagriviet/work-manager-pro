import React, { useMemo, useState } from 'react';
import { User, Language, Task, Department } from '../types';
import { translations } from '../translations';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface AdminDashboardProps {
  users: User[];
  tasks: Task[];
  departments: Department[];
  onAddDepartment: (name: string) => void;
  onUpdateDepartment: (id: string, name: string) => void;
  onDeleteDepartment: (id: string) => void;
  language: Language;
  onSelectUser: (user: User) => void;
  onEditUser: (user: User) => void;
  notifications: any[];
  setNotifications: any;
  showNotifications: boolean;
  setShowNotifications: (v: boolean) => void;
  unreadCount: number;
  onAddUser: (deptId?: string) => void;
  onLogout: () => void;
  onSettings: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  users, tasks, departments, onAddDepartment, onUpdateDepartment, onDeleteDepartment, language, onSelectUser, onEditUser, 
  notifications, setNotifications, showNotifications, setShowNotifications, 
  unreadCount, onAddUser, onLogout, onSettings 
}) => {
  const t = translations[language] || translations.vi;
  const [showMobileOrgChart, setShowMobileOrgChart] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDept, setEditingDept] = useState<{id: string, name: string} | null>(null);

  // Xây dựng cây phân cấp tự động thông minh (Chỉ cho phòng ban đang chọn)
  const hierarchy = useMemo(() => {
    const userMap: Record<string, User[]> = {};
    
    // Lọc user theo phòng ban
    const deptUsers = users.filter(u => u.departmentId === selectedDeptId || u.email === 'tam.agriviet@gmail.com');
    
    // Tìm các cấp quản lý đầu tiên để làm mỏ neo tự động
    const firstAdmin = deptUsers.find(u => u.role === 'ADMIN' && u.email !== 'tam.agriviet@gmail.com');
    const firstDeptHead = deptUsers.find(u => u.role === 'DEPT_HEAD');
    const firstManager = deptUsers.find(u => u.role === 'MANAGER');

    deptUsers.forEach(u => {
      // Không đưa chính tài khoản Root Admin vào danh sách con để hiển thị
      if (u.email === 'tam.agriviet@gmail.com' || u.id === 'root-admin') return;

      let parentId = u.reportsTo;
      
      // Kiểm tra parentId có hợp lệ không (có tồn tại trong phòng ban này không)
      if (parentId && parentId !== 'root-admin') {
         const parentExists = deptUsers.some(p => p.id === parentId);
         if (!parentExists) {
            parentId = null; // Trả về null để chạy auto-arrange
         }
      }

      // LOGIC TỰ ĐỘNG SẮP XẾP CÂY: Nếu không có reportsTo, tự động móc vào quản lý cấp cao nhất hiện có
      if (!parentId) {
         if (u.role === 'ADMIN') {
            parentId = 'root-admin';
         } else if (u.role === 'DEPT_HEAD') {
            parentId = (firstAdmin && firstAdmin.id !== u.id) ? firstAdmin.id : 'root-admin';
         } else if (u.role === 'MANAGER') {
            parentId = (firstDeptHead && firstDeptHead.id !== u.id) ? firstDeptHead.id : 
                       (firstAdmin && firstAdmin.id !== u.id) ? firstAdmin.id : 'root-admin';
         } else if (u.role === 'EMPLOYEE') {
            parentId = (firstManager && firstManager.id !== u.id) ? firstManager.id : 
                       (firstDeptHead && firstDeptHead.id !== u.id) ? firstDeptHead.id : 
                       (firstAdmin && firstAdmin.id !== u.id) ? firstAdmin.id : 'root-admin';
         }
      }

      // Bảo vệ: Tránh tự báo cáo cho chính mình
      if (parentId === u.id) {
          parentId = 'root-admin';
      }

      if (!userMap[parentId!]) userMap[parentId!] = [];
      userMap[parentId!].push(u);
    });

    // Giải quyết circular dependency và các node bị mồ côi
    const reachable = new Set<string>();
    const checkReachable = (id: string) => {
       if (reachable.has(id)) return;
       reachable.add(id);
       const children = userMap[id] || [];
       children.forEach(child => checkReachable(child.id));
    };
    checkReachable('root-admin');
    
    deptUsers.forEach(u => {
        if (u.email === 'tam.agriviet@gmail.com' || u.id === 'root-admin') return;
        if (!reachable.has(u.id)) {
            if (!userMap['root-admin']) userMap['root-admin'] = [];
            
            // Xóa u khỏi cha cũ nếu có
            Object.keys(userMap).forEach(key => {
                userMap[key] = userMap[key].filter(child => child.id !== u.id);
            });
            
            userMap['root-admin'].push(u);
            checkReachable(u.id); // Đánh dấu lại u và các con là reachable
        }
    });

    return userMap;
  }, [users, selectedDeptId]);

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

  const renderNode = (user: User, visited = new Set<string>()) => {
    if (visited.has(user.id)) return null; // Ngăn chặn vòng lặp vô hạn nếu data bị lỗi tham chiếu chéo
    visited.add(user.id);
    
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
              <button onClick={() => { setShowMobileOrgChart(false); onSelectUser(user); }} className="w-9 h-9 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-500 rounded-xl flex items-center justify-center transition-all border border-slate-100 dark:border-slate-700 pointer-events-auto">
                 <i className="fas fa-eye text-xs"></i>
              </button>
              <button onClick={() => { setShowMobileOrgChart(false); onEditUser(user); }} className="w-9 h-9 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-amber-500 rounded-xl flex items-center justify-center transition-all border border-slate-100 dark:border-slate-700 pointer-events-auto">
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
            {children.map(child => renderNode(child, visited))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
      {/* Header cho Desktop & Mobile */}
      <header className="px-6 py-5 md:px-10 md:py-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">
            {selectedDeptId ? departments.find(d => d.id === selectedDeptId)?.name || 'Sơ đồ phòng ban' : 'Danh sách sơ đồ'}
          </h2>
          <p className="text-[10px] md:text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1.5 md:mt-2">
            {selectedDeptId ? 'Quản trị cấu trúc nhân sự' : 'Tổng quan tổ chức doanh nghiệp'}
          </p>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6 justify-between md:justify-end">
           {selectedDeptId && (
             <button onClick={() => setSelectedDeptId(null)} className="md:hidden px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase flex items-center gap-2">
               <i className="fas fa-arrow-left"></i> Quay lại
             </button>
           )}
           <div className="hidden md:flex items-center gap-6">
             {selectedDeptId && (
               <button onClick={() => setSelectedDeptId(null)} className="px-5 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-bold text-slate-600 dark:text-slate-300 text-xs uppercase flex items-center gap-2 hover:bg-slate-50 transition-colors">
                 <i className="fas fa-arrow-left"></i> Danh sách
               </button>
             )}
             <div className="px-8 py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] flex items-center gap-4 shadow-sm">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Hệ thống thời gian thực</span>
             </div>
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

      {/* Nội dung thay đổi (Danh sách phòng ban HOẶC Cây sơ đồ) */}
      <div className="flex-1 overflow-auto custom-scrollbar p-6 md:p-10 relative">
        {!selectedDeptId ? (
          <div className="max-w-7xl mx-auto space-y-8 pb-20">
            
            {/* Cột trái (Form thêm phòng ban & Action Buttons) - CHỈ DÀNH CHO MOBILE */}
            <div className="md:hidden flex flex-col gap-6">
              {/* Mobile Action Buttons */}
              <div className="flex flex-wrap gap-3">

                <button 
                  onClick={onSettings}
                  className="w-14 py-4 bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center active:scale-95 transition-all"
                >
                  <i className="fas fa-cog text-sm"></i>
                </button>
                <button 
                  onClick={onLogout}
                  className="w-14 py-4 bg-rose-50 dark:bg-rose-900/20 text-rose-500 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-center justify-center active:scale-95 transition-all"
                >
                  <i className="fas fa-power-off text-sm"></i>
                </button>
              </div>

              {/* Form thêm phòng ban mới (Mobile) */}
              <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-[2rem] p-6 flex flex-col justify-center min-h-[200px]">
                <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">Thêm sơ đồ mới</h3>
                <div className="flex flex-col gap-3">
                  <input 
                    type="text" 
                    value={newDeptName}
                    onChange={e => setNewDeptName(e.target.value)}
                    placeholder="Nhập tên phòng ban/chi nhánh..."
                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button 
                    onClick={() => {
                      if (newDeptName.trim()) {
                        onAddDepartment(newDeptName.trim());
                        setNewDeptName('');
                      }
                    }}
                    disabled={!newDeptName.trim()}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all"
                  >
                    <i className="fas fa-plus mr-2"></i> Tạo sơ đồ
                  </button>
                </div>
              </div>
            </div>

            {/* Danh sách phòng ban hiện có */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {departments.map(dept => {
                const deptUserCount = users.filter(u => u.departmentId === dept.id).length;
                return (
                  <div 
                    key={dept.id} 
                    onClick={() => setSelectedDeptId(dept.id)}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 flex flex-col min-h-[200px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-auto">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        <i className="fas fa-sitemap"></i>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDept({ id: dept.id, name: dept.name });
                          }}
                          className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center justify-center transition-all"
                        >
                          <i className="fas fa-pen text-[10px]"></i>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Bạn có chắc muốn xóa "${dept.name}"? Các nhân sự trong sơ đồ này sẽ bị xóa khỏi sơ đồ.`)) {
                              onDeleteDepartment(dept.id);
                            }
                          }}
                          className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center justify-center transition-all"
                        >
                          <i className="fas fa-trash-alt text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                    <div className="mt-6">
                      {editingDept?.id === dept.id ? (
                        <div onClick={e => e.stopPropagation()}>
                          <input 
                            type="text" 
                            autoFocus
                            value={editingDept.name}
                            onChange={e => setEditingDept({...editingDept, name: e.target.value})}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && editingDept.name.trim()) {
                                onUpdateDepartment(dept.id, editingDept.name.trim());
                                setEditingDept(null);
                              } else if (e.key === 'Escape') {
                                setEditingDept(null);
                              }
                            }}
                            onBlur={() => {
                              if (editingDept.name.trim() && editingDept.name.trim() !== dept.name) {
                                onUpdateDepartment(dept.id, editingDept.name.trim());
                              }
                              setEditingDept(null);
                            }}
                            className="w-full bg-white dark:bg-slate-950 p-2 rounded-xl outline-none border-2 border-blue-500 text-lg font-black text-slate-800 dark:text-white shadow-sm focus:ring-4 focus:ring-blue-500/20 transition-all"
                          />
                          <p className="text-[9px] text-blue-500 mt-2 font-bold uppercase tracking-widest"><i className="fas fa-keyboard mr-1"></i> Enter để lưu, Esc để hủy</p>
                        </div>
                      ) : (
                        <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">{dept.name}</h3>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <i className="fas fa-users"></i> {deptUserCount} nhân sự
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {departments.length === 0 && (
                 <div className="col-span-full py-16 text-center opacity-50 italic font-bold text-slate-400 uppercase tracking-[0.2em] bg-white/50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                    Chưa có sơ đồ phòng ban nào được tạo.
                 </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-[100vw] md:max-w-none pb-20">
            {/* Desktop Action Header when in a department */}
            <div className="hidden md:flex justify-end items-center mb-6 h-14 relative z-50">
              <button 
                onClick={() => onAddUser(selectedDeptId || undefined)}
                className="group flex items-center bg-slate-900 dark:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:bg-slate-800 dark:hover:bg-blue-700 h-14 w-14 hover:w-[180px] overflow-hidden relative ml-auto"
              >
                <div className="absolute right-0 w-14 h-14 flex items-center justify-center shrink-0">
                  <i className="fas fa-plus text-xl transition-transform duration-300 group-hover:rotate-90"></i>
                </div>
                <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300 font-black text-[11px] uppercase tracking-widest absolute right-14 pr-2">
                  Thêm Nhân Sự
                </span>
              </button>
            </div>

            {/* Các nút hành động dành riêng cho Mobile khi ở trong phòng ban */}
            <div className="md:hidden border-b border-slate-100 dark:border-slate-800 mb-8"></div>

            {/* Nút thêm nhân sự (Mobile FAB) */}
            <button 
              onClick={() => onAddUser(selectedDeptId || undefined)}
              className="md:hidden fixed bottom-8 right-6 w-14 h-14 bg-slate-900 dark:bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 active:scale-90 transition-all border-2 border-white dark:border-slate-900"
            >
              <i className="fas fa-plus text-xl"></i>
            </button>

            {/* Nút hiển thị sơ đồ tổ chức trên Mobile */}
            <div className="md:hidden flex justify-center mb-10">
              <button 
                onClick={() => setShowMobileOrgChart(true)}
                className="px-8 py-5 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-2 border-blue-100 dark:border-slate-800 rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all active:scale-95 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <i className="fas fa-sitemap text-lg"></i>
                </div>
                <div className="text-left">
                  <span className="block text-sm">Xem Sơ Đồ Khối</span>
                  <span className="block text-[9px] text-slate-400 dark:text-slate-500 mt-1">Hỗ trợ thu phóng</span>
                </div>
              </button>
            </div>

            {/* Sơ đồ hiển thị mặc định trên Desktop */}
            <div className="hidden md:block relative overflow-visible w-full mt-10 pb-20">
               <style>{treeStyles}</style>
               <div className="org-tree w-fit mx-auto min-w-max">
                 <ul>
                   {hierarchy['root-admin'] && hierarchy['root-admin'].map(user => renderNode(user))}
                 </ul>
               </div>
            </div>

            {users.filter(u => u.departmentId === selectedDeptId).length === 0 && (
               <div className="py-20 text-center opacity-30 italic font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Chưa có nhân sự nào trong phòng ban này
               </div>
            )}
          </div>
        )}
      </div>

      {/* Modal hiển thị sơ đồ trên Mobile (Full Screen, hỗ trợ zoom/pan) */}
      {showMobileOrgChart && (
        <div className="fixed inset-0 z-[150] bg-slate-50 dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom-full duration-300">
          <header 
            className="px-6 pb-4 md:p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-end bg-white dark:bg-slate-900 shadow-sm shrink-0"
            style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
          >
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t.orgChart}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Dùng 2 ngón tay để thu phóng
              </p>
            </div>
            <button 
              onClick={() => setShowMobileOrgChart(false)} 
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </header>

          <div className="flex-1 relative overflow-hidden bg-slate-100/50 dark:bg-slate-950/50 touch-none">
            <style>{treeStyles}</style>
            <TransformWrapper
              initialScale={0.8}
              minScale={0.3}
              maxScale={2}
              centerOnInit={true}
              wheel={{ step: 0.1 }}
            >
              <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%" }}>
                <div className="w-full h-full flex items-center justify-center p-20">
                  <div className="org-tree">
                    <ul>
                      {hierarchy['root-admin'] && hierarchy['root-admin'].map(user => renderNode(user))}
                    </ul>
                  </div>
                </div>
              </TransformComponent>
            </TransformWrapper>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
