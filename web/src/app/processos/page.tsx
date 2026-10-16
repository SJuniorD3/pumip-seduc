'use client';

import React, { useState } from 'react';
import { ProcessTable } from '../../components/ProcessTable';
import { Breadcrumb } from '../../components/Breadcrumb';
import { mockProcessos } from '../../lib/mockData';
import { Processo } from '../../lib/types';
import { FileSearch, ShieldCheck } from 'lucide-react';

export default function ProcessosPage() {
  const [processos] = useState<Processo[]>(mockProcessos);

  return (
    <div className="space-y-5">
      {/* Trilha de Navegação */}
      <Breadcrumb
        items={[
          { label: 'Processos Monitorados', isCurrent: true }
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileSearch className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Processos Monitorados da SEDUC-MA
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Acompanhe a lista completa de demandas em tramitação com metadados do SEI!, contratos do StartGov e publicações do PNCP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Visibilidade RLS Aplicada
          </span>
        </div>
      </div>

      <ProcessTable processos={processos} />
    </div>
  );
}
