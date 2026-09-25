import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const duration = toast.duration ?? (toast.type === 'error' ? 6000 : 4000);
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const bgStyles = {
    success: 'bg-emerald-900/95 text-white border-emerald-700/80',
    error: 'bg-red-900/95 text-white border-red-700/80',
    info: 'bg-natural-dark/95 text-white border-natural-secondary/50',
  };

  const icons = {
    success: <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />,
    error: <AlertCircle size={18} className="text-red-400 shrink-0" />,
    info: <Info size={18} className="text-amber-400 shrink-0" />,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full px-4 animate-in slide-in-from-bottom-5 duration-200"
    >
      <div
        className={`flex items-center gap-3 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md text-xs font-medium ${bgStyles[toast.type]}`}
      >
        {icons[toast.type]}
        <div className="flex-1 min-w-0">
          <p className="leading-snug">{toast.message}</p>
        </div>
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              onClose();
            }}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0"
          >
            {toast.action.label}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-white/70 hover:text-white rounded-lg transition cursor-pointer shrink-0"
          aria-label="Zamknij komunikat"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
