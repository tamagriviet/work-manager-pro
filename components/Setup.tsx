
import React, { useState } from 'react';

interface SetupProps {
  initialFullName: string;
  initialJobTitle: string;
  onComplete: (fullName: string, jobTitle: string, companies: string[]) => void;
  onLogout: () => void;
}

const Setup: React.FC<SetupProps> = ({ initialFullName, initialJobTitle, onComplete, onLogout }) => {
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState('');

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const name = companyInput.trim();
    if (name && !companies.includes(name)) {
      setCompanies([...companies, name]);
      setCompanyInput('');
    }
  };

  const removeCompany = (name: string) => {
    setCompanies(companies.filter(c => c !== name));
  };

  const isFormValid = companies.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white p-8 md:p-14 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
        
        <div className="flex justify-between items-start mb-10">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-tight">
              Những công ty <br/> bạn làm việc
            </h1>
            <p className="text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em]">Cấu hình hệ thống quản trị</p>
          </div>
          <button onClick={onLogout} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 transition-all border border-slate-100">
            <i className="fas fa-sign-out-alt text-xl"></i>
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <p className="text-slate-500 text-xs font-bold leading-relaxed mb-6">
              Vui lòng nhập tên các công ty hoặc đối tác mà bạn đang trực tiếp theo dõi và xử lý công việc.
            </p>
            
            <form onSubmit={handleAddCompany} className="flex gap-3">
              <input
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                placeholder="Nhập tên công ty (ví dụ: Agriviet)..."
                className="flex-1 px-6 py-5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-700 transition-all"
              />
              <button 
                type="submit"
                className="px-8 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 uppercase text-[10px] tracking-widest"
              >
                THÊM
              </button>
            </form>
          </div>

          <div className="min-h-[180px] border-2 border-dashed border-slate-100 rounded-[2.5rem] p-8 flex flex-wrap gap-3 items-start content-start bg-slate-50/30 overflow-y-auto max-h-[300px] custom-scrollbar">
            {companies.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center py-10 opacity-30">
                <i className="fas fa-building text-4xl mb-4"></i>
                <p className="italic font-black text-[10px] uppercase tracking-widest">Danh sách đang trống</p>
              </div>
            ) : (
              companies.map(c => (
                <div key={c} className="group bg-white border-2 border-slate-100 text-slate-700 px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center gap-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
                  {c}
                  <button onClick={() => removeCompany(c)} className="text-slate-300 hover:text-rose-500 transition-colors">
                    <i className="fas fa-times-circle text-lg"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          disabled={!isFormValid}
          onClick={() => onComplete(initialFullName, initialJobTitle, companies)}
          className="w-full bg-slate-900 hover:bg-black disabled:opacity-20 text-white font-black py-6 rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 mt-10 uppercase tracking-[0.2em] text-xs"
        >
          KÍCH HOẠT HỆ THỐNG
          <i className="fas fa-chevron-right text-[10px]"></i>
        </button>
      </div>
    </div>
  );
};

export default Setup;
