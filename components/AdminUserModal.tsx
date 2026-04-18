
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, Language, Task, TaskStatus } from '../types';
import { translations } from '../translations';
import { STATUS_LABELS, getCompanyColor } from '../constants';

interface AdminUserModalProps {
  currentUser: User;
  users: User[];
  tasks: Task[]; 
  language: Language;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onClose: () => void;
}

const AdminUserModal: React.FC<AdminUserModalProps> = ({ currentUser, users, tasks, language, onAddUser, onUpdateUser, onDeleteUser, onClose }) => {
  const t = translations[language] || translations.vi;
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [selectedUserForTasks, setSelectedUserForTasks] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Dành cho việc chọn nhiều nhân viên cho một quản lý
  const [tempSubordinates, setTempSubordinates] = useState<string[]>([]);

  const roles: UserRole[] = ['ADMIN', 'DEPT_HEAD', 'MANAGER', 'EMPLOYEE'];
  
  const isSupervisorOf = (supervisorId: string, subordinateId: string): boolean => {
    const subordinate = users.find(u => u.id === subordinateId);
    if (!subordinate) return false;
    if (subordinate.reportsTo === supervisorId) return true;
    const supervisor = users.find(u => u.id === supervisorId);
    if (supervisor?.role === 'ADMIN') return true;
    if (supervisor?.role === 'DEPT_HEAD') return subordinate.role !== 'ADMIN';
    if (subordinate.reportsTo) return isSupervisorOf(supervisorId, subordinate.reportsTo);
    return false;
  };

  const manageableUsers = useMemo(() => {
    return users.filter(u => u.id === currentUser.id || isSupervisorOf(currentUser.id, u.id));
  }, [users, currentUser]);

  // "Là nhân viên của": Tất cả quản lý, trưởng phòng và admin
  const potentialSuperiors = useMemo(() => {
    return users.filter(u => ['ADMIN', 'DEPT_HEAD', 'MANAGER'].includes(u.role) && u.id !== editingUser?.id);
  }, [users, editingUser]);

  // "Quản lý trực tiếp": Danh sách nhân viên (hoặc cả quản lý nếu là Dept Head)
  const potentialSubordinates = useMemo(() => {
    if (!editingUser?.role) return [];
    if (editingUser.role === 'MANAGER') {
      return users.filter(u => u.role === 'EMPLOYEE' && u.id !== editingUser.id);
    }
    if (editingUser.role === 'DEPT_HEAD') {
      return users.filter(u => (u.role === 'EMPLOYEE' || u.role === 'MANAGER') && u.id !== editingUser.id);
    }
    if (editingUser.role === 'ADMIN') {
      return users.filter(u => u.id !== editingUser.id);
    }
    return [];
  }, [users, editingUser]);

  // Cập nhật danh sách subordinates tạm thời khi bắt đầu edit
  useEffect(() => {
    if (editingUser?.id) {
      const subs = users.filter(u => u.reportsTo === editingUser.id).map(u => u.id);
      setTempSubordinates(subs);
    } else {
      setTempSubordinates([]);
    }
  }, [editingUser?.id, users]);

  const handleSave = () => {
    if (!editingUser?.email || !editingUser?.fullName || !editingUser?.role || !editingUser?.jobTitle) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    
    let userResult: User;
    if (editingUser.id) {
      userResult = editingUser as User;
      onUpdateUser(userResult);
    } else {
      if (!editingUser.password) {
        alert("Vui lòng thiết lập mật khẩu");
        return;
      }
      userResult = {
        ...editingUser,
        id: crypto.randomUUID(),
        mustChangePassword: true
      } as User;
      onAddUser(userResult);
    }

    // Cập nhật quan hệ reportsTo cho các nhân sự cấp dưới được chọn
    tempSubordinates.forEach(subId => {
      const sub = users.find(u => u.id === subId);
      if (sub && sub.reportsTo !== userResult.id) {
        onUpdateUser({ ...sub, reportsTo: userResult.id });
      }
    });

    // Xóa reportsTo cho những người không còn trong danh sách tempSubordinates nhưng trước đó thuộc user này
    users.filter(u => u.reportsTo === userResult.id && !tempSubordinates.includes(u.id)).forEach(oldSub => {
      onUpdateUser({ ...oldSub, reportsTo: undefined });
    });

    setEditingUser(null);
  };

  const toggleSubordinate = (id: string) => {
    setTempSubordinates(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const employeeTasksOnDate = useMemo(() => {
    if (!selectedUserForTasks) return [];
    return tasks.filter(tk => 
      tk.userId === selectedUserForTasks.id && 
      tk.createdAt.startsWith(selectedDate) &&
      !tk.deletedAt
    );
  }, [tasks, selectedUserForTasks, selectedDate]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl md:rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col h-full md:h-[90vh] overflow-hidden">
        
        <header className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
              {selectedUserForTasks ? selectedUserForTasks.fullName : t.manageUsers}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {selectedUserForTasks ? selectedUserForTasks.jobTitle : `Hệ thống: ${manageableUsers.length} Nhân sự`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedUserForTasks && (
              <button onClick={() => setSelectedUserForTasks(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest">
                <i className="fas fa-arrow-left mr-2"></i> QUAY LẠI
              </button>
            )}
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500">
              <i className="fas fa-times text-2xl"></i>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent">
            {!selectedUserForTasks ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {manageableUsers.map(u => (
                  <div key={u.id} className="group relative flex items-center gap-4 p-5 bg-white dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-500 hover:shadow-xl transition-all">
                    <div onClick={() => setSelectedUserForTasks(u)} className="cursor-pointer flex-1 flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${
                        u.role === 'ADMIN' ? 'bg-rose-500' : u.role === 'DEPT_HEAD' ? 'bg-amber-500' : u.role === 'MANAGER' ? 'bg-indigo-500' : 'bg-slate-400'
                      }`}>
                        {u.fullName?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 dark:text-white truncate uppercase text-sm tracking-tight">{u.fullName}</p>
                        <p className="text-[10px] font-bold text-blue-500 truncate uppercase">{u.jobTitle}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-400 uppercase">{t[`role_${u.role}` as keyof typeof t]}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setEditingUser(u)} className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:scale-110"><i className="fas fa-edit text-xs"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Phần xem chi tiết Task của Nhân viên - giữ nguyên logic 30 ngày */
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lịch sử công việc (30 ngày)</label>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-6 py-3 bg-slate-50 dark:bg-slate-900 border rounded-2xl font-black text-slate-700 dark:text-white text-xs outline-none" />
                  </div>
                  <div className="flex gap-6">
                     <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tổng việc</p>
                        <p className="text-xl font-black text-slate-800 dark:text-white">{employeeTasksOnDate.length}</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Đã Xong</p>
                        <p className="text-xl font-black text-emerald-500">{employeeTasksOnDate.filter(t => t.status === TaskStatus.DONE).length}</p>
                     </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {employeeTasksOnDate.map(task => {
                    const cpColor = getCompanyColor(task.company);
                    const statusLabel = STATUS_LABELS[task.status];
                    return (
                      <div key={task.id} className={`p-5 rounded-3xl border-l-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col gap-2 border-l-${cpColor.badge.replace('bg-', '')}`}>
                        <span className={`w-fit text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${cpColor.light} ${cpColor.text}`}>{task.company}</span>
                        <p className={`font-bold text-sm text-slate-800 dark:text-white ${task.status === TaskStatus.DONE ? 'line-through opacity-40' : ''}`}>{task.content}</p>
                        <div className={`w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusLabel.color}`}>{statusLabel.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Form thêm/sửa nhân sự với logic phân cấp mới */}
          <div className="w-full lg:w-[400px] p-8 bg-slate-50 dark:bg-slate-950/30 flex flex-col gap-6 border-t lg:border-t-0 shrink-0 overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{editingUser?.id ? 'CHỈNH SỬA' : 'TẠO MỚI NHÂN SỰ'}</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t.fullName}</label>
                <input value={editingUser?.fullName || ''} onChange={e => setEditingUser(p => ({...p, fullName: e.target.value}))} placeholder="Họ và tên" className="w-full p-4 bg-white dark:bg-slate-900 border rounded-2xl outline-none font-bold text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email</label>
                <input value={editingUser?.email || ''} onChange={e => setEditingUser(p => ({...p, email: e.target.value}))} placeholder="Email" className="w-full p-4 bg-white dark:bg-slate-900 border rounded-2xl outline-none font-bold text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t.jobTitle}</label>
                <input value={editingUser?.jobTitle || ''} onChange={e => setEditingUser(p => ({...p, jobTitle: e.target.value}))} placeholder="Chức danh" className="w-full p-4 bg-white dark:bg-slate-900 border rounded-2xl outline-none font-bold text-xs" />
              </div>
              {!editingUser?.id && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Mật khẩu</label>
                  <input type="password" value={editingUser?.password || ''} onChange={e => setEditingUser(p => ({...p, password: e.target.value}))} placeholder="Mật khẩu khởi tạo" className="w-full p-4 bg-white dark:bg-slate-900 border rounded-2xl outline-none font-bold text-xs" />
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Vai trò hệ thống</label>
                <select value={editingUser?.role || ''} onChange={e => setEditingUser(p => ({...p, role: e.target.value as UserRole}))} className="w-full p-4 bg-white dark:bg-slate-900 border rounded-2xl outline-none font-bold text-xs uppercase">
                  <option value="">Chọn Vai trò</option>
                  {roles.map(r => <option key={r} value={r}>{t[`role_${r}` as keyof typeof t]}</option>)}
                </select>
              </div>

              {/* Ô chọn "Là nhân viên của" - Luôn hiển thị trừ Admin Root */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t.reportsTo}</label>
                <select value={editingUser?.reportsTo || ''} onChange={e => setEditingUser(p => ({...p, reportsTo: e.target.value}))} className="w-full p-4 bg-white dark:bg-slate-900 border rounded-2xl outline-none font-bold text-xs uppercase">
                  <option value="">Không có / Tự quản lý</option>
                  {potentialSuperiors.map(u => <option key={u.id} value={u.id}>{u.fullName} ({t[`role_${u.role}` as keyof typeof t]})</option>)}
                </select>
              </div>

              {/* Ô chọn "Quản lý trực tiếp" (Cấp dưới) - Chỉ hiển thị cho Quản lý / Trưởng phòng */}
              {editingUser?.role && editingUser.role !== 'EMPLOYEE' && (
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black text-indigo-500 uppercase ml-1 tracking-widest">{t.subordinates}</label>
                  <div className="max-h-48 overflow-y-auto p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                    {potentialSubordinates.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic py-2 text-center">Không có nhân sự khả dụng</p>
                    ) : (
                      potentialSubordinates.map(u => (
                        <div key={u.id} onClick={() => toggleSubordinate(u.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${tempSubordinates.includes(u.id) ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-slate-800 border-transparent'}`}>
                           <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center ${tempSubordinates.includes(u.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'}`}>
                              {tempSubordinates.includes(u.id) && <i className="fas fa-check text-[8px]"></i>}
                           </div>
                           <div className="min-w-0">
                              <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 truncate uppercase">{u.fullName}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">{u.jobTitle}</p>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="pt-4 space-y-3">
              <button onClick={handleSave} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl uppercase text-[10px] tracking-widest active:scale-95">
                {editingUser?.id ? 'LƯU THÔNG TIN' : 'KHỞI TẠO TÀI KHOẢN'}
              </button>
              {editingUser && (
                <button onClick={() => setEditingUser(null)} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">Hủy</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserModal;
