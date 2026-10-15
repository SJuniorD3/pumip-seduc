'use client';

import React from 'react';
import { 
  HistoricoTramitacao, 
  OrigemSistema 
} from '../lib/types';
import { 
  FileText, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Building2,
  Calendar
} from 'lucide-react';

interface MetroTimelineProps {
  eventos: HistoricoTramitacao[];
  protocoloSei: string;
  protocoloStartGov?: string | null;
}

export const MetroTimeline: React.FC<MetroTimelineProps> = ({
  eventos,
  protocoloSei,
  protocoloStartGov
}) => {
  if (!eventos || eventos.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
        Nenhum evento registrado até o momento para este processo.
      </div>
    );
  }

  // Ordena cronologicamente (mais recente primeiro ou do início ao fim)
  const eventosOrdenados = [...eventos].sort(
    (a, b) => new Date(a.data_hora_evento).getTime() - new Date(b.data_hora_evento).getTime()
  );

  const getSystemTheme = (origem: OrigemSistema) => {
    switch (origem) {
      case 'SEI':
        return {
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          dot: 'bg-blue-600 ring-blue-100',
          line: 'border-blue-400',
          cardBorder: 'border-l-blue-600',
          nome: 'SEI GOVMA'
        };
      case 'STARTGOV':
        return {
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-600 ring-emerald-100',
          line: 'border-emerald-400',
          cardBorder: 'border-l-emerald-600',
          nome: 'StartGov Compras'
        };
      case 'PNCP':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          dot: 'bg-amber-500 ring-amber-100',
          line: 'border-amber-400',
          cardBorder: 'border-l-amber-500',
          nome: 'PNCP Federal'
        };
    }
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      {/* Cabeçalho da Linha do Tempo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Metrô Processual Unificado</span>
            <span className="text-xs font-normal text-slate-500">
              (Linha do Tempo Híbrida SEI + StartGov)
            </span>
          </h2>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              {protocoloSei}
            </span>
            {protocoloStartGov && (
              <>
                <span className="text-slate-400">&harr;</span>
                <span className="font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                  {protocoloStartGov}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legenda dos Sistemas */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span className="text-slate-700 font-medium">SEI (Azul)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span className="text-slate-700 font-medium">StartGov (Verde)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-700 font-medium">PNCP (Âmbar)</span>
          </div>
        </div>
      </div>

      {/* Traçado da Linha do Tempo */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {eventosOrdenados.map((evt, index) => {
          const theme = getSystemTheme(evt.origem_sistema);
          const isLatest = index === eventosOrdenados.length - 1;

          return (
            <div key={evt.id || index} className="relative group">
              {/* Ponto na Linha do Metrô */}
              <div 
                className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 border-white ${theme.dot} ring-4 flex items-center justify-center text-white text-[10px] font-bold shadow-sm transition-transform group-hover:scale-110`}
              >
                {index + 1}
              </div>

              {/* Card do Evento */}
              <div 
                className={`bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200 ${theme.cardBorder} border-l-4 shadow-sm hover:shadow-md transition`}
              >
                {/* Meta informações do evento */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span 
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${theme.badge}`}
                    >
                      {theme.nome}
                    </span>
                    <span className="text-xs font-medium text-slate-700 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      {evt.unidade_setor}
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(evt.data_hora_evento)}
                  </span>
                </div>

                {/* Descrição do Andamento */}
                <p className="text-sm font-medium text-slate-900 mb-2">
                  {evt.descricao_andamento}
                </p>

                {/* Documento Anexado (se houver) */}
                {evt.documento_anexado && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-slate-800">
                      {evt.tipo_documento ? `${evt.tipo_documento}: ` : 'Documento: '}
                    </span>
                    <span className="text-slate-600 truncate">{evt.documento_anexado}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded ml-auto">
                      Metadado Oficial
                    </span>
                  </div>
                )}

                {/* Resumo da Inteligência Artificial (RF20 / Descritivo v2.0) */}
                {evt.resumo_ia && (
                  <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-2.5 mt-2 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-950">
                      <div className="flex items-center gap-1 font-semibold text-blue-900 mb-0.5">
                        <span>Resumo Automático (IA Local do Estado)</span>
                        <span className="text-[10px] text-blue-600 font-normal">
                          &bull; Informativo
                        </span>
                      </div>
                      <p className="text-blue-900/90 leading-relaxed">{evt.resumo_ia}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
