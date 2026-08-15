'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const STYLES: Record<ToastType, { box: string; icon: string; path: string }> = {
  success: {
    box: 'bg-emerald-700 border-emerald-500/50 text-white',
    icon: 'bg-emerald-500/20 text-emerald-100',
    path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  error: {
    box: 'bg-rose-700 border-rose-500/50 text-white',
    icon: 'bg-rose-500/20 text-rose-100',
    path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  warning: {
    box: 'bg-amber-600 border-amber-500/50 text-white',
    icon: 'bg-amber-500/20 text-amber-100',
    path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  info: {
    box: 'bg-slate-800 border-slate-600/60 text-white',
    icon: 'bg-slate-500/20 text-slate-100',
    path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
};

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), DEFAULT_DURATION);
    },
    [dismiss]
  );

  useEffect(() => {
    globalEmit = (type, message) => toast(type, message);
    return () => {
      globalEmit = null;
    };
  }, [toast]);

  const value: ToastContextValue = {
    toast,
    success: (m) => toast('success', m),
    error: (m) => toast('error', m),
    warning: (m) => toast('warning', m),
    info: (m) => toast('info', m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Container: tengah layar */}
      <div className="fixed top-4 inset-x-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map((t) => {
          const s = STYLES[t.type];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-center gap-3 w-full sm:w-auto sm:max-w-md px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md animate-slide-in ${s.box}`}
            >
              <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${s.icon}`}>
                <svg className="w-4.5 h-4.5 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.path} />
                </svg>
              </span>
              <span className="text-xs sm:text-sm font-medium leading-snug flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="shrink-0 text-white/60 hover:text-white transition text-xs p-1" aria-label="Tutup">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback aman bila dipakai di luar provider (tidak menampilkan apa pun).
    return { toast: () => {}, success: () => {}, error: () => {}, warning: () => {}, info: () => {} };
  }
  return ctx;
}

// --- Emitter global (tanpa hook) agar fetchAPI & kode non-React bisa memicu toast ---
let globalEmit: ((type: ToastType, message: string) => void) | null = null;

export function toastSuccess(message: string) {
  globalEmit?.('success', message);
}
export function toastError(message: string) {
  globalEmit?.('error', message);
}
export function toastWarning(message: string) {
  globalEmit?.('warning', message);
}
export function toastInfo(message: string) {
  globalEmit?.('info', message);
}