'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Processo, StatusEtapaProcessual } from '../lib/types';
import { Clock, AlertCircle, ArrowRight, Building, FileText } from 'lucide-react';
import { Abbr, InfoTooltip } from './Tooltip';

interface KanbanBoardProps {
  processos: Processo[];
}

interface ColumnConfig {
  id: StatusEtapaProcessual;
  title: string;
  badgeColor: string;
  description: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'FASE_INTERNA_SEI',
    title: 'Fase Interna (SEI)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'DFD, ETP e Autuação Inicial'
  },
  {
    id: 'INSTRUCAO_TR',
    title: 'Instrução / TR',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    description: 'Termo de Referência e Pesquisa de Preços'
  },
  {
    id: 'ANALISE_JURIDICA',
    title: 'Análise Jurídica',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Parecer Conclusivo do Art. 53'
  },
  {
    id: 'FASE_EXTERNA_LICITACAO',
    title: 'Fase Externa / Licitação',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Edital, Disputa de Lances no StartGov'
  },
  {
    id: 'CONTRATO_EXECUCAO',
    title: 'Contrato / Execução',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Assinatura, Publicação PNCP e Gestão'
  }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ processos }) => {
  const [items, setItems] = useState<Processo[]>(processos);

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

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex gap-4 min-w-[1250px]">
        {COLUMNS.map((col) => {
          const colProcessos = items.filter((p) => p.status_etapa === col.id);

          return (
            <div
              key={col.id}
              className="flex-1 bg-slate-100/80 rounded-xl p-3 border border-slate-200 flex flex-col min-w-[240px]"
            >
              {/* Cabeçalho da Coluna */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1">
                    <span>{col.title}</span>
                    <InfoTooltip content={col.description} />
                  </h3>
                  <span className="text-xs bg-white text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200 shadow-sm" title={`Total de processos nesta etapa: ${colProcessos.length}`}>
                    {colProcessos.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{col.description}</p>
              </div>

              {/* Lista de Cards da Coluna */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                {colProcessos.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-300 rounded-lg">
                    Nenhum processo nesta etapa
                  </div>
                ) : (
                  colProcessos.map((proc) => {
                    const slaEstourado = proc.dias_parado_na_unidade >= 5;

                    return (
                      <div
                        key={proc.id}
                        className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            title={`Prioridade ${proc.prioridade}: ${proc.prioridade === 'QUENTE' ? 'Risco iminente de desabastecimento ou prazo fatal' : proc.prioridade === 'MORNO' ? 'Instrução regular em andamento' : 'Planejamento ou baixa urgência'}`}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityBadge(
                              proc.prioridade
                            )}`}
                          >
                            {proc.prioridade}
                          </span>

                          <div
                            title={`Permanência líquida na unidade atual: ${proc.dias_parado_na_unidade} dias úteis (Meta de SLA SEDUC: máx 5 dias)`}
                            className={`flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                              slaEstourado
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-slate-50 text-slate-600'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{proc.dias_parado_na_unidade}d parado</span>
                          </div>
                        </div>

                        {/* Protocolos */}
                        <div className="space-y-1 mb-2">
                          <p 
                            title="Protocolo oficial no Sistema Eletrônico de Informações (SEI-MA)"
                            className="text-xs font-mono font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 truncate"
                          >
                            {proc.protocolo_sei}
                          </p>
                          {proc.protocolo_startgov && (
                            <p 
                              title="Protocolo oficial de licitação / compra no sistema StartGov"
                              className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 truncate"
                            >
                              {proc.protocolo_startgov}
                            </p>
                          )}
                        </div>

                        {/* Objeto */}
                        <p className="text-xs text-slate-700 font-medium line-clamp-2 mb-3" title={proc.objeto}>
                          {proc.objeto}
                        </p>

                        {/* Rodapé do Card */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                          <span 
                            title={`Unidade de lotação atual do processo: ${proc.unidade_atual_sei}`}
                            className="flex items-center gap-1 font-semibold text-slate-600"
                          >
                            <Building className="w-3 h-3 text-slate-400" />
                            {proc.unidade_atual_sei}
                          </span>

                          <Link
                            href={`/processos/${proc.id}`}
                            title="Abrir a Linha do Tempo estilo Metrô (RF08) com auditoria detalhada de todos os marcos"
                            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 group"
                          >
                            <span>Metrô</span>
                            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
