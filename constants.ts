
export const COMPANIES = [
  "Agriviet",
  "TechFlow",
  "GreenLogistics",
  "SmartSolutions",
  "GlobalTrade Co.",
  "Personal/Other"
];

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: 'Chưa làm', color: 'bg-slate-200 text-slate-700' },
  IN_PROGRESS: { label: 'Đang làm', color: 'bg-blue-100 text-blue-700 border border-blue-200' },
  DONE: { label: 'Đã xong', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200' }
};

export const getCompanyColor = (company: string) => {
  // Bảng màu 20 bộ - Đã loại bỏ Đỏ (Red), Hồng (Pink), Đỏ hồng (Rose) để dành riêng cho việc gấp
  const colors = [
    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-600', light: 'bg-blue-100' },
    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-600', light: 'bg-emerald-100' },
    { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', badge: 'bg-violet-600', light: 'bg-violet-100' },
    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-600', light: 'bg-amber-100' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', badge: 'bg-cyan-600', light: 'bg-cyan-100' },
    { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', badge: 'bg-teal-600', light: 'bg-teal-100' },
    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', badge: 'bg-indigo-600', light: 'bg-indigo-100' },
    { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200', badge: 'bg-lime-600', light: 'bg-lime-100' },
    { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', badge: 'bg-sky-600', light: 'bg-sky-100' },
    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-600', light: 'bg-purple-100' },
    { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', badge: 'bg-slate-600', light: 'bg-slate-100' },
    { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', badge: 'bg-yellow-600', light: 'bg-yellow-100' },
    { bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-200', badge: 'bg-stone-600', light: 'bg-stone-100' },
    { bg: 'bg-zinc-50', text: 'text-zinc-700', border: 'border-zinc-200', badge: 'bg-zinc-600', light: 'bg-zinc-100' },
    { bg: 'bg-neutral-50', text: 'text-neutral-700', border: 'border-neutral-200', badge: 'bg-neutral-600', light: 'bg-neutral-100' },
    { bg: 'bg-blue-100/30', text: 'text-blue-800', border: 'border-blue-300', badge: 'bg-blue-800', light: 'bg-blue-200' },
    { bg: 'bg-emerald-100/30', text: 'text-emerald-800', border: 'border-emerald-300', badge: 'bg-emerald-800', light: 'bg-emerald-200' },
    { bg: 'bg-indigo-100/30', text: 'text-indigo-800', border: 'border-indigo-300', badge: 'bg-indigo-800', light: 'bg-indigo-200' },
    { bg: 'bg-teal-100/30', text: 'text-teal-800', border: 'border-teal-300', badge: 'bg-teal-800', light: 'bg-teal-200' },
    { bg: 'bg-purple-100/30', text: 'text-purple-800', border: 'border-purple-300', badge: 'bg-purple-800', light: 'bg-purple-200' },
  ];
  
  // Thuật toán băm DJB2 cải tiến
  let hash = 5381;
  const str = company.toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); 
  }
  
  // Sử dụng phép chia lấy dư để chọn màu
  return colors[Math.abs(hash) % colors.length];
};
