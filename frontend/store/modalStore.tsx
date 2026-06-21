'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

interface ModalOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ModalStoreType {
  isOpen: boolean;
  options: ModalOptions | null;
  openModal: (options: ModalOptions) => void;
  confirmModal: (options: Omit<ModalOptions, 'onConfirm' | 'onCancel'>) => Promise<boolean>;
  closeModal: (confirmed?: boolean) => void;
}

const ModalContext = createContext<ModalStoreType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ModalOptions | null>(null);

  const openModal = useCallback((opts: ModalOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const confirmModal = useCallback((opts: Omit<ModalOptions, 'onConfirm' | 'onCancel'>) => (
    new Promise<boolean>((resolve) => {
      setOptions({
        ...opts,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
      setIsOpen(true);
    })
  ), []);

  const closeModal = useCallback((confirmed = false) => {
    if (!confirmed) {
      options?.onCancel?.();
    }
    setIsOpen(false);
    setOptions(null);
  }, [options]);

  return (
    <ModalContext.Provider value={{ isOpen, options, openModal, confirmModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}
