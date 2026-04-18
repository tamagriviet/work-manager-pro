
import React, { useMemo } from 'react';
import { User, Task, TaskStatus, Language } from '../types';
import { translations } from '../translations';

interface TeamSummaryProps {
  subordinates: User[];
  tasks: Task[];
  language: Language;
  onSelectUser?: (user: User) => void;
  isDrillDownEnabled?: boolean;
}

const TeamSummary: React.FC<TeamSummaryProps> = ({ subordinates, tasks, language, onSelectUser, isDrillDownEnabled = false }) => {
  const t = translations[language] || translations.vi;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {subordinates.map(user => {
        // QUAN TRỌNG: Chỉ đếm các task của chính user.id này (không đếm task của cấp dưới của họ)
        const userTasksToday = tasks.filter(tk => 
          tk.userId === user.id && 
          !tk.deletedAt &&
          (tk.createdAt.startsWith(today) || (tk.status === TaskStatus.DONE && tk.updatedAt.startsWith(today)))
        );
        
        const completedTasks = userTasksToday.filter(tk => tk.status === TaskStatus.DONE).length;
        const totalTasks = userTasksToday.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return (
          <div 
            key={user.id} 
            onClick={() => isDrillDownEnabled && onSelectUser?.(user)}
            className={`group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden transition-all ${isDrillDownEnabled ? 'cursor-pointer hover:shadow-xl hover:border-blue-500' : 'cursor-default'}`}
          >
            <div className="absolute top-0 right-0 p-4">
               <div className={`w-2 h-2 rounded-full ${totalTasks > 0 && progress === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-black text-slate-400 transition-all shadow-inner ${isDrillDownEnabled ? 'group-hover:bg-blue-600 group-hover:text-white' : ''}`}>
                {user.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase truncate tracking-tight">{user.fullName}</h4>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest truncate">{user.jobTitle}</p>
                <span className="text-[8px] font-black px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-400 mt-1 inline-block uppercase">
                  {t[`role_${user.role}` as keyof typeof t]}
                </span>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Công việc cá nhân</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">{completedTasks}<span className="text-slate-300 dark:text-slate-600 mx-1">/</span>{totalTasks}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${progress === 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600'} uppercase tracking-tighter`}>
                      {Math.round(progress)}%
                    </span>
                  </div>
               </div>

               <div className="w-full h-2 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
               </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                 {isDrillDownEnabled ? 'Click để xem chi tiết' : 'Chỉ số hiệu suất'}
               </span>
               {isDrillDownEnabled && (
                 <i className="fas fa-chevron-right text-slate-300 group-hover:translate-x-1 transition-transform"></i>
               )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TeamSummary;
