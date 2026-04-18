
import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../translations';

interface ManageCompaniesModalProps {
  companies: string[];
  language: Language;
  onAdd: (name: string) => void;
  onRename: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
  onClose: () => void;
}

const ManageCompaniesModal: React.FC<ManageCompaniesModalProps> = ({ companies, language, onAdd, onRename, onDelete, onClose }) => {
  const t = translations[language] || translations.vi;
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [addName, setAddName] = useState('');

  const handleStartEdit = (name: string) => {
    setEditingName(name);
    setNewName(name);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = addName.trim();
    if (!trimmed) return;
    if (companies.includes(trimmed)) {
      alert("Công ty này đã tồn tại!");
      return;
    }
    onAdd(trimmed);
    setAddName('');
  };

  const handleSave = (oldName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingName(null);
      return;
    }
    if (companies.includes(trimmed)) {
      alert("Tên công ty đã tồn tại!");
      return;
    }
    if (confirm(t.renameConfirm)) {
      onRename(oldName, trimmed);
      setEditingName(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform animate-in zoom-in-95 duration-200">
        <header className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t.manageCompanies}</h2>
          <button onClick={onClose} className="text-slate-300 hover:text-rose-500 transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </header>

        <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input 
              value={addName}
              onChange={e => setAddName(e.target.value)}
              placeholder="Thêm công ty mới..."
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button type="submit" className="px-6 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all">THÊM</button>
          </form>
        </div>

        <div className="p-6 max-h-[45vh] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 space-y-3">
          {companies.map(company => (
            <div key={company} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all">
              {editingName === company ? (
                <div className="flex-1 flex gap-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-white text-sm outline-none ring-2 ring-blue-500/20"
                  />
                  <button onClick={() => handleSave(company)} className="px-4 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase">{t.save}</button>
                  <button onClick={() => setEditingName(null)} className="px-4 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl font-black text-[10px] uppercase">{t.cancel}</button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-black text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wide">{company}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleStartEdit(company)} 
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all border border-slate-100 dark:border-slate-700"
                    >
                      <i className="fas fa-pencil-alt text-xs"></i>
                    </button>
                    <button 
                      onClick={() => { if(confirm(t.confirmDelete)) onDelete(company); }} 
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all border border-slate-100 dark:border-slate-700"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {companies.length === 0 && (
            <p className="text-center py-10 text-slate-300 font-bold uppercase text-[10px] tracking-widest italic">Chưa có danh sách công ty</p>
          )}
        </div>

        <footer className="p-6 bg-slate-50 dark:bg-slate-950/50 flex justify-end">
          <button onClick={onClose} className="px-8 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
            XÁC NHẬN XONG
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ManageCompaniesModal;
