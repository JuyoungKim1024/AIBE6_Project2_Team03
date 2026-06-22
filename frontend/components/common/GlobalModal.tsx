'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useModal } from '@/store/modalStore';

export function GlobalModal() {
  const { isOpen, options, closeModal } = useModal();

  const handleConfirm = () => {
    options?.onConfirm?.();
    closeModal(true);
  };

  return (
    <AnimatePresence>
      {isOpen && options && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => closeModal()} />
          <motion.div
            className="relative bg-surface border border-border rounded-2xl p-8 w-full max-w-sm shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={() => closeModal()}
              className="absolute top-4 right-4 p-1 text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-text-primary mb-3">{options.title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line mb-6">{options.message}</p>
            <div className="flex gap-3 justify-end">
              {options.onConfirm && (
                <button
                  onClick={() => closeModal()}
                  className="px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-elevated transition-colors"
                >
                  취소
                </button>
              )}
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {options.confirmLabel ?? '확인'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
