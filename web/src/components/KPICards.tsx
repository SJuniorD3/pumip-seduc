'use client';

import React from 'react';
import { 
  FileText, 
  AlertTriangle, 
  ShoppingBag, 
  Clock, 
  ArrowUpRight, 
  Check, 
  Filter
} from 'lucide-react';
import { Processo } from '../lib/types';
import { Abbr, InfoTooltip } from './Tooltip';
import { isSlaEstourado } from '../lib/slaConfig';

export type KPIFilterType = 'TODOS' | 'CRITICOS' | 'CONTRATACAO' | 'SETOR_GARGALO';

interface KPICardsProps {
  processos: Processo[];
  activeFilter?: KPIFilterType;
  onSelectFilter?: (filter: KPIFilterType) => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ 
  processos, 
  activeFilter = 'TODOS',
  onSelectFilter 
}) => {
  const total = processos.length;
  const criticos = processos.filter(p => isSlaEstourado(p.dias_parado_na_unidade) || p.prioridade === 'QUENTE').length;
  const emLicitacao = processos.filter(p => p.status_etapa === 'FASE_EXTERNA_LICITACAO' || p.protocolo_startgov).length;

  // Cálculo de gargalos médios
  const setorContagem: Record<string, { totalDias: number; count: number }> = {};
  processos.forEach(p => {
    const setor = p.unidade_atual_sei || 'Outros';
    if (!setorContagem[setor]) setorContagem[setor] = { totalDias: 0, count: 0 };
    setorContagem[setor].totalDias += p.dias_parado_na_unidade;
    setorContagem[setor].count += 1;
  });

  let maiorGargaloSetor = 'ASJUR';
  let maiorMediaDias = 8.0;

  Object.entries(setorContagem).forEach(([setor, data]) => {
    const media = data.totalDias / data.count;
    if (media > maiorMediaDias) {
      maiorMediaDias = media;
      maiorGargaloSetor = setor;
    }
  });

  const handleCardClick = (filter: KPIFilterType) => {
    if (onSelectFilter) {
      // Se clicar no mesmo filtro que já está ativo (diferente de TODOS), volta pra TODOS
      if (activeFilter === filter && filter !== 'TODOS') {
        onSelectFilter('TODOS');
      } else {
        onSelectFilter(filter);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
      {/* 1. Total de Processos Monitorados */}
      <div 
        role="button"
        tabIndex={0}
        onClick={() => handleCardClick('TODOS')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick('TODOS')}
        className={`bg-white p-4 sm:p-5 rounded-xl border text-left transition-all cursor-pointer relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
          activeFilter === 'TODOS'
            ? 'border-blue-600 ring-2 ring-blue-500/30 shadow-md bg-blue-50/20'
            : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
        }`}
        title="Total de processos na sua alçada de governança (SEI-GOVMA + StartGov). Clique para ver a lista completa."
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Total Monitorados
            </span>
            <InfoTooltip content="Processos administrativos autuados e integrados sob monitoramento contínuo da SEDUC-MA." />
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-2xl font-bold text-slate-900">{total}</p>
          <span className="text-[11px] text-emerald-700 font-bold flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <ArrowUpRight className="w-3 h-3 mr-0.5" />
            100% integrados
          </span>
        </div>
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[11px] text-slate-500">
          <span>
            <Abbr sigla="SEI" /> + <Abbr sigla="StartGov" />
          </span>
          {activeFilter === 'TODOS' && (
            <span className="text-blue-700 font-bold flex items-center gap-0.5">
              <Check className="w-3 h-3" /> Ativo
            </span>
          )}
        </div>
      </div>

      {/* 2. Críticos / SLA Estourado */}
      <div 
        role="button"
        tabIndex={0}
        onClick={() => handleCardClick('CRITICOS')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick('CRITICOS')}
        className={`bg-white p-4 sm:p-5 rounded-xl border text-left transition-all cursor-pointer relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${
          activeFilter === 'CRITICOS'
            ? 'border-red-600 ring-2 ring-red-500/30 shadow-md bg-red-50/20'
            : 'border-slate-200 hover:border-red-300 hover:shadow-sm'
        }`}
        title="Processos parados na mesma unidade há 5 dias úteis ou mais sem despacho (SLA expirado). Clique para filtrar."
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              <Abbr sigla="SLA" /> Estourado / Críticos
            </span>
            <InfoTooltip content="SLA (Acordo de Nível de Serviço): meta estipulada pela SEDUC para permanência máxima de processos sem movimentação." />
          </div>
          <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-2xl font-bold text-red-600">{criticos}</p>
          <span className="text-[11px] text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            &gt; 5 dias úteis sem avanço
          </span>
        </div>
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[11px] text-slate-500">
          <span className="text-red-700 font-medium">Exigem despacho urgente</span>
          {activeFilter === 'CRITICOS' ? (
            <span className="text-red-700 font-bold flex items-center gap-0.5">
              <Check className="w-3 h-3" /> Filtrado
            </span>
          ) : (
            <span className="text-slate-400 group-hover:text-red-600 font-medium text-[10px]">
              Filtrar &rarr;
            </span>
          )}
        </div>
      </div>

      {/* 3. Em Licitação / StartGov */}
      <div 
        role="button"
        tabIndex={0}
        onClick={() => handleCardClick('CONTRATACAO')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick('CONTRATACAO')}
        className={`bg-white p-4 sm:p-5 rounded-xl border text-left transition-all cursor-pointer relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
          activeFilter === 'CONTRATACAO'
            ? 'border-emerald-600 ring-2 ring-emerald-500/30 shadow-md bg-emerald-50/20'
            : 'border-slate-200 hover:border-emerald-300 hover:shadow-sm'
        }`}
        title="Processos em fase externa de compras e disputa pública no StartGov (Pregões e Dispensas Eletrônicas). Clique para filtrar."
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Fase de Contratação
            </span>
            <InfoTooltip content="Processos que já concluíram a fase preparatória interna e estão em disputa aberta ou adjudicação de propostas." />
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-2xl font-bold text-emerald-600">{emLicitacao}</p>
          <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            StartGov Ativo
          </span>
        </div>
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[11px] text-slate-500">
          <span>Pregão ou Dispensa</span>
          {activeFilter === 'CONTRATACAO' ? (
            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
              <Check className="w-3 h-3" /> Filtrado
            </span>
          ) : (
            <span className="text-slate-400 group-hover:text-emerald-600 font-medium text-[10px]">
              Filtrar &rarr;
            </span>
          )}
        </div>
      </div>

      {/* 4. Maior Gargalo Setorial */}
      <div 
        role="button"
        tabIndex={0}
        onClick={() => handleCardClick('SETOR_GARGALO')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick('SETOR_GARGALO')}
        className={`bg-white p-4 sm:p-5 rounded-xl border text-left transition-all cursor-pointer relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 ${
          activeFilter === 'SETOR_GARGALO'
            ? 'border-purple-600 ring-2 ring-purple-500/30 shadow-md bg-purple-50/20'
            : 'border-slate-200 hover:border-purple-300 hover:shadow-sm'
        }`}
        title={`Setor com maior inércia média acumulada: ${maiorGargaloSetor} (${maiorMediaDias.toFixed(1)} dias úteis de espera). Clique para filtrar.`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Maior Gargalo
            </span>
            <InfoTooltip content="Unidade organizacional da SEDUC com a maior média de dias úteis retendo processos na mesa sem despacho." />
          </div>
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-105 transition-transform">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-2xl font-bold text-purple-900">
            <Abbr sigla={maiorGargaloSetor} />
          </p>
          <span className="text-[11px] text-purple-800 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
            Média: {maiorMediaDias.toFixed(1)}d úteis
          </span>
        </div>
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[11px] text-slate-500">
          <span>Tempo médio de retenção</span>
          {activeFilter === 'SETOR_GARGALO' ? (
            <span className="text-purple-700 font-bold flex items-center gap-0.5">
              <Check className="w-3 h-3" /> Filtrado
            </span>
          ) : (
            <span className="text-slate-400 group-hover:text-purple-600 font-medium text-[10px]">
              Filtrar &rarr;
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
