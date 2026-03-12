import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmer l'action",
    message,
    confirmLabel = "Confirmer",
    confirmClass = "bg-red-600 hover:bg-red-700 text-white",
    isPending = false,
}) => (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full z-10"
                >
                    <div className="flex items-start gap-4 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-base">{title}</h3>
                            <p className="text-sm text-slate-500 mt-1">{message}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isPending}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${confirmClass}`}
                        >
                            {isPending ? "..." : confirmLabel}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);