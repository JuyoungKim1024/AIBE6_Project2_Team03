'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
import type { User } from '@/types/user';

interface ChatStoreType {
  openDM: (user: User) => void;
  closeDM: () => void;
  activeDMUser: User | null;
}

const ChatContext = createContext<ChatStoreType | undefined>(undefined);

export function DMProvider({ children }: { children: ReactNode }) {
  const [activeDMUser, setActiveDMUser] = useState<User | null>(null);

  const openDM = (user: User) => setActiveDMUser(user);
  const closeDM = () => setActiveDMUser(null);

  return (
    <ChatContext.Provider value={{ openDM, closeDM, activeDMUser }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useDM() {
  const context = useContext(ChatContext);
  if (context === undefined) throw new Error('useDM must be used within a DMProvider');
  return context;
}
