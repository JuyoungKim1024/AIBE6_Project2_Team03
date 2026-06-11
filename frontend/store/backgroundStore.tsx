'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';

interface BackgroundStoreType {
  color: string;
  setColor: (color: string) => void;
}

const BackgroundContext = createContext<BackgroundStoreType>({
  color: '#0A0B0F',
  setColor: () => {},
});

export function BackgroundColorProvider({ children }: { children: ReactNode }) {
  const [color, setColorState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bg-color') || '#0A0B0F';
    }
    return '#0A0B0F';
  });

  const setColor = (newColor: string) => {
    setColorState(newColor);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bg-color', newColor);
    }
  };

  useEffect(() => {
    document.body.style.backgroundColor = color;
  }, [color]);

  return (
    <BackgroundContext.Provider value={{ color, setColor }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackgroundColor() {
  return useContext(BackgroundContext);
}
