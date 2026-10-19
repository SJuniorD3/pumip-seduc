import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
      <h3 className="text-sm font-semibold text-slate-700">Carregando dados institucionais...</h3>
      <p className="text-xs text-slate-500 mt-1">Sincronizando com a base de dados do PUMIP-SEDUC</p>
    </div>
  );
}
