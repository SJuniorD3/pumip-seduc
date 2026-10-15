'use client';

import React, { useState } from 'react';
import { KanbanBoard } from '../../components/KanbanBoard';
import { mockProcessos } from '../../lib/mockData';
import { Processo } from '../../lib/types';
import { KanbanSquare, Filter, RefreshCw } from 'lucide-react';

export default function KanbanPage() {
  const [processos] = useState<Processo[]>(mockProcessos);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <KanbanSquare className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Quadro Kanban Setorial (RF17)
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Acompanhamento das etapas do ciclo de vida das demandas da SEDUC: da fase preparatória interna no SEI até a contratação e execução.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 text-slate-700 font-medium px-3 py-1.5 rounded-lg border border-slate-200">
            Total no Quadro: <strong className="text-slate-900">{processos.length}</strong>
          </span>
        </div>
      </div>

      {/* Componente do Quadro Kanban com Colunas por Etapa */}
      <KanbanBoard processos={processos} />
    </div>
  );
}
