'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

interface FeedbackContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
  confirmAction: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const confirmAction = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const handleConfirmResult = (result: boolean) => {
    if (confirmState) {
      confirmState.resolve(result);
      setConfirmState(null);
    }
  };

  return (
    <FeedbackContext.Provider value={{ showToast, confirmAction }}>
      {children}

      {/* In-App Toast Container (Top-Right) */}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const styles = {
            success: 'bg-white border-emerald-200 text-slate-800',
            error: 'bg-white border-rose-200 text-slate-800',
            warning: 'bg-white border-amber-200 text-slate-800',
            info: 'bg-white border-slate-200 text-slate-800',
          }[toast.type];

          const icon = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
            error: <AlertCircle className="w-5 h-5 text-[#D52832] shrink-0 mt-0.5" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
            info: <Info className="w-5 h-5 text-[#07142F] shrink-0 mt-0.5" />,
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 ${styles}`}
            >
              {icon}
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#07142F] leading-snug">
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* In-App Confirmation Modal (Replaces window.confirm) */}
      {confirmState && (
        <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    confirmState.options.variant === 'danger'
                      ? 'bg-rose-50 text-[#D52832]'
                      : 'bg-slate-100 text-[#07142F]'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-[#07142F]">
                    {confirmState.options.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    {confirmState.options.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => handleConfirmResult(false)}
                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                {confirmState.options.cancelLabel || 'Batal'}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmResult(true)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold text-white transition-colors shadow-xs cursor-pointer ${
                  confirmState.options.variant === 'danger'
                    ? 'bg-[#D52832] hover:bg-[#B91C1C]'
                    : 'bg-[#07142F] hover:bg-[#16366C]'
                }`}
              >
                {confirmState.options.confirmLabel || 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return ctx;
}
