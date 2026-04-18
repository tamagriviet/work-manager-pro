
import React, { useState, useMemo, useRef } from 'react';
import { Task, ReportTemplate, ReportLayout, TaskStatus } from '../types';
import { getCompanyColor } from '../constants';

interface ExportModalProps {
  tasks: Task[];
  templates: ReportTemplate[];
  onSaveTemplate: (template: ReportTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ tasks, templates, onSaveTemplate, onDeleteTemplate, onClose }) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [layout, setLayout] = useState<ReportLayout>('FLAT');

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const taskDate = t.createdAt.split('T')[0];
      return taskDate >= startDate && taskDate <= endDate;
    });
  }, [tasks, startDate, endDate]);

  const groupedTasks = useMemo<Record<string, Task[]> | null>(() => {
    if (layout !== 'GROUPED_BY_COMPANY') return null;
    const groups: Record<string, Task[]> = {};
    filteredTasks.forEach(task => {
      if (!groups[task.company]) groups[task.company] = [];
      groups[task.company].push(task);
    });
    return groups;
  }, [filteredTasks, layout]);

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleExportCSV = () => {
    let csvContent = "\ufeff"; // UTF-8 BOM for Excel support
    
    if (layout === 'FLAT') {
      csvContent += "Công ty,Nội dung công việc,Đang làm,Ngày tạo,Trạng thái\n";
      filteredTasks.forEach(t => {
        const company = t.company.replace(/"/g, '""');
        const content = t.content.replace(/"/g, '""');
        const pending = t.status !== TaskStatus.DONE ? content : "";
        const date = formatDate(t.createdAt.split('T')[0]);
        const status = t.status === TaskStatus.DONE ? "Đã xong" : "Chưa xong";
        csvContent += `"${company}","${content}","${pending}","${date}","${status}"\n`;
      });
    } else {
      csvContent += "Công ty,Nội dung tóm tắt,Đang thực hiện\n";
      (Object.entries(groupedTasks || {}) as [string, Task[]][]).forEach(([company, tks]) => {
        const cName = company.replace(/"/g, '""');
        const summary = tks.map((tk, i) => `${i + 1}. ${tk.content}`).join('\n').replace(/"/g, '""');
        const pending = tks.filter(tk => tk.status !== TaskStatus.DONE).map((tk, i) => `${i + 1}. ${tk.content}`).join('\n').replace(/"/g, '""');
        csvContent += `"${cName}","${summary}","${pending}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Bao_Cao_${startDate}.csv`;
    link.click();
  };

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await (window as any).html2canvas(reportRef.current, { 
        scale: 2, 
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Bao_Cao_${startDate}.png`;
      link.click();
    } catch (err) {
      alert("Xuất ảnh lỗi. Vui lòng thử lại!");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full h-full md:h-auto md:max-w-6xl bg-white md:rounded-[3rem] shadow-2xl flex flex-col max-h-[100vh] md:max-h-[95vh] overflow-hidden">
        <header className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Xuất báo cáo tuần</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Dữ liệu cá nhân</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-slate-50 text-slate-300">
            <i className="fas fa-times text-xl"></i>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Từ ngày</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đến ngày</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bố cục</label>
            <div className="flex gap-4">
               <button onClick={() => setLayout('FLAT')} className={`flex-1 p-4 rounded-2xl border-2 transition-all ${layout === 'FLAT' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-white text-slate-400'} font-black uppercase text-[10px]`}>Chi tiết từng việc</button>
               <button onClick={() => setLayout('GROUPED_BY_COMPANY')} className={`flex-1 p-4 rounded-2xl border-2 transition-all ${layout === 'GROUPED_BY_COMPANY' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-white text-slate-400'} font-black uppercase text-[10px]`}>Gộp theo công ty</button>
            </div>
          </div>

          <div className="border border-slate-100 rounded-[2rem] bg-white overflow-hidden shadow-inner">
             <div ref={reportRef} className="p-10 bg-white min-w-[700px]">
                <div className="text-center mb-8">
                   <h1 className="text-2xl font-black text-slate-800 uppercase">BÁO CÁO CÔNG VIỆC TUẦN</h1>
                   <p className="text-xs font-bold text-slate-400 mt-2 uppercase">Thời gian: {formatDate(startDate)} - {formatDate(endDate)}</p>
                </div>
                <table className="w-full border-collapse">
                   <thead>
                      <tr className="bg-slate-50">
                        {layout === 'FLAT' ? (
                          <>
                            <th className="p-4 border text-[10px] font-black uppercase text-left">Công ty</th>
                            <th className="p-4 border text-[10px] font-black uppercase text-left">Nội dung</th>
                            <th className="p-4 border text-[10px] font-black uppercase text-left">Đang làm</th>
                            <th className="p-4 border text-[10px] font-black uppercase text-center">Ngày</th>
                          </>
                        ) : (
                          <>
                            <th className="p-4 border text-[10px] font-black uppercase text-left">Công ty</th>
                            <th className="p-4 border text-[10px] font-black uppercase text-left">Tóm tắt công việc</th>
                            <th className="p-4 border text-[10px] font-black uppercase text-left">Đang thực hiện</th>
                          </>
                        )}
                      </tr>
                   </thead>
                   <tbody>
                      {layout === 'FLAT' ? (
                        filteredTasks.map(t => {
                          const cpColor = getCompanyColor(t.company);
                          return (
                            <tr key={t.id}>
                               <td className="p-4 border">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cpColor.light} ${cpColor.text}`}>
                                    {t.company}
                                  </span>
                               </td>
                               <td className="p-4 border text-[11px] text-slate-700 font-bold">{t.content}</td>
                               <td className="p-4 border text-[11px] text-blue-600 font-black">{t.status !== TaskStatus.DONE ? t.content : ""}</td>
                               <td className="p-4 border text-[11px] text-center text-slate-400 font-bold">{formatDate(t.createdAt.split('T')[0])}</td>
                            </tr>
                          );
                        })
                      ) : (
                        (Object.entries(groupedTasks || {}) as [string, Task[]][]).map(([company, tks]) => {
                          const cpColor = getCompanyColor(company);
                          return (
                            <tr key={company}>
                               <td className="p-4 border align-top">
                                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cpColor.badge} text-white`}>
                                    {company}
                                  </span>
                               </td>
                               <td className="p-4 border text-[11px] text-slate-700 whitespace-pre-line align-top font-bold">
                                  {tks.map((tk, i) => `${i + 1}. ${tk.content}`).join('\n')}
                                </td>
                               <td className="p-4 border text-[11px] text-blue-600 font-black whitespace-pre-line align-top">
                                  {tks.filter(tk => tk.status !== TaskStatus.DONE).map((tk, i) => `${i + 1}. ${tk.content}`).join('\n') || "-"}
                               </td>
                            </tr>
                          );
                        })
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>

        <footer className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 shrink-0">
           <button onClick={handleExportCSV} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all">
              <i className="fas fa-file-excel mr-2"></i> Xuất EXCEL
           </button>
           <button onClick={handleExportImage} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all">
              <i className="fas fa-file-image mr-2"></i> Xuất ẢNH
           </button>
        </footer>
      </div>
    </div>
  );
};

export default ExportModal;
