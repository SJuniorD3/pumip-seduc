'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  ArrowRight, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface MovimentacaoRecente {
  processoId: string;
  protocoloSei: string;
  objeto: string;
  unidadeDestino: string;
  descricaoMovimentacao: string;
  hora: string;
  origem: 'SEI' | 'STARTGOV' | 'PNCP';
}

export const FeedNovidades: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // REMEDIAÇÃO P0-5: Em produção, estes dados devem vir do Supabase com filtro RLS server-side.
  // Em modo demo, exibe dados fixos de exemplo.
  const novidades: MovimentacaoRecente[] = [
    {
      processoId: '10000000-0000-0000-0000-000000000001',
      protocoloSei: 'SEI-021001/004521/2026',
      objeto: 'Switches e Equipamentos de Conectividade Escolar',
      unidadeDestino: 'CSL',
      descricaoMovimentacao: 'Sessão pública de lances iniciada no StartGov com 8 empresas credenciadas.',
      hora: 'Hoje às 14:20',
      origem: 'STARTGOV'
    },
    {
      processoId: '10000000-0000-0000-0000-000000000002',
      protocoloSei: 'SEI-021001/007812/2026',
      objeto: 'Nuvem Governamental e Supabase/PostgreSQL',
      unidadeDestino: 'ASJUR',
      descricaoMovimentacao: 'Distribuído ao Procurador para emissão de parecer conclusivo do Art. 53 da Lei 14.133.',
      hora: 'Ontem às 17:40',
      origem: 'SEI'
    }
  ];

  return (
    <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 border border-blue-200/90 rounded-2xl p-3.5 sm:p-4 shadow-sm mb-6 transition-all">
      {/* Cabeçalho do Feed com Toggle de Recolhimento */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm shrink-0">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                Novidades Recentes na Carteira
              </h2>
              <span className="text-xs bg-blue-100 text-blue-900 font-bold px-2 py-0.2 rounded-full border border-blue-200">
                Últimas 24h
              </span>
            </div>
            {isExpanded && (
              <p className="text-xs text-slate-600 hidden sm:block">
                Processos que sofreram andamento recente sem você precisar consultar o SEI ou StartGov.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-800 font-semibold hidden md:inline">
            {novidades.length} movimentações detectadas
          </span>

          {/* Botão Minimizar / Expandir */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            title={isExpanded ? 'Recolher feed de novidades' : 'Expandir feed de novidades'}
          >
            <span>{isExpanded ? 'Recolher' : 'Expandir'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Conteúdo Expandido com os Cards */}
      {isExpanded ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-blue-200/60 animate-in fade-in duration-200">
          {novidades.map((item) => (
            <div
              key={item.processoId}
              className="bg-white rounded-xl p-3 border border-blue-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {item.protocoloSei}
                  </span>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.hora}</span>
                  </div>
                </div>

                <p className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">
                  {item.objeto}
                </p>

                <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2 font-medium">
                  {item.descricaoMovimentacao}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                  <span className="text-slate-500 font-normal">Destino:</span>
                  <span className="bg-slate-100 px-1.5 py-0.2 rounded font-bold text-slate-800 border border-slate-200">
                    {item.unidadeDestino}
                  </span>
                </span>

                <Link
                  href={`/processos/${item.processoId}`}
                  className="font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline"
                >
                  <span>Abrir no Metrô</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Versão Ticker Compacta (1 linha) quando recolhido */
        <div className="mt-2 text-xs text-slate-600 flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-lg border border-blue-200/50">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">
            <strong>Destaques:</strong> Switches com sessão de lances no StartGov e Nuvem com distribuição na ASJUR.
          </span>
          <button
            onClick={() => setIsExpanded(true)}
            className="text-blue-700 font-semibold hover:underline ml-auto shrink-0 text-xs"
          >
            Ver detalhes
          </button>
        </div>
      )}
    </div>
  );
};
