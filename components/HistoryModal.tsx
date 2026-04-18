
import React, { useState } from 'react';
import { Task } from '../types';
import TaskItem from './TaskItem';

interface HistoryModalProps {
  tasks: Task[];
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ tasks, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredTasks = tasks.filter(t => t.createdAt.startsWith(selectedDate));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full h-full md:h-auto md:max-w-4xl bg-white md:rounded-[3rem] shadow-2xl flex flex-col max-h-[100vh] md:max-h-[90vh] overflow-hidden">
        <header className="p-4 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-white z-10 gap-4 shrink-0">
          <div className="flex items-center justify-between sm:block">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Lịch sử</h2>
            <button onClick={onClose} className="sm:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <i className="far fa-calendar-alt absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"></i>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-12 pr-6 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl font-bold text-slate-700 outline-none transition-all text-xs md:text-sm"
              />
            </div>
            <button onClick={onClose} className="hidden sm:flex w-12 h-12 items-center justify-center rounded-2xl hover:bg-slate-100 text-slate-400 transition-colors">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-50/50">
          {filteredTasks.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300 italic text-center px-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                <i className="fas fa-history text-2xl opacity-20"></i>
              </div>
              <p className="font-bold text-[9px] md:text-[10px] uppercase tracking-widest opacity-40">Không tìm thấy bản ghi nào trong ngày này</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {filteredTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  readOnly={true}
                />
              ))}
            </div>
          )}
        </div>
        
        <footer className="p-4 md:p-6 bg-white border-t border-slate-100 flex justify-between items-center text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] shrink-0">
          <span>{filteredTasks.length} Mục</span>
          <span className="flex items-center gap-2">
            <i className="fas fa-shield-alt text-emerald-500"></i> <span className="hidden sm:inline">Dữ liệu an toàn</span>
          </span>
        </footer>
      </div>
    </div>
  );
};

export default HistoryModal;
