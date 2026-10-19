'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { KPICards, KPIFilterType } from '../components/KPICards';
import { ProcessTable } from '../components/ProcessTable';
import { FeedNovidades } from '../components/FeedNovidades';
import { SectorHierarchyDashboard } from '../components/SectorHierarchyDashboard';
import { mockProcessos } from '../lib/mockData';
import { Processo } from '../lib/types';
import { supabase, isSupabaseConfigured, DEFAULT_PAGE_SIZE } from '../lib/supabase';
import { useAuth } from '../lib/authContext';
import { filterProcessosByRLS } from '../lib/rlsFilter';
import { 
  FileText, 
  Kanban, 
  Bell, 
  ShieldCheck, 
  UserCheck,
  X
} from 'lucide-react';
import Link from 'next/link';
import { Abbr, InfoTooltip } from '../components/Tooltip';

export default function DashboardPage() {
  const { user } = useAuth();
  const [processos, setProcessos] = useState<Processo[]>(mockProcessos);
  const [loading, setLoading] = useState<boolean>(false);
  const [kpiFilter, setKpiFilter] = useState<KPIFilterType>('TODOS');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const processosVisiveis = filterProcessosByRLS(processos, user);

  // Filtra processos para a tabela quando um setor for selecionado no gráfico hierárquico
  const processosTabela = useMemo(() => {
    if (!selectedSector) return processosVisiveis;
    return processosVisiveis.filter(p => p.unidade_atual_sei === selectedSector);
  }, [processosVisiveis, selectedSector]);

  useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured()) {
        try {
          setLoading(true);
          // REMEDIAÇÃO P3-3 & FE-01: Limite defensivo e ordenação por coluna real do banco
          const { data, error } = await supabase
            .from('processos')
            .select('*, unidade_origem:unidades_organizacionais(*)')
            .order('ultima_movimentacao_em', { ascending: false })
            .limit(DEFAULT_PAGE_SIZE);

          if (!error && data && data.length > 0) {
            setProcessos(data as Processo[]);
          }
        } catch (e) {
          console.warn('Usando dados locais de contingência:', e);
        } finally {
          setLoading(false);
        }
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Banner Executivo Limpo e Direto */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-800 rounded-2xl p-4 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs bg-blue-500/20 text-blue-200 border border-blue-400/30 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-300" />
              <span>{user.nome} &bull; {user.unidade_sigla} (SEDUC-MA)</span>
            </span>
            <span className="text-xs bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Acesso Autorizado ({user.role})
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <span>Painel Executivo de Acompanhamento Processual</span>
            <InfoTooltip content="Painel gerencial centralizado com monitoramento de inércia, governança e integração automatizada com os sistemas SEI!, StartGov e PNCP." />
          </h1>

          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Consolidação unificada de demandas administrativas e contratações públicas da <Abbr sigla="SEDUC" />. 
            Monitoramento de inércia, linha do tempo híbrida (<Abbr sigla="SEI" /> + StartGov) e cumprimento de prazos da Lei 14.133/2021.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/kanban"
            title="Acompanhar processos no Quadro Kanban dividido pelas 5 etapas do ciclo de contratação"
            className="flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <Kanban className="w-4 h-4" />
            <span>Quadro Kanban</span>
          </Link>
          <Link
            href="/alertas"
            title="Central de vigilância com alertas de prazos fatais, retorno de diligências e sobrestamentos"
            className="flex items-center gap-1.5 sm:gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Central de Alertas</span>
            <span className="sm:hidden">Alertas</span>
          </Link>
        </div>
      </div>

      {/* Feed de Novidades das Últimas 24 Horas com Modo Recolhível */}
      <FeedNovidades />

      {/* Cards de Métricas Principais (KPIs) com Drilldown Interativo ao Clique */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Painel de Controle em Tempo Real
          </h2>
          <span className="text-xs text-slate-400 italic hidden sm:inline">
            Dica: clique em um card para filtrar a tabela automaticamente
          </span>
        </div>
        <KPICards 
          processos={processosVisiveis} 
          activeFilter={kpiFilter}
          onSelectFilter={setKpiFilter}
        />
      </div>

      {/* Dashboard Analítico com Filtro de Árvore Hierárquica e Gráficos de Setores */}
      <SectorHierarchyDashboard 
        processos={processosVisiveis}
        selectedSector={selectedSector}
        onSelectSector={setSelectedSector}
      />

      {/* Tabela de Processos Monitorados */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900">
              Processos da Carteira
            </h2>
            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200">
              {processosTabela.length} autorizados pelo RLS ({user.role})
            </span>
            {selectedSector && (
              <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1.5 shadow-2xs">
                <span>Filtrando por setor: {selectedSector}</span>
                <button
                  type="button"
                  onClick={() => setSelectedSector(null)}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                  title="Remover filtro de setor"
                >
                  <X className="w-3 h-3 text-blue-700" />
                </button>
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Regra de Não Ampliação de Acesso Ativa
          </span>
        </div>

        <ProcessTable 
          processos={processosTabela} 
          kpiFilter={kpiFilter}
          onClearKpiFilter={() => setKpiFilter('TODOS')}
        />
      </div>
    </div>
  );
}
