import React, { useState, useMemo, useRef } from 'react';
import { Task, ReportTemplate, ReportLayout, TaskStatus } from '../types';
import { getCompanyColor } from '../constants';
import { generateReportExcel } from '../services/excelExportService';

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

  const handleExportExcel = async () => {
    try {
      const buffer = await generateReportExcel({
        tasks: filteredTasks,
        groupedTasks,
        layout,
        startDate,
        endDate
      });

      const fileName = `Bao_Cao_${startDate}.xlsx`;

      if (typeof window !== 'undefined' && (window as any).Capacitor && (window as any).Capacitor.isNativePlatform()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');
        
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
        }
        const base64Data = btoa(binary);

        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache
        });
        await Share.share({
          title: 'Báo Cáo Excel',
          url: savedFile.uri,
          dialogTitle: 'Chia sẻ file Excel'
        });
      } else {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
      }
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      alert('Xuất file Excel thất bại. Vui lòng thử lại!');
    }
  };

  const setPngDpi300 = (dataUrl: string): string => {
    try {
      const isDataUrl = dataUrl.startsWith('data:');
      const base64Data = isDataUrl ? dataUrl.split(',')[1] : dataUrl;
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
      if (bytes.length < 33 || bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4E || bytes[3] !== 0x47) {
        return dataUrl;
      }

      // 300 DPI = Math.round(300 / 0.0254) = 11811 pixels/meter = 0x00002E23
      // Precalculated pHYs chunk for 300 DPI (length: 9, type: 'pHYs', X: 11811, Y: 11811, unit: 1, CRC: 0x78A53F76)
      const physChunk = new Uint8Array([
        0x00, 0x00, 0x00, 0x09, // Length: 9 bytes
        0x70, 0x48, 0x59, 0x73, // 'pHYs'
        0x00, 0x00, 0x2E, 0x23, // X pixels per meter (11811)
        0x00, 0x00, 0x2E, 0x23, // Y pixels per meter (11811)
        0x01,                   // Unit: meter
        0x78, 0xA5, 0x3F, 0x76  // CRC32
      ]);

      let pos = 33; // after IHDR chunk
      let existingPhysStart = -1;
      let existingPhysLen = 0;

      while (pos < bytes.length - 8) {
        const chunkLen = (bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3];
        const chunkType = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
        if (chunkType === 'pHYs') {
          existingPhysStart = pos;
          existingPhysLen = chunkLen + 12;
          break;
        }
        if (chunkType === 'IDAT' || chunkType === 'IEND') {
          break;
        }
        pos += chunkLen + 12;
      }

      let result: Uint8Array;
      if (existingPhysStart !== -1) {
        result = new Uint8Array(bytes.length - existingPhysLen + physChunk.length);
        result.set(bytes.subarray(0, existingPhysStart), 0);
        result.set(physChunk, existingPhysStart);
        result.set(bytes.subarray(existingPhysStart + existingPhysLen), existingPhysStart + physChunk.length);
      } else {
        result = new Uint8Array(bytes.length + physChunk.length);
        result.set(bytes.subarray(0, 33), 0);
        result.set(physChunk, 33);
        result.set(bytes.subarray(33), 33 + physChunk.length);
      }

      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < result.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, Array.from(result.subarray(i, i + chunkSize)));
      }
      const newBase64 = btoa(binary);
      return isDataUrl ? `data:image/png;base64,${newBase64}` : newBase64;
    } catch (err) {
      console.error('Error applying 300 DPI to PNG:', err);
      return dataUrl;
    }
  };

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    try {
      // 300 DPI: scale = 300 / 96 = 3.125
      const dpiScale = 300 / 96;
      const canvas = await (window as any).html2canvas(reportRef.current, { 
        scale: dpiScale, 
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight
      });
      const rawDataUrl = canvas.toDataURL('image/png');
      const dataUrl = setPngDpi300(rawDataUrl);
      
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
                       <col className="w-32" />
                     </colgroup>
                   ) : (
                     <colgroup>
                       <col className="w-28" />
                        <col />
                        <col className="w-20" />
                        <col className="w-36" />
                        <col className="w-32" />
                        <col />
                      </colgroup>
                   )}
                   <thead>
                      {layout === 'FLAT' ? (
                        <tr className="bg-slate-50">
                          <th className="p-3 border text-[10px] font-black uppercase text-center w-28">Công ty</th>
                          <th className="p-3 border text-[10px] font-black uppercase text-left">Nội dung</th>
                          <th className="p-3 border text-[10px] font-black uppercase text-center w-20">Ngày</th>
                          <th className="p-3 border text-[10px] font-black uppercase text-center w-36">Bộ phận tương tác</th>
                          <th className="p-3 border text-[10px] font-black uppercase text-center w-32">Trạng thái</th>
                          <th className="p-3 border text-[10px] font-black uppercase text-left">Ghi chú</th>
                        </tr>
                      ) : (
                        <tr className="bg-slate-50">
                          <th className="p-3 border text-[10px] font-black uppercase text-center w-28">Công ty</th>
                          <th className="p-3 border text-[10px] font-black uppercase text-left">Nội dung công việc</th>
                          <th className="p-3 border text-[10px] font-black uppercase text-center w-20">Ngày</th>
                          <th className="p-3 border text-[10px] font-black uppercase text-center w-36">Bộ phận tương tác</th>
                          <th className="p-3 border text-[10px] font-black uppercase text-center w-32">Trạng thái</th>
                        </tr>
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
                            : isNotStarted ? 'CHƯA LÀM'
                            : 'Đang làm';
                          const statusStyle = isDone 
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                            : isWaiting 
                            ? 'bg-amber-100 text-amber-700 border-amber-200' 
                            : isNotStarted
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-blue-100 text-blue-700 border-blue-200';
                          const statusDate = isDone 
                            ? formatDayMonth(t.completedAt || t.updatedAt) 
                            : isWaiting 
                            ? formatDayMonth(t.waitingApprovalAt || t.updatedAt) 
                            : '';
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
                                  <div className="flex items-center justify-center">
                                    <div className={`inline-block px-3 py-1 rounded-xl text-center border ${statusStyle} min-w-[76px]`}>
                                      <div className="text-[10px] font-black uppercase tracking-wider leading-tight">
                                        {statusLabel}
                                      </div>
                                      {statusDate && (
                                        <div className="text-[8.5px] font-bold leading-tight mt-0.5 opacity-85">
                                          {statusDate}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                               </td>
                               <td className={`p-4 border text-[11px] text-slate-500 font-medium whitespace-pre-wrap ${cpColor.rowBg}`}>{t.notes || ''}</td>
                            </tr>
                          );
                        })

                      ) : (
                        (Object.entries(groupedTasks || {}) as [string, Task[]][]).map(([company, tks]) => {
                          const cpColor = getCompanyColor(company);
                          return (
                            <tr key={company}>
                               <td className={`p-4 border align-middle ${cpColor.badge} text-center w-28`}>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                    {company}
                                  </span>
                               </td>
                               <td colSpan={4} className={`p-0 border align-top ${cpColor.rowBg}`}>
                                  <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                                     <colgroup>
                                        <col />
                                        <col className="w-20" />
                                        <col className="w-36" />
                                        <col className="w-32" />
                                     </colgroup>
                                     <tbody>
                                        {tks.map((tk, idx) => {
                                          const isDone = tk.status === TaskStatus.DONE;
                                          const isWaiting = tk.status === TaskStatus.WAITING_APPROVAL;
                                          const isNotStarted = tk.status === TaskStatus.NOT_STARTED;
                                          const statusLabel = isDone ? 'Đã xong' 
                                            : isWaiting ? 'Đợi chốt' 
                                            : isNotStarted ? 'CHƯA LÀM' 
                                            : 'Đang làm';
                                          const statusStyle = isDone 
                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                            : isWaiting 
                                            ? 'bg-amber-100 text-amber-700 border-amber-200' 
                                            : isNotStarted
                                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                                            : 'bg-blue-100 text-blue-700 border-blue-200';
                                          const statusDate = isDone 
                                            ? formatDayMonth(tk.completedAt || tk.updatedAt) 
                                            : isWaiting 
                                            ? formatDayMonth(tk.waitingApprovalAt || tk.updatedAt) 
                                            : '';

                                          return (
                                            <tr key={tk.id} className={idx < tks.length - 1 ? "border-b border-slate-200" : ""}>
                                               <td className="p-3 text-[11px] text-slate-700 font-bold align-middle border-r border-slate-200 break-words">
                                                  {idx + 1}. {tk.content}
                                               </td>
                                               <td className="p-3 text-[11px] text-center text-slate-500 font-bold w-20 align-middle border-r border-slate-200 whitespace-nowrap">
                                                  {formatDayMonth(tk.createdAt)}
                                               </td>
                                               <td className="p-3 text-[11px] text-center text-slate-600 font-medium w-36 align-middle border-r border-slate-200">
                                                  {tk.department || '-'}
                                               </td>
                                               <td className="p-3 text-center align-middle w-32 whitespace-nowrap">
                                                  <div className="flex items-center justify-center">
                                                    <div className={`inline-block px-3 py-1 rounded-xl text-center border ${statusStyle} min-w-[76px]`}>
                                                      <div className="text-[9.5px] font-black uppercase tracking-wider leading-tight">
                                                        {statusLabel}
                                                      </div>
                                                      {statusDate && (
                                                        <div className="text-[8.5px] font-bold leading-tight mt-0.5 opacity-85">
                                                          {statusDate}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                               </td>
                                            </tr>
                                          );
                                        })}
                                     </tbody>
                                  </table>
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
           <button onClick={handleExportExcel} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all">
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