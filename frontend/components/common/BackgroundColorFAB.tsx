'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, X, Check } from 'lucide-react';
import { useBackgroundColor } from '@/store/backgroundStore';

const presets = [
  { name: 'Dark Navy', color: '#0A0B0F' },
  { name: 'Charcoal', color: '#1A1A1A' },
  { name: 'Deep Purple', color: '#1A0B2E' },
  { name: 'Slate Gray', color: '#1F2937' },
  { name: 'Warm Black', color: '#1C1814' },
  { name: 'Pure Black', color: '#000000' },
];

export function BackgroundColorFAB() {
  const { color, setColor } = useBackgroundColor();
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState('');

  const applyHex = () => {
    const trimmed = hexInput.trim().replace('#', '');
    if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) {
      setColor(`#${trimmed.toUpperCase()}`);
      setHexInput('');
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-44 right-6 md:bottom-24 z-[60] w-72 bg-surface border border-border rounded-2xl shadow-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-text-primary">배경색 변경</h3>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-surface-elevated">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {presets.map((preset) => {
                const isActive = preset.color.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={preset.color}
                    onClick={() => setColor(preset.color)}
                    title={preset.name}
                    className={`relative aspect-square rounded-xl border-2 transition-all hover:scale-105 ${isActive ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
                    style={{ backgroundColor: preset.color }}
                  >
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check size={18} className="text-white drop-shadow-lg" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="pt-3 border-t border-border">
              <label className="block text-xs font-medium text-text-secondary mb-2">커스텀 컬러</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-surface-elevated border border-border rounded-lg px-3">
                  <span className="text-text-muted text-sm font-mono">#</span>
                  <input
                    type="text"
                    value={hexInput}
                    onChange={(e) => setHexInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyHex()}
                    placeholder="FFFFFF"
                    maxLength={7}
                    className="w-full bg-transparent text-sm font-mono text-text-primary py-2 focus:outline-none uppercase"
                  />
                </div>
                <button onClick={applyHex} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                  적용
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 right-6 md:bottom-6 md:right-6 z-[55] w-14 h-14 rounded-full bg-surface-elevated border border-border shadow-xl flex items-center justify-center hover:border-primary/50 transition-colors group"
        aria-label="배경색 변경"
      >
        <Palette size={22} className="text-primary group-hover:text-primary transition-colors" />
        <span className="absolute inset-0 rounded-full bg-primary/0 group-hover:bg-primary/5 transition-colors" />
      </motion.button>
    </>
  );
}
