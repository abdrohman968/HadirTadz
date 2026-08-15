'use client';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxW?: string;
}

export default function Modal({ open, onClose, title, children, maxW = 'max-w-lg' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white dark:bg-slate-900 rounded-3xl w-full ${maxW} p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4 sticky top-0 bg-white dark:bg-slate-900">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-sm p-1" aria-label="Tutup">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">{label}</label>
      {children}
    </div>
  );
}

export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {error}
    </p>
  );
}

export const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 dark:text-slate-100';

export const inputFieldCls = (err?: string) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm focus:ring-2 focus:outline-none bg-white dark:bg-slate-950 dark:text-slate-100 ${
    err ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
  }`;
export const btnPrimary =
  'px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2';
export const btnSecondary =
  'px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition';