'use client';

import React from 'react';
import { 
  FileText, 
  AlertTriangle, 
  ShoppingBag, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { Processo } from '../lib/types';

interface KPICardsProps {
  processos: Processo[];
}

export const KPICards: React.FC<KPICardsProps> = ({ processos }) => {
  const total = processos.length;
  const criticos = processos.filter(p => p.dias_parado_na_unidade >= 5 || p.prioridade === 'QUENTE').length;
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total de Processos Monitorados */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Monitorados
          </span>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-2xl font-bold text-slate-900">{total}</p>
          <span className="text-xs text-emerald-600 font-medium flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            100% integrados
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">SEI GOVMA + StartGov</p>
      </div>

      {/* Críticos / SLA Estourado */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-red-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            SLA Estourado / Críticos
          </span>
          <div className="p-2 bg-red-50 text-red-600 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-2xl font-bold text-red-600">{criticos}</p>
          <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            &gt; 5 dias sem avanço
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Exigem despacho prioritário</p>
      </div>

      {/* Em Licitação / StartGov */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Fase de Contratação
          </span>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-2xl font-bold text-emerald-600">{emLicitacao}</p>
          <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            StartGov Ativo
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Pregão ou Dispensa em curso</p>
      </div>

      {/* Gargalo Médio por Setor */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Maior Gargalo Setorial
          </span>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-xl font-bold text-slate-900">{maiorGargaloSetor}</p>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            ~{maiorMediaDias.toFixed(1)} dias médios
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Tempo de permanência em fila</p>
      </div>
    </div>
  );
};
