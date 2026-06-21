'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

interface ModalOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm?: () => void;
}

interface ModalStoreType {
  isOpen: boolean;
  options: ModalOptions | null;
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalStoreType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ModalOptions | null>(null);

  const openModal = useCallback((opts: ModalOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
  }, []);

  return (
    <ModalContext.Provider value={{ isOpen, options, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}
