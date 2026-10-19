'use client';

import React, { useState, useEffect } from 'react';
import { ProcessTable } from '../../components/ProcessTable';
import { Breadcrumb } from '../../components/Breadcrumb';
import { Abbr, InfoTooltip } from '../../components/Tooltip';
import { mockProcessos } from '../../lib/mockData';
import { Processo } from '../../lib/types';
import { useAuth } from '../../lib/authContext';
import { filterProcessosByRLS } from '../../lib/rlsFilter';
import { isSupabaseConfigured } from '../../lib/supabase';
import { listarProcessosBanco } from '../../lib/dados/processos';
import { FileSearch, ShieldCheck } from 'lucide-react';

export default function ProcessosPage() {
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
        .catch((e) => console.warn('Erro ao carregar processos do Supabase:', e));
    }
  }, []);

  const processosVisiveis = filterProcessosByRLS(processos, user);

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
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Processos Monitorados da <Abbr sigla="SEDUC" /></span>
              <InfoTooltip content="Visão consolidada de todas as demandas e compras públicas sob a jurisdição do seu perfil ou subunidades subordinadas." />
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Acompanhe a lista de demandas autorizadas para seu perfil ({user.role} &bull; {user.unidade_sigla}) 
            com metadados do <Abbr sigla="SEI" />, StartGov e <Abbr sigla="PNCP" />.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span 
            title={`Segurança em Nível de Linha (RLS): Filtra automaticamente os processos autorizados para a lotação ${user.unidade_sigla} e setores hierarquicamente subordinados`}
            className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 shadow-sm cursor-help"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span><Abbr sigla="RLS" /> Ativo: {processosVisiveis.length} visíveis ({user.role})</span>
          </span>
        </div>
      </div>

      <ProcessTable processos={processosVisiveis} />
    </div>
  );
}
