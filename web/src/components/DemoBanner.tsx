'use client';

import React from 'react';
import { isDemoMode } from '../lib/appMode';
import { AlertTriangle } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  if (!isDemoMode()) return null;

  return (
    <div className="bg-amber-500 text-amber-950 text-center py-1.5 px-4 text-xs font-bold tracking-wide flex items-center justify-center gap-2 z-50 relative">
      <AlertTriangle className="w-3.5 h-3.5" />
      <span>
        MODO DEMONSTRAÇÃO — Dados simulados. Este ambiente NÃO deve ser utilizado com dados institucionais reais.
      </span>
      <AlertTriangle className="w-3.5 h-3.5" />
    </div>
  );
};
