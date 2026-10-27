import React, { useState, useMemo, useRef } from 'react';
import { Task, ReportTemplate, ReportLayout, TaskStatus } from '../types';
import { getCompanyColor } from '../constants';

interface ExportModalProps {
  tasks: Task[];
  subordinateTasks?: Task[];
  templates: ReportTemplate[];
  onSaveTemplate: (template: ReportTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ tasks, subordinateTasks, templates, onSaveTemplate, onDeleteTemplate, onClose }) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [layout, setLayout] = useState<ReportLayout>('FLAT');
  const [mergeSubordinateTasks, setMergeSubordinateTasks] = useState(false);

  const filteredTasks = useMemo(() => {
    const baseTasks = mergeSubordinateTasks ? [...tasks, ...(subordinateTasks || [])] : tasks;
    return baseTasks.filter(t => {
      const taskDate = t.createdAt.split('T')[0];
      const isDateInRange = taskDate >= startDate && taskDate <= endDate;
      const isInProgress = t.status !== TaskStatus.DONE;
      return isDateInRange || isInProgress;
    });
  }, [tasks, subordinateTasks, startDate, endDate, mergeSubordinateTasks]);

  const groupedTasks = useMemo<Record<string, Task[]> | null>(() => {
    if (layout !== 'GROUPED_BY_COMPANY') return null;
    const groups: Record<string, Task[]> = {};
    filteredTasks.forEach(task => {
      const taskCompanyTrimmed = (task.company || '').trim();
      const existingKey = Object.keys(groups).find(k => k.trim().toLowerCase() === taskCompanyTrimmed.toLowerCase());
      const key = existingKey || taskCompanyTrimmed || 'Khác';
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    return groups;
  }, [filteredTasks, layout]);

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatDayMonth = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length >= 3) return `${parts[2]}/${parts[1]}`;
        return dateStr;
      }
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    } catch {
      return '';
    }
  };

  const handleExportCSV = () => {
    let csvContent = "\ufeff"; // UTF-8 BOM for Excel support
    
    if (layout === 'FLAT') {
      csvContent += "Công ty,Nội dung công việc,Ngày,Bộ phận tương tác,Trạng thái,Thời gian hoàn thành/Đợi chốt,Ghi chú,Ngày tạo\n";
      filteredTasks.forEach(t => {
        const company = t.company.replace(/"/g, '""');
        const content = t.content.replace(/"/g, '""');
        const dateShort = formatDayMonth(t.createdAt);
        const department = (t.department || '').replace(/"/g, '""');
        const isDone = t.status === TaskStatus.DONE;
        const isWaiting = t.status === TaskStatus.WAITING_APPROVAL;
        const isNotStarted = t.status === TaskStatus.NOT_STARTED;
        const status = isDone ? "Đã xong" 
          : isWaiting ? "Đợi chốt" 
          : isNotStarted ? "Chưa làm"
          : "Đang làm";
        const statusTime = isDone 
          ? formatDayMonth(t.completedAt || t.updatedAt) 
          : isWaiting 
          ? formatDayMonth(t.waitingApprovalAt || t.updatedAt) 
          : '';
        const notes = (t.notes || '').replace(/"/g, '""');
        const date = formatDate(t.createdAt.split('T')[0]);
        csvContent += `"${company}","${content}","${dateShort}","${department}","${status}","${statusTime}","${notes}","${date}"\n`;
      });
    } else {
      csvContent += "Công ty,Nội dung tóm tắt,Ngày tạo việc,Bộ phận tương tác,Đang thực hiện,Trạng thái\n";
      (Object.entries(groupedTasks || {}) as [string, Task[]][]).forEach(([company, tks]) => {
        const cName = company.replace(/"/g, '""');
        const summary = tks.map((tk, i) => `${i + 1}. ${tk.content}`).join('\n').replace(/"/g, '""');
        const dateSummary = tks.map((tk, i) => `${i + 1}. ${formatDayMonth(tk.createdAt)}`).join('\n').replace(/"/g, '""');
        const deptSummary = tks.map((tk, i) => `${i + 1}. ${tk.department || '-'}`).join('\n').replace(/"/g, '""');
        const activeTasks = tks.filter(tk => tk.status !== TaskStatus.NOT_STARTED);
        const active = activeTasks.map((tk, i) => `${i + 1}. ${tk.content}`).join('\n').replace(/"/g, '""');
        const activeStatus = activeTasks.map((tk, i) => {
          const isDone = tk.status === TaskStatus.DONE;
          const isWaiting = tk.status === TaskStatus.WAITING_APPROVAL;
          const label = isDone ? 'Đã xong' : isWaiting ? 'Đợi chốt' : 'Đang làm';
          const time = isDone 
            ? ` (${formatDayMonth(tk.completedAt || tk.updatedAt)})` 
            : isWaiting 
            ? ` (${formatDayMonth(tk.waitingApprovalAt || tk.updatedAt)})` 
            : '';
          return `${i + 1}. ${label}${time}`;
        }).join('\n').replace(/"/g, '""');
        csvContent += `"${cName}","${summary}","${dateSummary}","${deptSummary}","${active}","${activeStatus}"\n`;
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
      
      if (typeof window !== 'undefined' && (window as any).Capacitor && (window as any).Capacitor.isNativePlatform()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');
        const base64Data = dataUrl.split(',')[1];
        const fileName = `Bao_Cao_${startDate}.png`;
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache
        });
        await Share.share({
          title: 'Báo Cáo',
          url: savedFile.uri,
          dialogTitle: 'Chia sẻ báo cáo'
        });
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `Bao_Cao_${startDate}.png`;
        link.click();
      }
    } catch (err) {
      alert("Xuất ảnh lỗi. Vui lòng thử lại!");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full h-full md:h-auto md:max-w-6xl bg-white md:rounded-[3rem] shadow-2xl flex flex-col max-h-[100vh] md:max-h-[95vh] overflow-hidden">
        <header 
          className="px-6 pb-6 md:p-8 border-b border-slate-100 flex items-center justify-between shrink-0"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}
        >
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

          {subordinateTasks && subordinateTasks.length > 0 && (
            <div className="flex items-center gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
              <input 
                 type="checkbox" 
                 id="merge-sub-tasks"
                 checked={mergeSubordinateTasks}
                 onChange={e => setMergeSubordinateTasks(e.target.checked)}
                 className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="merge-sub-tasks" className="text-[11px] font-black text-slate-700 uppercase tracking-widest cursor-pointer select-none">
                 Gộp báo cáo của nhân viên cấp dưới
              </label>
            </div>
          )}

          <div className="border border-slate-100 rounded-[2rem] bg-white overflow-hidden shadow-inner">
             <div ref={reportRef} className="p-10 bg-white min-w-[800px]">
                <div className="text-center mb-8">
                   <h1 className="text-2xl font-black text-slate-800 uppercase">BÁO CÁO CÔNG VIỆC TUẦN</h1>
                   <p className="text-xs font-bold text-slate-400 mt-2 uppercase">Thời gian: {formatDate(startDate)} - {formatDate(endDate)}</p>
                </div>
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                   {layout === 'GROUPED_BY_COMPANY' ? (
                     <colgroup>
                       <col className="w-28" />
                       <col />
                       <col className="w-20" />
                       <col className="w-36" />
                       <col />
                       <col className="w-28" />
                     </colgroup>
                   ) : (
                     <colgroup>
                       <col className="w-28" />
                       <col />
                       <col className="w-20" />
                       <col className="w-36" />
                       <col className="w-32" />
                       <col />
                       <col className="w-28" />
                     </colgroup>
                   )}
                   <thead>
                      {layout === 'FLAT' ? (
                        <>
                          <tr className="bg-slate-50">
                            <th rowSpan={2} className="p-3 border text-[10px] font-black uppercase text-center w-28">Công ty</th>
                            <th colSpan={3} className="p-3 border text-[10px] font-black uppercase text-center">Tóm tắt công việc</th>
                            <th rowSpan={2} className="p-3 border text-[10px] font-black uppercase text-center w-32">Trạng thái</th>
                            <th rowSpan={2} className="p-3 border text-[10px] font-black uppercase text-left">Ghi chú</th>
                            <th rowSpan={2} className="p-3 border text-[10px] font-black uppercase text-center w-28">Ngày tạo</th>
                          </tr>
                          <tr className="bg-slate-100/60">
                            <th className="p-2.5 border text-[9px] font-black uppercase text-left">Nội dung</th>
                            <th className="p-2.5 border text-[9px] font-black uppercase text-center w-20">Ngày</th>
                            <th className="p-2.5 border text-[9px] font-black uppercase text-center w-36">Bộ phận tương tác</th>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr className="bg-slate-50">
                            <th rowSpan={2} className="p-3 border text-[10px] font-black uppercase text-center w-28">Công ty</th>
                            <th colSpan={3} className="p-3 border text-[10px] font-black uppercase text-center">Tóm tắt công việc</th>
                            <th colSpan={2} className="p-3 border text-[10px] font-black uppercase text-center">Đang thực hiện</th>
                          </tr>
                          <tr className="bg-slate-100/60">
                            <th className="p-2.5 border text-[9px] font-black uppercase text-left">Nội dung công việc</th>
                            <th className="p-2.5 border text-[9px] font-black uppercase text-center w-20">Ngày</th>
                            <th className="p-2.5 border text-[9px] font-black uppercase text-center w-36">Bộ phận tương tác</th>
                            <th className="p-2.5 border text-[9px] font-black uppercase text-left">Nội dung công việc</th>
                            <th className="p-2.5 border text-[9px] font-black uppercase text-center w-28">Trạng thái</th>
                          </tr>
                        </>
                      )}
                   </thead>
                   <tbody>
                      {layout === 'FLAT' ? (
                        filteredTasks.map(t => {
                          const cpColor = getCompanyColor(t.company);
                          const isDone = t.status === TaskStatus.DONE;
                          const isWaiting = t.status === TaskStatus.WAITING_APPROVAL;
                          const isNotStarted = t.status === TaskStatus.NOT_STARTED;
                          const statusLabel = isDone ? 'Đã xong' 
                            : isWaiting ? 'Đợi chốt' 
                            : isNotStarted ? 'Chưa làm'
                            : 'Đang làm';
                          const statusStyle = isDone 
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                            : isWaiting 
                            ? 'bg-amber-100 text-amber-700 border-amber-200' 
                            : isNotStarted
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-blue-100 text-blue-700 border-blue-200';
                          return (
                            <tr key={t.id}>
                               <td className={`p-4 border ${cpColor.badge} align-middle text-center`}>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                    {t.company}
                                  </span>
                               </td>
                               <td className={`p-4 border text-[11px] text-slate-700 font-bold ${cpColor.rowBg}`}>{t.content}</td>
                               <td className={`p-4 border text-[11px] text-center text-slate-500 font-bold ${cpColor.rowBg}`}>{formatDayMonth(t.createdAt)}</td>
                               <td className={`p-4 border text-[11px] text-center text-slate-600 font-medium ${cpColor.rowBg}`}>{t.department || '-'}</td>
                               <td className={`p-4 border text-center align-middle ${cpColor.rowBg}`}>
                                  <div className="flex flex-col items-center justify-center gap-1">
                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${statusStyle}`}>
                                      {statusLabel}
                                    </span>
                                    {isDone && (
                                      <span className="text-[10px] font-bold text-emerald-600">
                                        {formatDayMonth(t.completedAt || t.updatedAt)}
                                      </span>
                                    )}
                                    {isWaiting && (
                                      <span className="text-[10px] font-bold text-amber-700">
                                        {formatDayMonth(t.waitingApprovalAt || t.updatedAt)}
                                      </span>
                                    )}
                                  </div>
                               </td>
                               <td className={`p-4 border text-[11px] text-slate-500 font-medium whitespace-pre-wrap ${cpColor.rowBg}`}>{t.notes || ''}</td>
                               <td className={`p-4 border text-[11px] text-center text-slate-400 font-bold ${cpColor.rowBg}`}>{formatDate(t.createdAt.split('T')[0])}</td>
                            </tr>
                          );
                        })

                      ) : (
                        (Object.entries(groupedTasks || {}) as [string, Task[]][]).map(([company, tks]) => {
                          const cpColor = getCompanyColor(company);
                          const activeTasks = tks.filter(tk => tk.status !== TaskStatus.NOT_STARTED);
                          return (
                            <tr key={company}>
                               <td className={`p-4 border align-middle ${cpColor.badge} text-center w-28`}>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                    {company}
                                  </span>
                               </td>
                               <td colSpan={3} className={`p-0 border align-top ${cpColor.rowBg}`}>
                                  <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                                     <colgroup>
                                        <col />
                                        <col className="w-20" />
                                        <col className="w-36" />
                                     </colgroup>
                                     <tbody>
                                        {tks.map((tk, idx) => (
                                          <tr key={tk.id} className={idx < tks.length - 1 ? "border-b border-slate-200" : ""}>
                                             <td className="p-3 text-[11px] text-slate-700 font-bold align-middle border-r border-slate-200 break-words">
                                                {idx + 1}. {tk.content}
                                             </td>
                                             <td className="p-3 text-[11px] text-center text-slate-500 font-bold w-20 align-middle border-r border-slate-200 whitespace-nowrap">
                                                {formatDayMonth(tk.createdAt)}
                                             </td>
                                             <td className="p-3 text-[11px] text-center text-slate-600 font-medium w-36 align-middle">
                                                {tk.department || '-'}
                                             </td>
                                          </tr>
                                        ))}
                                     </tbody>
                                  </table>
                                </td>
                                <td colSpan={2} className={`p-0 border align-top ${cpColor.rowBgLight || cpColor.rowBg}`}>
                                   {activeTasks.length === 0 ? (
                                      <div className="p-4 text-center text-[11px] text-slate-400 font-bold min-h-[48px] flex items-center justify-center">
                                         -
                                      </div>
                                   ) : (
                                      <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                                         <colgroup>
                                            <col />
                                            <col className="w-28" />
                                         </colgroup>
                                         <tbody>
                                            {activeTasks.map((tk, idx) => {
                                              const isDone = tk.status === TaskStatus.DONE;
                                              const isWaiting = tk.status === TaskStatus.WAITING_APPROVAL;
                                              const statusLabel = isDone ? 'Đã xong' : isWaiting ? 'Đợi chốt' : 'Đang làm';
                                              const statusStyle = isDone 
                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                                : isWaiting 
                                                ? 'bg-amber-100 text-amber-700 border-amber-200' 
                                                : 'bg-blue-100 text-blue-700 border-blue-200';
                                              return (
                                                <tr key={tk.id} className={idx < activeTasks.length - 1 ? "border-b border-slate-200" : ""}>
                                                   <td className={`p-3 text-[11px] font-bold align-middle border-r border-slate-200 break-words ${isDone ? 'text-emerald-700' : 'text-blue-600'}`}>
                                                      {idx + 1}. {tk.content}
                                                   </td>
                                                   <td className="p-3 text-center align-middle w-28 whitespace-nowrap">
                                                      <div className="flex flex-col items-center justify-center gap-1">
                                                         <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${statusStyle}`}>
                                                           {statusLabel}
                                                         </span>
                                                         {isDone && (
                                                           <span className="text-[9px] font-bold text-emerald-600">
                                                             {formatDayMonth(tk.completedAt || tk.updatedAt)}
                                                           </span>
                                                         )}
                                                         {isWaiting && (
                                                           <span className="text-[9px] font-bold text-amber-700">
                                                             {formatDayMonth(tk.waitingApprovalAt || tk.updatedAt)}
                                                           </span>
                                                         )}
                                                      </div>
                                                   </td>
                                                </tr>
                                              );
                                            })}
                                         </tbody>
                                      </table>
                                   )}
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