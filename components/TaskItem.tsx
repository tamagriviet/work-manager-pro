
import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus, Language } from '../types';
import { STATUS_LABELS, getCompanyColor } from '../constants';
import { translations } from '../translations';

interface TaskItemProps {
  task: Task;
  language: Language;
  onStatusChange?: (id: string, status: TaskStatus) => void;
  onContentChange?: (id: string, newContent: string) => void;
  onDeadlineChange?: (id: string, newDeadline?: string) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, language, onStatusChange, onContentChange, onDeadlineChange, onDelete, readOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(task.content);
  const [editDeadline, setEditDeadline] = useState(task.deadline || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (editContent.trim() && editContent !== task.content) {
      onContentChange?.(task.id, editContent.trim());
    } else {
      setEditContent(task.content);
    }
    const currentDeadline = task.deadline || '';
    if (editDeadline !== currentDeadline) {
      onDeadlineChange?.(task.id, editDeadline || undefined);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(task.content);
    setEditDeadline(task.deadline || '');
  };

  const t = translations[language] || translations.vi;
  const createdAtDate = new Date(task.createdAt);
  const formattedDate = createdAtDate.toLocaleDateString(language, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = createdAtDate.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
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
          <div className="flex flex-col items-end ml-auto gap-1">
            {task.deadline && (
              <span className={`text-[10px] font-black uppercase tracking-tight ${task.isPriority && !isDone ? 'text-rose-600 dark:text-rose-400' : 'text-blue-500 dark:text-blue-400'}`}>
                <i className="far fa-calendar-alt mr-1"></i> Hạn: {new Date(task.deadline).toLocaleDateString(language, { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            )}
            {isDone && (
              <span className="text-[10px] font-black uppercase tracking-tight text-emerald-600 dark:text-emerald-400">
                <i className="fas fa-check-double mr-1"></i> Hoàn thành: {new Date(task.updatedAt).toLocaleDateString(language, { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date(task.updatedAt).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
              <i className="far fa-clock mr-1"></i> {formattedDate} - {formattedTime}
            </span>
          </div>
        </div>
        {isEditing ? (
          <div className="w-full flex flex-col gap-2 mt-1">
            <textarea
              ref={inputRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
                if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
              className="w-full bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded-xl p-2 md:p-3 text-base md:text-lg font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 resize-none overflow-hidden transition-all"
              rows={2}
            />
            <div className="flex items-center gap-2 mt-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[70px]">Thời hạn:</label>
              <div className="relative flex-1 flex items-center">
                <input 
                  type={editDeadline ? "date" : "text"} 
                  placeholder="Không có deadline"
                  onFocus={(e) => (e.target.type = "date")}
                  onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                  value={editDeadline} 
                  onChange={e => setEditDeadline(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/50 transition-all pr-10" 
                />
                {editDeadline && (
                  <button type="button" onClick={() => setEditDeadline('')} className="absolute right-2 text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
                    Xóa
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                onClick={handleCancel}
                className="px-4 py-1.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
              >
                Lưu
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 group/edit mt-1 w-full">
            <p className={`flex-1 text-slate-800 dark:text-white font-bold text-base md:text-lg leading-snug break-words ${isDone ? 'line-through opacity-40 text-slate-400' : ''}`}>
              {task.content}
            </p>
            {!readOnly && !isDone && (
              <button 
                onClick={() => { setIsEditing(true); setEditContent(task.content); setEditDeadline(task.deadline || ''); }}
                className="opacity-0 group-hover/edit:opacity-100 transition-opacity w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 flex items-center justify-center shrink-0"
                title="Chỉnh sửa công việc"
              >
                <i className="fas fa-pen text-xs"></i>
              </button>
            )}
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="flex items-center justify-between w-full mt-2 md:mt-0">
          <div className={`flex flex-wrap sm:flex-nowrap p-1 sm:p-1.5 rounded-[1.2rem] sm:rounded-2xl border bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm ${task.isPriority ? 'border-rose-100 dark:border-rose-900' : cpColor.border + ' dark:border-slate-800'}`}>
            {/* Hiển thị 3 trạng thái: Chưa làm, Đang làm, Đã xong */}
            {[TaskStatus.NOT_STARTED, TaskStatus.IN_PROGRESS, TaskStatus.DONE].map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange?.(task.id, status)}
                className={`px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex-1 text-center ${
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
