
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import TaskItem from './components/TaskItem';
import Login from './components/Login';
import Setup from './components/Setup';
import HistoryModal from './components/HistoryModal';
import ExportModal from './components/ExportModal';
import SettingsModal from './components/SettingsModal';
import ManageCompaniesModal from './components/ManageCompaniesModal';
import AdminUserModal from './components/AdminUserModal';
import AdminDashboard from './components/AdminDashboard';
import TeamSummary from './components/TeamSummary';
import { Task, TaskStatus, AppState, User, UserRole, Language, Theme } from './types';
import { loadStateSecure } from './services/storageService';
import { translations } from './translations';
import { initSocket, broadcastState, getSocket, dispatchAction } from './services/socketService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);
  const isRemoteUpdateRef = React.useRef(false);
  const [loading, setLoading] = useState(false);
  const [modals, setModals] = useState({
    history: false,
    export: false,
    settings: false,
    manageCompanies: false,
    manageUsers: false,
    userToEdit: null as User | null,
    userToView: null as User | null,
    currentDepartmentId: null as string | null,
  });
  const [currentView, setCurrentView] = useState<'PERSONAL' | 'TEAM'>('PERSONAL');
  const [selectedTeamMember, setSelectedTeamMember] = useState<User | null>(null);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const currentLanguage = state?.settings?.language || 'vi';
  const currentTheme = state?.settings?.theme || 'light';
  const t = translations[currentLanguage] || translations.vi;
  const isRootAdmin = state?.currentUser?.email === 'tam.agriviet@gmail.com';

  const [mobileViewMode, setMobileViewMode] = useState<'ADD_TASK' | 'TASK_LIST'>('ADD_TASK');

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onUpdateAvailable((info: any) => {
        setNotifications(prev => [{ id: Date.now(), text: `Đang tải bản cập nhật ${info.version}...`, isRead: false, type: 'update-progress' }, ...prev]);
      });
      window.electronAPI.onUpdateDownloaded((info: any) => {
        setNotifications(prev => {
          const filtered = prev.filter(n => n.type !== 'update-progress');
          return [{ id: Date.now(), text: `Phiên bản mới ${info.version} đã sẵn sàng. Bấm để khởi động lại.`, isRead: false, type: 'update-ready' }, ...filtered];
        });
      });
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (currentTheme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [currentTheme]);

  const handleLogin = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const loaded = await loadStateSecure(email, pass);
      setState(loaded);
    } catch (e: any) { 
      alert(e.message); 
    }
    finally { setLoading(false); }
  };


  const handleLogout = () => {
    localStorage.removeItem('auto_login');
    setState(null);
    setCurrentView('PERSONAL');
    setSelectedTeamMember(null);
  };

  useEffect(() => {
    const socket = initSocket();
    socket.on('state-updated', (updatedDb: any) => {
      isRemoteUpdateRef.current = true;
      setState(p => {
        if (!p) return p;
        return {
          ...p,
          users: updatedDb.users || [],
          tasks: updatedDb.tasks || [],
          departments: updatedDb.departments || p.departments || [],
          templates: updatedDb.templates || [],
          settings: updatedDb.settings || p.settings
        };
      });
      // Reset flag after state update
      setTimeout(() => { isRemoteUpdateRef.current = false; }, 500);
    });

    socket.on('force-logout', (userId: string) => {
      setState(p => {
        if (p && p.currentUser && p.currentUser.id === userId) {
          alert('Tài khoản của bạn đã được đăng nhập từ một thiết bị khác. Bạn đã bị đăng xuất.');
          localStorage.removeItem('auto_login');
          return null;
        }
        return p;
      });
    });

    return () => {
      socket.off('state-updated');
      socket.off('force-logout');
    };
  }, []);

  useEffect(() => {
    if (state && state.currentUser) {
      const socket = initSocket();
      socket.emit('user-login', state.currentUser.id);
    }
  }, [state?.currentUser?.id]);



  // Auto-recover departments if they were lost due to previous server sync bug
  useEffect(() => {
    if (state && state.users) {
      const existingDeptIds = new Set((state.departments || []).map(d => d.id));
      const missingDeptIds = new Set<string>();
      
      state.users.forEach(u => {
        if (u.departmentId && u.departmentId !== 'root-admin' && !existingDeptIds.has(u.departmentId)) {
          missingDeptIds.add(u.departmentId);
        }
      });
      
      if (missingDeptIds.size > 0) {
        const recoveredDepts = Array.from(missingDeptIds).map(id => {
          // Cố gắng tìm tên phòng ban từ trường legacy 'department' nếu có
          const userWithLegacyDept = state.users.find(u => u.departmentId === id && u.department);
          return {
            id,
            name: userWithLegacyDept?.department || 'Sơ đồ phòng ban ' + id.substring(0, 4),
            createdAt: new Date().toISOString()
          };
        });
        
        // Cập nhật local state
        setState(p => p ? { ...p, departments: [...(p.departments || []), ...recoveredDepts] } : null);
        
        // Lưu vĩnh viễn vào server để không bị mất khi cài đè hoặc reset app
        recoveredDepts.forEach(dept => {
          dispatchAction({ type: 'ADD_DEPARTMENT', payload: dept });
        });
      }
    }
  }, [state?.users, state?.departments]);

  const directSubordinates = useMemo(() => {
    if (!state) return [];
    return state.users.filter(u => u.reportsTo === state.currentUser.id);
  }, [state]);

  const isManagerOfSelected = useMemo(() => {
    if (!state || !selectedTeamMember) return false;
    return selectedTeamMember.reportsTo === state.currentUser.id;
  }, [state, selectedTeamMember]);

  const filteredTasks = useMemo(() => {
    if (!state) return [];
    const today = new Date().toISOString().split('T')[0];
    let baseTasks: Task[] = [];
    
    if (currentView === 'PERSONAL') {
      baseTasks = state.tasks.filter(tk => tk.userId === state.currentUser.id && !tk.deletedAt);
    } else if (selectedTeamMember && (isRootAdmin || isManagerOfSelected)) {
      // Khi xem task của nhân viên, ưu tiên hiển thị các task liên quan đến hôm nay
      baseTasks = state.tasks.filter(tk => 
        tk.userId === selectedTeamMember.id && 
        !tk.deletedAt &&
        (tk.createdAt.startsWith(today) || (tk.status === TaskStatus.DONE && tk.updatedAt.startsWith(today)))
      );
    } else {
      return [];
    }

    return [...baseTasks].sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [state, currentView, selectedTeamMember, isRootAdmin, isManagerOfSelected]);

  const stats = useMemo(() => {
    if (!state) return { active: 0, doneToday: 0 };
    const today = new Date().toISOString().split('T')[0];
    
    let pool: Task[] = [];
    if (currentView === 'PERSONAL') {
      pool = (state.tasks || []).filter(tk => tk.userId === state.currentUser.id && !tk.deletedAt);
    } else {
      const directIds = directSubordinates.map(u => u.id);
      pool = (state.tasks || []).filter(tk => directIds.includes(tk.userId) && !tk.deletedAt);
    }
      
    return {
      active: pool.filter(tk => tk.status !== TaskStatus.DONE).length,
      doneToday: pool.filter(tk => tk.status === TaskStatus.DONE && tk.updatedAt.startsWith(today)).length
    };
  }, [state, currentView, directSubordinates]);

  const handleDeleteTask = (id: string) => {
    if (window.confirm(t.confirmDeleteTask)) {
      const deletedAt = new Date().toISOString();
      setState(p => p ? ({...p, tasks: p.tasks.map(t => t.id === id ? {...t, deletedAt} : t)}) : null);
      dispatchAction({ type: 'DELETE_TASK', payload: { id, deletedAt } });
    }
  };

  const updateCurrentUserCompanies = (newCompanies: string[]) => {
    setState(p => {
      if (!p) return null;
      const updatedUser = { ...p.currentUser, companies: newCompanies };
      return {
        ...p,
        currentUser: updatedUser,
        users: p.users.map(u => u.id === updatedUser.id ? updatedUser : u)
      };
    });
    dispatchAction({ type: 'UPDATE_USER_COMPANIES', payload: { id: state?.currentUser?.id, companies: newCompanies } });
  };

  const handleUpdatePassword = (newPass: string) => {
    setState(p => {
      if (!p) return null;
      const updatedUser = { ...p.currentUser, password: newPass };
      return {
        ...p,
        currentUser: updatedUser,
        users: p.users.map(u => u.id === updatedUser.id ? updatedUser : u)
      };
    });
    dispatchAction({ type: 'UPDATE_USER_PASSWORD', payload: { id: state?.currentUser?.id, password: newPass } });
  };

  const handleAddDepartment = (name: string) => {
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
      return 'dept_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    };
    const newDept = { id: generateId(), name };
    setState(p => p ? ({...p, departments: [...(p.departments || []), newDept]}) : null);
    dispatchAction({ type: 'ADD_DEPARTMENT', payload: newDept });
  };

  const handleUpdateDepartment = (id: string, name: string) => {
    setState(p => p ? ({...p, departments: (p.departments || []).map(d => d.id === id ? { ...d, name } : d)}) : null);
    dispatchAction({ type: 'UPDATE_DEPARTMENT', payload: { id, name } });
  };

  const handleDeleteDepartment = (id: string) => {
    setState(p => p ? ({
      ...p, 
      departments: (p.departments || []).filter(d => d.id !== id),
      // Set departmentId to undefined for all users in this department
      users: (p.users || []).map(u => u.departmentId === id ? { ...u, departmentId: undefined } : u)
    }) : null);
    dispatchAction({ type: 'DELETE_DEPARTMENT', payload: { id } });
  };

  if (!state) return <Login onLogin={handleLogin} />;

  const hasNoCompanies = !state.currentUser.companies || state.currentUser.companies.length === 0;
  
  if (!isRootAdmin && hasNoCompanies) {
    return (
      <Setup 
        initialFullName={state.currentUser.fullName}
        initialJobTitle={state.currentUser.jobTitle}
        onComplete={(f, j, c) => {
          setState(p => {
            if (!p) return null;
            const updatedUser = { ...p.currentUser, fullName: f, jobTitle: j, companies: c };
            return {
              ...p,
              currentUser: updatedUser,
              users: p.users.map(u => u.id === updatedUser.id ? updatedUser : u)
            };
          });
          dispatchAction({ type: 'SETUP_USER', payload: { id: state?.currentUser?.id, fullName: f, jobTitle: j, companies: c } });
        }} 
        onLogout={handleLogout} 
      />
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-slate-950 theme-transition relative">
      {/* Status Bar / Top Menu Title for Mobile (iOS Safe Area) */}
      <div 
        className="md:hidden w-full bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-end justify-center pb-3 z-[60] shadow-sm relative"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)', minHeight: 'calc(50px + env(safe-area-inset-top))' }}
      >
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">{t.appName}</span>
      </div>

      <div className={`flex-1 flex flex-col md:flex-row overflow-hidden relative ${!isRootAdmin && mobileViewMode === 'ADD_TASK' ? 'pb-[85px] md:pb-0' : ''}`}>
        <Sidebar 
          currentUser={state.currentUser}
          companies={state.currentUser.companies || []}
          departments={state.departments || []}
          language={currentLanguage}
          appLogo={state.settings.appLogo}
          onAddTask={(content, company, isPriority) => {
            const generateId = () => {
              if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
              return 'task_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
            };
            const newTask: Task = { id: generateId(), userId: state.currentUser.id, content, company, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: TaskStatus.NOT_STARTED, isPriority };
            setState(prev => prev ? ({ ...prev, tasks: [newTask, ...prev.tasks] }) : null);
            dispatchAction({ type: 'ADD_TASK', payload: newTask });
          }} 
          onAddCompany={c => updateCurrentUserCompanies([...(state.currentUser.companies || []), c])}
          onOpenManageCompanies={() => setModals(m => ({...m, manageCompanies: true}))}
          onClearAll={() => {}} 
          onLogout={handleLogout}
          onOpenHistory={() => setModals(m => ({...m, history: true}))}
          onOpenExport={() => setModals(m => ({...m, export: true}))}
          onOpenSettings={() => setModals(m => ({...m, settings: true}))}
          onOpenManageUsers={() => setModals(m => ({...m, manageUsers: true}))}
          onAddDepartment={handleAddDepartment}
        />

        <main className={`flex-1 flex-col min-w-0 bg-slate-50 dark:bg-slate-950 overflow-hidden theme-transition ${isRootAdmin ? 'flex relative' : (mobileViewMode === 'TASK_LIST' ? 'fixed inset-0 z-[70] flex animate-in slide-in-from-bottom duration-300 md:relative md:z-0 md:flex md:inset-auto md:animate-none' : 'hidden md:flex relative')}`}>
          {/* If on mobile and in TASK_LIST mode, we already have a top bar from above if we want, but wait, the top bar is outside main. So it's fine. */}
          {/* Actually we should pad top safe area for main if it is fixed inset-0 */}
          {mobileViewMode === 'TASK_LIST' && !isRootAdmin && (
             <div className="md:hidden w-full h-[calc(env(safe-area-inset-top)+60px)] bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-end justify-center pb-3 shrink-0 shadow-sm relative z-50" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}>
               <button onClick={() => setMobileViewMode('ADD_TASK')} className="absolute left-4 bottom-2 text-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 active:scale-95">
                 <i className="fas fa-chevron-down text-lg"></i>
               </button>
               <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">Danh sách việc</span>
             </div>
          )}

          {isRootAdmin ? (
            <AdminDashboard 
              users={state.users} 
              tasks={state.tasks || []} 
              departments={state.departments || []}
              onAddDepartment={handleAddDepartment}
              onUpdateDepartment={handleUpdateDepartment}
              onDeleteDepartment={handleDeleteDepartment}
              language={currentLanguage}
              onSelectUser={u => setModals(m => ({...m, manageUsers: true, userToView: u}))}
              onEditUser={u => setModals(m => ({...m, manageUsers: true, userToEdit: u}))}
              notifications={notifications}
              setNotifications={setNotifications}
              showNotifications={showNotifications}
              setShowNotifications={setShowNotifications}
              unreadCount={unreadCount}
              onAddUser={(deptId?: string) => setModals(m => ({...m, manageUsers: true, currentDepartmentId: deptId || null}))}
              onLogout={handleLogout}
              onSettings={() => setModals(m => ({...m, settings: true}))}
            />
          ) : (
            <>
              <header className="min-h-[90px] md:min-h-[110px] py-4 px-4 md:px-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-10 shadow-sm transition-all shrink-0">
                <div className="flex items-center gap-3 md:gap-6">
                  <button onClick={() => { setCurrentView('PERSONAL'); setSelectedTeamMember(null); }} className={`flex flex-col items-start transition-all ${currentView === 'PERSONAL' ? 'opacity-100 md:scale-105' : 'opacity-30 hover:opacity-50'}`}>
                    <h2 className="text-base md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t.currentTasks}</h2>
                    <span className="text-[9px] md:text-[10px] font-black uppercase text-blue-500 tracking-widest hidden sm:inline-block">{state.currentUser.fullName}</span>
                  </button>
                  {state.currentUser.role !== 'EMPLOYEE' && (
                    <button onClick={() => { setCurrentView('TEAM'); setSelectedTeamMember(null); }} className={`flex flex-col items-start transition-all ${currentView === 'TEAM' ? 'opacity-100 md:scale-105' : 'opacity-30 hover:opacity-50'}`}>
                      <h2 className="text-base md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t.teamTasks}</h2>
                      <span className="text-[9px] md:text-[10px] font-black uppercase text-amber-500 tracking-widest hidden sm:inline-block">Team Monitor</span>
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-4 md:gap-10">
                  <div className="relative">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all border border-slate-100 dark:border-slate-700 relative shadow-sm">
                      <i className="fas fa-bell"></i>
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
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
                              setNotifications(prev => prev.map(x => x.id === n.id ? {...x, isRead: true} : x));
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

                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{currentView === 'PERSONAL' ? 'Đang xử lý' : 'Tổng việc chưa xong'}</p>
                    <p className="text-xl md:text-2xl font-black text-rose-500 leading-none">{stats.active}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.doneToday}</p>
                    <p className="text-xl md:text-2xl font-black text-emerald-500 leading-none">{stats.doneToday}</p>
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar relative">
                <div className="max-w-6xl mx-auto pb-24">
                  {currentView === 'TEAM' && !selectedTeamMember ? (
                    <TeamSummary 
                      subordinates={directSubordinates}
                      tasks={state.tasks}
                      language={currentLanguage}
                      onSelectUser={setSelectedTeamMember}
                      isDrillDownEnabled={true}
                    />
                  ) : (
                    <div className="max-w-4xl mx-auto space-y-4">
                      {selectedTeamMember && (
                        <div className="mb-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">
                              {selectedTeamMember.fullName.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{selectedTeamMember.fullName}</h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Công việc trong ngày</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setSelectedTeamMember(null)}
                            className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center gap-2 transition-colors"
                          >
                            <i className="fas fa-arrow-left"></i> Quay lại
                          </button>
                        </div>
                      )}
                      {filteredTasks.length === 0 ? (
                        <div className="py-20 text-center opacity-30 italic font-bold text-slate-400 uppercase tracking-[0.2em]">
                          {t.noTasks}
                        </div>
                      ) : (
                        filteredTasks.map(task => (
                          <TaskItem 
                            key={task.id} 
                            task={task} 
                            language={currentLanguage} 
                            readOnly={currentView === 'TEAM'}
                            onStatusChange={(id, status) => {
                              const updatedAt = new Date().toISOString();
                              setState(p => p ? ({...p, tasks: p.tasks.map(t => t.id === id ? {...t, status, updatedAt} : t)}) : null);
                              dispatchAction({ type: 'UPDATE_TASK_STATUS', payload: { id, status, updatedAt } });
                            }}
                            onDelete={handleDeleteTask} 
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Bottom Menu Navigation for Mobile */}
      {!isRootAdmin && (
        <div className="md:hidden fixed bottom-0 left-0 w-full h-[85px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 flex z-[60] pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => {
              setMobileViewMode('ADD_TASK');
            }} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${mobileViewMode === 'ADD_TASK' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <div className={`w-12 h-8 rounded-full flex items-center justify-center transition-all ${mobileViewMode === 'ADD_TASK' ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}>
               <i className="fas fa-plus text-lg"></i>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Thêm việc</span>
          </button>
          
          <button 
            onClick={() => {
              setCurrentView('PERSONAL');
              setMobileViewMode('TASK_LIST');
            }} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${mobileViewMode === 'TASK_LIST' && currentView === 'PERSONAL' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <div className={`w-12 h-8 rounded-full flex items-center justify-center transition-all ${mobileViewMode === 'TASK_LIST' && currentView === 'PERSONAL' ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}>
              <i className="fas fa-list-check text-lg"></i>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Việc của tôi</span>
          </button>
          
          {state.currentUser.role !== 'EMPLOYEE' && (
            <button 
              onClick={() => {
                setCurrentView('TEAM');
                setMobileViewMode('TASK_LIST');
              }} 
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${mobileViewMode === 'TASK_LIST' && currentView === 'TEAM' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <div className={`w-12 h-8 rounded-full flex items-center justify-center transition-all ${mobileViewMode === 'TASK_LIST' && currentView === 'TEAM' ? 'bg-amber-100 dark:bg-amber-900/30' : ''}`}>
                <i className="fas fa-users text-lg"></i>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Đội ngũ</span>
            </button>
          )}
        </div>
      )}

      {modals.manageUsers && (
        <AdminUserModal 
          currentUser={state.currentUser}
          users={state.users}
          tasks={state.tasks}
          departments={state.departments || []}
          language={currentLanguage}
          currentDepartmentId={modals.currentDepartmentId}
          onAddUser={u => { setState(p => p ? ({...p, users: [...p.users, u]}) : null); dispatchAction({ type: 'ADD_USER', payload: u }); }}
          onUpdateUser={u => { setState(p => p ? ({...p, users: p.users.map(old => old.id === u.id ? u : old)}) : null); dispatchAction({ type: 'UPDATE_USER', payload: u }); }}
          onDeleteUser={id => { setState(prev => prev ? ({...prev, users: prev.users.filter(u => u.id !== id)}) : null); dispatchAction({ type: 'DELETE_USER', payload: { id } }); }}
          onClose={() => setModals(m => ({...m, manageUsers: false, userToEdit: null, userToView: null, currentDepartmentId: null}))}
        />
      )}
      
      {modals.settings && (
        <SettingsModal 
          language={currentLanguage} 
          theme={currentTheme} 
          appLogo={state.settings.appLogo}
          currentUser={state.currentUser}
          onUpdate={(l, theme, appLogo) => { setState(p => p ? ({...p, settings: {language: l, theme, appLogo}}) : null); dispatchAction({ type: 'UPDATE_SETTINGS', payload: {language: l, theme, appLogo} }); }} 
          onUpdatePassword={handleUpdatePassword}
          onClose={() => setModals(m => ({...m, settings: false}))} 
        />
      )}
      {modals.manageCompanies && <ManageCompaniesModal companies={state.currentUser.companies || []} language={currentLanguage} onAdd={c => updateCurrentUserCompanies([...(state.currentUser.companies || []), c])} onRename={(o, n) => updateCurrentUserCompanies((state.currentUser.companies || []).map(c => c === o ? n : c))} onDelete={c => updateCurrentUserCompanies((state.currentUser.companies || []).filter(x => x !== c))} onClose={() => setModals(m => ({...m, manageCompanies: false}))} />}
      {modals.history && <HistoryModal tasks={state.tasks.filter(t => !t.deletedAt && t.userId === state.currentUser.id)} onClose={() => setModals(m => ({...m, history: false}))} />}
      {modals.export && <ExportModal tasks={state.tasks.filter(t => t.userId === state.currentUser.id && !t.deletedAt)} subordinateTasks={state.tasks.filter(t => !t.deletedAt && directSubordinates.some(u => u.id === t.userId))} templates={state.templates || []} onSaveTemplate={tpl => { setState(p => p ? ({...p, templates: [...(p.templates || []), tpl]}) : null); dispatchAction({ type: 'ADD_TEMPLATE', payload: tpl }); }} onDeleteTemplate={id => { setState(p => p ? ({...p, templates: (p.templates || []).filter(x => x.id !== id)}) : null); dispatchAction({ type: 'DELETE_TEMPLATE', payload: { id } }); }} onClose={() => setModals(m => ({...m, export: false}))} />}
    </div>
  );
};

export default App;
