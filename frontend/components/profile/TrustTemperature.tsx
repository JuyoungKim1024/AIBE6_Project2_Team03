'use client';

import React from 'react';

interface TrustTemperatureProps {
  temp: number;
}

export function TrustTemperature({ temp }: TrustTemperatureProps) {
  let color = 'text-primary';
  let gradient = 'from-primary to-blue-400';
  if (temp >= 50) {
    color = 'text-accent';
    gradient = 'from-accent to-orange-400';
  } else if (temp >= 40) {
    color = 'text-green-500';
    gradient = 'from-green-500 to-emerald-400';
  } else if (temp < 30) {
    color = 'text-text-muted';
    gradient = 'from-text-muted to-text-secondary';
  }
  const percentage = Math.min(Math.max((temp / 99) * 100, 0), 100);
  return (
    <div className="flex flex-col gap-1 w-32">
      <div className="flex justify-between items-end">
        <span className="text-xs text-text-secondary font-medium">전투력</span>
        <span className={`text-lg font-bold ${color} tracking-tight`}>{temp.toFixed(0)}</span>
      </div>
      <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
