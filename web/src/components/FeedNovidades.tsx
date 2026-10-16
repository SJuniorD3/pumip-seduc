'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Zap, 
  ArrowRight, 
  Clock, 
  Building, 
  CheckCircle2, 
  ExternalLink,
  Sparkles
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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/80 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-200/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Novidades Recentes na Carteira</span>
              <span className="text-[10px] bg-blue-200 text-blue-900 font-bold px-2 py-0.2 rounded-full">
                Últimas 24h
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Processos que sofreram andamento recente sem você precisar consultar o SEI ou StartGov.
            </p>
          </div>
        </div>

        <span className="text-xs text-blue-700 font-semibold hidden sm:block">
          {novidades.length} movimentações detectadas
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.hora}</span>
                </div>
              </div>

              <p className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">
                {item.objeto}
              </p>

              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2">
                {item.descricaoMovimentacao}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>Destino: <strong>{item.unidadeDestino}</strong></span>
              </span>

              <Link
                href={`/processos/${item.processoId}`}
                className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-0.5 group"
              >
                <span>Ver no Metrô</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
