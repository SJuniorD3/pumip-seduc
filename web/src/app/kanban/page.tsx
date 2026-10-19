'use client';

import React, { useState, useEffect } from 'react';
import { KanbanBoard } from '../../components/KanbanBoard';
import { Breadcrumb } from '../../components/Breadcrumb';
import { Abbr, InfoTooltip } from '../../components/Tooltip';
import { mockProcessos } from '../../lib/mockData';
import { Processo } from '../../lib/types';
import { useAuth } from '../../lib/authContext';
import { filterProcessosByRLS } from '../../lib/rlsFilter';
import { isSupabaseConfigured } from '../../lib/supabase';
import { listarProcessosBanco } from '../../lib/dados/processos';
import { KanbanSquare, ShieldCheck } from 'lucide-react';

export default function KanbanPage() {
  const { user } = useAuth();
  const [processos, setProcessos] = useState<Processo[]>(mockProcessos);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      listarProcessosBanco(1, 100)
        .then(({ processos: bancoProcessos }) => {
          if (bancoProcessos && bancoProcessos.length > 0) {
            setProcessos(bancoProcessos);
          }
        })
        .catch((e) => console.warn('Erro ao carregar processos no Kanban:', e));
    }
  }, []);

  // Aplica filtro de segurança e autorização RLS
  const processosAutorizados = filterProcessosByRLS(processos, user);

  return (
    <div className="space-y-5">
      {/* Trilha de Navegação */}
      <Breadcrumb
        items={[
          { label: 'Quadro Kanban Setorial (RF17)', isCurrent: true }
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <KanbanSquare className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Quadro Kanban Setorial (RF17)</span>
              <InfoTooltip content="Visualização ágil em colunas das 5 fases macro do ciclo de vida processual (da instrução preparatória à contratação e publicação)." />
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Acompanhamento das etapas do ciclo de vida das demandas da <Abbr sigla="SEDUC" />: da fase preparatória interna no <Abbr sigla="SEI" /> até a contratação e execução.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span 
            title={`Filtrado por RLS para ${user.unidade_sigla}`}
            className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>RLS Ativo: {processosAutorizados.length} visíveis ({user.role})</span>
          </span>
        </div>
      </div>

      {/* Componente do Quadro Kanban com Colunas por Etapa */}
      <KanbanBoard processos={processosAutorizados} />
    </div>
  );
}
