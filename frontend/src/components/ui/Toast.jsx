// src/components/ui/Toast.jsx
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

const ICONS = {
    success: { icon: CheckCircle, cls: "text-emerald-500", bg: "bg-emerald-50 border-emerald-200" },
    error: { icon: XCircle, cls: "text-red-500", bg: "bg-red-50 border-red-200" },
    warning: { icon: AlertCircle, cls: "text-amber-500", bg: "bg-amber-50 border-amber-200" },
    info: { icon: Info, cls: "text-blue-500", bg: "bg-blue-50 border-blue-200" },
};

export const Toast = ({ toasts, onRemove }) => (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
            {toasts.map((t) => {
                const { icon: Icon, cls, bg } = ICONS[t.type] || ICONS.info;
                return (
                    <motion.div key={t.id}
                        initial={{ opacity: 0, x: 60, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 60, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl ${bg}`}>
                        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cls}`} />
                        <div className="flex-1 min-w-0">
                            {t.title && <p className="font-bold text-slate-800 text-sm">{t.title}</p>}
                            <p className="text-sm text-slate-600">{t.message}</p>
                        </div>
                        <button onClick={() => onRemove(t.id)}
                            className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                );
            })}
        </AnimatePresence>
    </div>
);

// Hook
import { useState, useCallback } from "react";

let idCounter = 0;

export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const remove = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const add = useCallback((toast) => {
        const id = ++idCounter;
        setToasts((prev) => [...prev, { ...toast, id }]);
        setTimeout(() => remove(id), toast.duration ?? 4000);
        return id;
    }, [remove]);

    const success = useCallback((message, title) => add({ type: "success", message, title }), [add]);
    const error = useCallback((message, title) => add({ type: "error", message, title }), [add]);
    const warning = useCallback((message, title) => add({ type: "warning", message, title }), [add]);
    const info = useCallback((message, title) => add({ type: "info", message, title }), [add]);

    return { toasts, remove, success, error, warning, info };
};