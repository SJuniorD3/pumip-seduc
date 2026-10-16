'use client';

import React, { useState } from 'react';
import { 
  HistoricoTramitacao, 
  OrigemSistema 
} from '../lib/types';
import { triggerPrintPDF } from '../lib/exportUtils';
import { 
  FileText, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Building2,
  Calendar,
  ThumbsDown,
  Printer,
  ShieldCheck,
  AlertCircle,
  Filter,
  Milestone,
  ListFilter
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
  const [resumosIncorretos, setResumosIncorretos] = useState<Record<string, boolean>>({});
  const [visaoFiltro, setVisaoFiltro] = useState<'CRITICOS' | 'TODOS'>('CRITICOS');

  const handleMarcarIncorreto = (eventoId: string) => {
    setResumosIncorretos((prev) => ({
      ...prev,
      [eventoId]: true
    }));
  };

  if (!eventos || eventos.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
        Nenhum evento registrado até o momento para este processo.
      </div>
    );
  }

  // Ordena cronologicamente do início ao fim
  const eventosOrdenados = [...eventos].sort(
    (a, b) => new Date(a.data_hora_evento).getTime() - new Date(b.data_hora_evento).getTime()
  );

  // Critério de identificação de Marcos Críticos (filtra ruído administrativo)
  const isMarcoCritico = (evt: HistoricoTramitacao) => {
    if (evt.resumo_ia) return true;
    if (evt.origem_sistema !== 'SEI') return true; // Eventos do StartGov e PNCP são marcos externos chave
    const tipo = (evt.tipo_documento || '').toUpperCase();
    if (['PARECER', 'EDITAL', 'PORTARIA', 'TERMO_REFERENCIA', 'CONTRATO', 'HOMOLOGACAO', 'AUTORIZACAO', 'DESPACHO_DECISORIO'].includes(tipo)) {
      return true;
    }
    const desc = evt.descricao_andamento.toLowerCase();
    return (
      desc.includes('parecer') ||
      desc.includes('termo de referência') ||
      desc.includes('edital') ||
      desc.includes('homolog') ||
      desc.includes('publica') ||
      desc.includes('assina') ||
      desc.includes('empenho') ||
      desc.includes('diligência') ||
      desc.includes('devolv') ||
      desc.includes('aprova') ||
      desc.includes('concl') ||
      desc.includes('adjudica')
    );
  };

  const marcosCriticosCount = eventosOrdenados.filter(isMarcoCritico).length;

  const eventosExibidos = visaoFiltro === 'CRITICOS' && marcosCriticosCount > 0
    ? eventosOrdenados.filter(isMarcoCritico)
    : eventosOrdenados;

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
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
      {/* Cabeçalho da Linha do Tempo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Milestone className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Metrô Processual Unificado
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              Híbrido SEI + StartGov
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
            <span className="font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-bold">
              SEI: {protocoloSei}
            </span>
            {protocoloStartGov && (
              <>
                <span className="text-slate-400">&harr;</span>
                <span className="font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  StartGov: {protocoloStartGov}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Controles: Filtro de Marcos Críticos vs Completa + Impressão */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de visualização */}
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center text-xs">
            <button
              onClick={() => setVisaoFiltro('CRITICOS')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition ${
                visaoFiltro === 'CRITICOS'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Milestone className="w-3.5 h-3.5 text-blue-600" />
              <span>Marcos Críticos</span>
              <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {marcosCriticosCount}
              </span>
            </button>

            <button
              onClick={() => setVisaoFiltro('TODOS')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition ${
                visaoFiltro === 'TODOS'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-slate-600" />
              <span>Visão Completa</span>
              <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {eventosOrdenados.length}
              </span>
            </button>
          </div>

          <button
            onClick={() => triggerPrintPDF(`Linha_do_Tempo_${protocoloSei}`)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            title="Imprimir ou Salvar Linha do Tempo em PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimir PDF</span>
          </button>
        </div>
      </div>

      {/* Legenda de Sistemas e Informação do Filtro Ativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-slate-50/70 p-3 rounded-lg border border-slate-200 gap-2">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-slate-500 font-semibold">Fontes Integradas:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span className="text-slate-700 font-medium">SEI (Azul)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span className="text-slate-700 font-medium">StartGov Compras (Verde)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-700 font-medium">PNCP Federal (Âmbar)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 italic">
          {visaoFiltro === 'CRITICOS'
            ? `Exibindo ${eventosExibidos.length} marcos decisórios (despachos de mero expediente ocultados).`
            : `Exibindo histórico completo de ${eventosExibidos.length} movimentações.`}
        </div>
      </div>

      {/* Traçado da Linha do Tempo */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {eventosExibidos.map((evt, index) => {
          const theme = getSystemTheme(evt.origem_sistema);
          const isCritico = isMarcoCritico(evt);
          const isIncorreto = resumosIncorretos[evt.id || String(index)];

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

                    {isCritico && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Milestone className="w-3 h-3 text-amber-600" />
                        Marco Decisório
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(evt.data_hora_evento)}
                  </span>
                </div>

                {/* Descrição do Andamento */}
                <p className="text-sm font-semibold text-slate-900 mb-2">
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
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded ml-auto flex items-center gap-1">
                      <span>Metadado Oficial</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </span>
                  </div>
                )}

                {/* Resumo da Inteligência Artificial (RF20 / Descritivo v2.0) */}
                {evt.resumo_ia && (
                  <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-3 mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-blue-900 text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Resumo Automático do Despacho (IA Local Estadual - vLLM/Ollama)</span>
                      </div>
                      <span className="text-[10px] text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded border border-blue-200">
                        Informativo
                      </span>
                    </div>

                    <p className="text-xs text-blue-950/90 leading-relaxed">
                      {evt.resumo_ia}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-blue-200/50 text-[11px]">
                      <span className="text-slate-500 italic">
                        Não substitui a leitura da íntegra do documento oficial para fins decisórios.
                      </span>

                      {isIncorreto ? (
                        <span className="text-amber-800 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Marcado como incorreto para revisão
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMarcarIncorreto(evt.id || String(index))}
                          className="text-slate-500 hover:text-red-700 flex items-center gap-1 font-medium transition"
                          title="Sinalizar que este resumo contém imprecisão ou alucinação"
                        >
                          <ThumbsDown className="w-3 h-3" />
                          <span>Marcar resumo como incorreto</span>
                        </button>
                      )}
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
