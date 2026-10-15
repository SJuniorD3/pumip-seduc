'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Processo } from '../lib/types';
import { SyncButton } from './SyncButton';
import { Search, Filter, ExternalLink, Clock, Building, ArrowRight } from 'lucide-react';

interface ProcessTableProps {
  processos: Processo[];
}

export const ProcessTable: React.FC<ProcessTableProps> = ({ processos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrioridade, setFilterPrioridade] = useState<string>('TODAS');

  const filtered = processos.filter((p) => {
    const matchesSearch =
      p.protocolo_sei.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.protocolo_startgov && p.protocolo_startgov.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.objeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.unidade_atual_sei.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPrioridade =
      filterPrioridade === 'TODAS' || p.prioridade === filterPrioridade;

    return matchesSearch && matchesPrioridade;
  });

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'QUENTE':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'MORNO':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'FRIO':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FASE_INTERNA_SEI':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'INSTRUCAO_TR':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'ANALISE_JURIDICA':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'FASE_EXTERNA_LICITACAO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CONTRATO_EXECUCAO':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Barra de Filtros e Busca */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por SEI, StartGov, objeto ou setor..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-600 font-medium">Prioridade:</span>
          <select
            value={filterPrioridade}
            onChange={(e) => setFilterPrioridade(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODAS">Todas as Faixas</option>
            <option value="QUENTE">Quente (&le; 15d / Crítico)</option>
            <option value="MORNO">Morno (15-60d)</option>
            <option value="FRIO">Frio (&gt; 60d / Concluído)</option>
          </select>
        </div>
      </div>

      {/* Tabela Responsiva */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-100/75 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Protocolos (SEI / StartGov)</th>
              <th className="py-3 px-4">Objeto da Demanda</th>
              <th className="py-3 px-4">Unidade / Setor Atual</th>
              <th className="py-3 px-4">Etapa Processual</th>
              <th className="py-3 px-4">Inércia / SLA</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  Nenhum processo encontrado com os filtros informados.
                </td>
              </tr>
            ) : (
              filtered.map((proc) => {
                const slaEstourado = proc.dias_parado_na_unidade >= 5;

                return (
                  <tr key={proc.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-blue-700 hover:underline">
                        <Link href={`/processos/${proc.id}`}>
                          {proc.protocolo_sei}
                        </Link>
                      </div>
                      {proc.protocolo_startgov ? (
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          {proc.protocolo_startgov}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic">
                          Aguardando StartGov
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-medium text-slate-900 line-clamp-2">
                        {proc.objeto}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        Origem: {proc.unidade_origem?.sigla || 'SEDUC'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        {proc.unidade_atual_sei}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          proc.status_etapa
                        )}`}
                      >
                        {proc.status_etapa.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold text-xs px-2 py-0.5 rounded ${
                            slaEstourado
                              ? 'bg-red-100 text-red-700 font-bold'
                              : 'text-slate-700'
                          }`}
                        >
                          {proc.dias_parado_na_unidade} dias
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPriorityBadge(
                            proc.prioridade
                          )}`}
                        >
                          {proc.prioridade}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <SyncButton
                          processoId={proc.id}
                          ultimaVerificacao={proc.ultima_verificacao_em}
                        />
                        <Link
                          href={`/processos/${proc.id}`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Abrir Metrô Processual"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
