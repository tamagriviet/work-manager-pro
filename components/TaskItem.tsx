
import React from 'react';
import { Task, TaskStatus, Language } from '../types';
import { STATUS_LABELS, getCompanyColor } from '../constants';
import { translations } from '../translations';

interface TaskItemProps {
  task: Task;
  language: Language;
  onStatusChange?: (id: string, status: TaskStatus) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, language, onStatusChange, onDelete, readOnly = false }) => {
  const t = translations[language] || translations.vi;
  const formattedTime = new Date(task.createdAt).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
  const cpColor = getCompanyColor(task.company);
  const isDone = task.status === TaskStatus.DONE;
  const isNotStarted = task.status === TaskStatus.NOT_STARTED;

  return (
    <div className={`group p-4 md:p-6 rounded-[1.2rem] md:rounded-[1.5rem] border-l-[6px] border-t border-r border-b transition-all flex flex-col items-start gap-4 md:gap-6 ${
      isDone ? 'opacity-50 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800' : 
      task.isPriority ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 border-l-rose-500 shadow-rose-100/50 shadow-lg' : 
      `${cpColor.bg} dark:bg-slate-900/40 ${cpColor.border} dark:border-slate-800 border-l-${cpColor.badge.replace('bg-', '')}`
    } ${!isDone && !readOnly && 'hover:shadow-lg hover:-translate-y-0.5'}`}>
      
      <div className="w-full min-w-0">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {task.status === TaskStatus.IN_PROGRESS && (
            <span className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-black px-2.5 py-1 rounded-full bg-blue-600 text-white uppercase tracking-widest animate-pulse">
              <i className="fas fa-spinner fa-spin text-[8px]"></i> {t.IN_PROGRESS}
            </span>
          )}
          {isNotStarted && (
            <span className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-black px-2.5 py-1 rounded-full bg-slate-400 text-white uppercase tracking-widest">
              <i className="fas fa-pause-circle text-[8px]"></i> {t.NOT_STARTED}
            </span>
          )}
          {isDone && (
            <span className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-black px-2.5 py-1 rounded-full bg-emerald-600 text-white uppercase tracking-widest">
              <i className="fas fa-check-circle text-[8px]"></i> {t.DONE}
            </span>
          )}
          {task.isPriority && (
            <span className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-black px-2.5 py-1 rounded-full bg-rose-600 text-white uppercase tracking-widest shadow-sm">
              <i className="fas fa-bolt text-[8px]"></i> {t.isPriority}
            </span>
          )}
          <span className={`text-[9px] md:text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
            task.isPriority ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400' : `${cpColor.light} dark:bg-slate-800 ${cpColor.text}`
          }`}>
            {task.company}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight ml-auto">
            <i className="far fa-clock mr-1"></i> {formattedTime}
          </span>
        </div>
        <p className={`text-slate-800 dark:text-white font-bold text-base md:text-lg leading-snug break-words ${isDone ? 'line-through opacity-40 text-slate-400' : ''}`}>
          {task.content}
        </p>
      </div>

      {!readOnly && (
        <div className="flex items-center justify-between w-full mt-2 md:mt-0">
          <div className={`flex p-1.5 rounded-2xl border bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm ${task.isPriority ? 'border-rose-100 dark:border-rose-900' : cpColor.border + ' dark:border-slate-800'}`}>
            {/* Hiển thị 3 trạng thái: Chưa làm, Đang làm, Đã xong */}
            {[TaskStatus.NOT_STARTED, TaskStatus.IN_PROGRESS, TaskStatus.DONE].map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange?.(task.id, status)}
                className={`px-4 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                  task.status === status
                    ? STATUS_LABELS[status].color + " shadow-md scale-105"
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
                }`}
              >
                {t[status]}
              </button>
            ))}
          </div>
          <button
            onClick={() => onDelete?.(task.id)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
          >
            <i className="fas fa-trash-alt"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
