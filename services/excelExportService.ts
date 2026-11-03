import ExcelJS from 'exceljs';
import { Task, ReportLayout, TaskStatus } from '../types';

interface ExportExcelOptions {
  tasks: Task[];
  groupedTasks: Record<string, Task[]> | null;
  layout: ReportLayout;
  startDate: string;
  endDate: string;
}

// 20 company colors mapped to Excel ARGB hex values
const COMPANY_COLOR_PALETTE = [
  { badge: 'FF2563EB', rowBg: 'FFEBF2FE' }, // blue-600
  { badge: 'FF059669', rowBg: 'FFE7F8F0' }, // emerald-600
  { badge: 'FF7C3AED', rowBg: 'FFF2ECFD' }, // violet-600
  { badge: 'FFD97706', rowBg: 'FFFCF3E6' }, // amber-600
  { badge: 'FF0891B2', rowBg: 'FFE6F6F9' }, // cyan-600
  { badge: 'FF0D9488', rowBg: 'FFE7F6F5' }, // teal-600
  { badge: 'FF4F46E5', rowBg: 'FFEDECFC' }, // indigo-600
  { badge: 'FF65A30D', rowBg: 'FFF0F7E7' }, // lime-600
  { badge: 'FF0284C7', rowBg: 'FFE6F4FB' }, // sky-600
  { badge: 'FF9333EA', rowBg: 'FFF6EBFD' }, // purple-600
  { badge: 'FF475569', rowBg: 'FFEDEFF2' }, // slate-600
  { badge: 'FFCA8A04', rowBg: 'FFFBF5E6' }, // yellow-600
  { badge: 'FF57534E', rowBg: 'FFEFEFEF' }, // stone-600
  { badge: 'FF52525B', rowBg: 'FFEEEEF0' }, // zinc-600
  { badge: 'FF525252', rowBg: 'FFEEEEEE' }, // neutral-600
  { badge: 'FF1E40AF', rowBg: 'FFE9EEF9' }, // blue-800
  { badge: 'FF065F46', rowBg: 'FFE6F0ED' }, // emerald-800
  { badge: 'FF3730A3', rowBg: 'FFECEBF7' }, // indigo-800
  { badge: 'FF115E59', rowBg: 'FFE7F0EF' }, // teal-800
  { badge: 'FF6B21A8', rowBg: 'FFF2EAF8' }, // purple-800
];

const getExcelCompanyColor = (company: string) => {
  let hash = 5381;
  const str = (company || '').toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return COMPANY_COLOR_PALETTE[Math.abs(hash) % COMPANY_COLOR_PALETTE.length];
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
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

const getStatusConfig = (task: Task) => {
  const isDone = task.status === TaskStatus.DONE;
  const isWaiting = task.status === TaskStatus.WAITING_APPROVAL;
  const isNotStarted = task.status === TaskStatus.NOT_STARTED;

  const label = isDone ? 'ĐÃ XONG'
    : isWaiting ? 'ĐỢI CHỐT'
    : isNotStarted ? 'CHƯA LÀM'
    : 'ĐANG LÀM';

  const date = isDone
    ? formatDayMonth(task.completedAt || task.updatedAt)
    : isWaiting
    ? formatDayMonth(task.waitingApprovalAt || task.updatedAt)
    : '';

  const displayText = date ? `${label}\n${date}` : label;

  if (isDone) {
    return {
      text: displayText,
      bg: 'FFD1FAE5', // emerald-100
      color: 'FF047857', // emerald-700
      border: 'FFA7F3D0'
    };
  }
  if (isWaiting) {
    return {
      text: displayText,
      bg: 'FFFEF3C7', // amber-100
      color: 'FFB45309', // amber-700
      border: 'FFFDE68A'
    };
  }
  if (isNotStarted) {
    return {
      text: displayText,
      bg: 'FFF1F5F9', // slate-100
      color: 'FF334155', // slate-700
      border: 'FFE2E8F0'
    };
  }
  return {
    text: displayText,
    bg: 'FFDBEAFE', // blue-100
    color: 'FF1D4ED8', // blue-700
    border: 'FFBFDBFE'
  };
};

const standardBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
};

export const generateReportExcel = async ({
  tasks,
  groupedTasks,
  layout,
  startDate,
  endDate
}: ExportExcelOptions): Promise<ArrayBuffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Work Manager Pro';
  workbook.lastModifiedBy = 'Work Manager Pro';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Báo Cáo Công Việc', {
    views: [{ showGridLines: true }]
  });

  const totalCols = layout === 'FLAT' ? 6 : 5;

  // Title: Row 2
  worksheet.mergeCells(2, 1, 2, totalCols);
  const titleCell = worksheet.getCell(2, 1);
  titleCell.value = 'BÁO CÁO CÔNG VIỆC TUẦN';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E293B' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 30;

  // Subtitle: Row 3
  worksheet.mergeCells(3, 1, 3, totalCols);
  const subTitleCell = worksheet.getCell(3, 1);
  subTitleCell.value = `THỜI GIAN: ${formatDate(startDate)} - ${formatDate(endDate)}`;
  subTitleCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF64748B' } };
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(3).height = 20;

  // Row 4 is spacing
  worksheet.getRow(4).height = 10;

  // Table Headers: Row 5
  const headerRowIdx = 5;
  const headerRow = worksheet.getRow(headerRowIdx);
  headerRow.height = 26;

  const headers = layout === 'FLAT' 
    ? ['CÔNG TY', 'NỘI DUNG', 'NGÀY', 'BỘ PHẬN TƯƠNG TÁC', 'TRẠNG THÁI', 'GHI CHÚ']
    : ['CÔNG TY', 'NỘI DUNG CÔNG VIỆC', 'NGÀY', 'BỘ PHẬN TƯƠNG TÁC', 'TRẠNG THÁI'];

  headers.forEach((h, idx) => {
    const colNumber = idx + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF334155' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8FAFC' }
    };
    cell.alignment = {
      horizontal: colNumber === 2 || (layout === 'FLAT' && colNumber === 6) ? 'left' : 'center',
      vertical: 'middle',
      wrapText: true
    };
    cell.border = standardBorder;
  });

  // Set column widths
  if (layout === 'FLAT') {
    worksheet.getColumn(1).width = 18; // Công ty
    worksheet.getColumn(2).width = 45; // Nội dung
    worksheet.getColumn(3).width = 12; // Ngày
    worksheet.getColumn(4).width = 24; // Bộ phận tương tác
    worksheet.getColumn(5).width = 18; // Trạng thái
    worksheet.getColumn(6).width = 30; // Ghi chú
  } else {
    worksheet.getColumn(1).width = 18; // Công ty
    worksheet.getColumn(2).width = 50; // Nội dung công việc
    worksheet.getColumn(3).width = 12; // Ngày
    worksheet.getColumn(4).width = 24; // Bộ phận tương tác
    worksheet.getColumn(5).width = 18; // Trạng thái
  }

  let currentRowIdx = 6;

  if (layout === 'FLAT') {
    tasks.forEach(t => {
      const row = worksheet.getRow(currentRowIdx);
      row.height = 32;
      const cpColor = getExcelCompanyColor(t.company);
      const statusCfg = getStatusConfig(t);

      // Col 1: Công ty (Badge)
      const c1 = row.getCell(1);
      c1.value = t.company || '';
      c1.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cpColor.badge } };
      c1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      c1.border = standardBorder;

      // Col 2: Nội dung
      const c2 = row.getCell(2);
      c2.value = t.content || '';
      c2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF334155' } };
      c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cpColor.rowBg } };
      c2.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      c2.border = standardBorder;

      // Col 3: Ngày
      const c3 = row.getCell(3);
      c3.value = formatDayMonth(t.createdAt);
      c3.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF64748B' } };
      c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cpColor.rowBg } };
      c3.alignment = { horizontal: 'center', vertical: 'middle' };
      c3.border = standardBorder;

      // Col 4: Bộ phận tương tác
      const c4 = row.getCell(4);
      c4.value = t.department || '-';
      c4.font = { name: 'Arial', size: 10, color: { argb: 'FF475569' } };
      c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cpColor.rowBg } };
      c4.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      c4.border = standardBorder;

      // Col 5: Trạng thái (Colored badge)
      const c5 = row.getCell(5);
      c5.value = statusCfg.text;
      c5.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: statusCfg.color } };
      c5.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusCfg.bg } };
      c5.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      c5.border = {
        top: { style: 'thin', color: { argb: statusCfg.border } },
        bottom: { style: 'thin', color: { argb: statusCfg.border } },
        left: { style: 'thin', color: { argb: statusCfg.border } },
        right: { style: 'thin', color: { argb: statusCfg.border } },
      };

      // Col 6: Ghi chú
      const c6 = row.getCell(6);
      c6.value = t.notes || '';
      c6.font = { name: 'Arial', size: 9.5, color: { argb: 'FF64748B' } };
      c6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cpColor.rowBg } };
      c6.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      c6.border = standardBorder;

      currentRowIdx++;
    });
  } else {
    // GROUPED_BY_COMPANY
    const groups = groupedTasks || {};
    const entries = Object.entries(groups);

    entries.forEach(([company, tks]) => {
      const startRow = currentRowIdx;
      const endRow = startRow + tks.length - 1;
      const cpColor = getExcelCompanyColor(company);

      tks.forEach((tk, idx) => {
        const row = worksheet.getRow(currentRowIdx);
        row.height = 32;
        const statusCfg = getStatusConfig(tk);

        // Col 1 is set per row first, then merged
        const c1 = row.getCell(1);
        c1.value = company;
        c1.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cpColor.badge } };
        c1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        c1.border = standardBorder;

        // Col 2: Nội dung công việc (with number)
        const c2 = row.getCell(2);
        c2.value = `${idx + 1}. ${tk.content}`;
        c2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF334155' } };
        c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cpColor.rowBg } };
        c2.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        c2.border = standardBorder;

        // Col 3: Ngày
        const c3 = row.getCell(3);
        c3.value = formatDayMonth(tk.createdAt);
        c3.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF64748B' } };
        c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cpColor.rowBg } };
        c3.alignment = { horizontal: 'center', vertical: 'middle' };
        c3.border = standardBorder;

        // Col 4: Bộ phận tương tác
        const c4 = row.getCell(4);
        c4.value = tk.department || '-';
        c4.font = { name: 'Arial', size: 10, color: { argb: 'FF475569' } };
        c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cpColor.rowBg } };
        c4.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        c4.border = standardBorder;

        // Col 5: Trạng thái
        const c5 = row.getCell(5);
        c5.value = statusCfg.text;
        c5.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: statusCfg.color } };
        c5.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusCfg.bg } };
        c5.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        c5.border = {
          top: { style: 'thin', color: { argb: statusCfg.border } },
          bottom: { style: 'thin', color: { argb: statusCfg.border } },
          left: { style: 'thin', color: { argb: statusCfg.border } },
          right: { style: 'thin', color: { argb: statusCfg.border } },
        };

        currentRowIdx++;
      });

      // Merge company cells if more than 1 task
      if (tks.length > 1) {
        worksheet.mergeCells(startRow, 1, endRow, 1);
        const mergedCell = worksheet.getCell(startRow, 1);
        mergedCell.value = company;
        mergedCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        mergedCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cpColor.badge } };
        mergedCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        mergedCell.border = standardBorder;
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};
