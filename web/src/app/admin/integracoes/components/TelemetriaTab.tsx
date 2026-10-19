'use client';

import React from 'react';
import { BarChart2, HelpCircle } from 'lucide-react';

export const TelemetriaTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-400">Taxa de Sucesso Geral</span>
          <p className="text-2xl font-bold text-emerald-600">99.82%</p>
          <p className="text-[10px] text-slate-500">2.410 requisições nas últimas 24h</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-400">Latência Média SEI</span>
          <p className="text-2xl font-bold text-blue-600">142 ms</p>
          <p className="text-[10px] text-slate-500">Pico: 210ms às 15:30</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-400">Latência Média StartGov</span>
          <p className="text-2xl font-bold text-emerald-600">89 ms</p>
          <p className="text-[10px] text-slate-500">API REST Cloud</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-400">Latência Média PNCP</span>
          <p className="text-2xl font-bold text-amber-600">210 ms</p>
          <p className="text-[10px] text-slate-500">Endpoint Federal</p>
        </div>
      </div>

      {/* Curva Visual de Horários de Pico */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Comportamento de Latência por Período do Dia (Telemetria)
            </h3>
          </div>
          <span className="text-xs text-slate-500">Horário Oficial de Brasília (SEDUC)</span>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Manhã (08h às 12h) - Tramitações Iniciais</span>
              <span className="font-mono text-emerald-600">118ms (Ótimo)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '40%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Tarde / Horário de Pico (14h às 17h) - Despachos e Publicações</span>
              <span className="font-mono text-amber-600">185ms (Moderado)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Noite e Madrugada (19h às 06h) - Cargas em Lote</span>
              <span className="font-mono text-blue-600">82ms (Ultra Rápido)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnóstico Inteligente de Falhas (Troubleshooting Guiado) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Guia de Resolução Rápida de Erros de Conector (Base de Conhecimento STI)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-red-700 font-mono text-[11px] bg-red-100 px-2 py-0.5 rounded">
              Erro HTTP 401 Unauthorized
            </span>
            <p className="font-bold text-slate-800">Senha ou Chave Expirada no SEI</p>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              O usuário de serviço teve a senha alterada no catálogo corporativo do SEI. 
              Acesse a aba 1 e atualize a credencial no cofre do servidor.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-amber-700 font-mono text-[11px] bg-amber-100 px-2 py-0.5 rounded">
              Erro HTTP 403 Forbidden
            </span>
            <p className="font-bold text-slate-800">Bloqueio de IP no Firewall Estadual</p>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              O IP da nova máquina de deploy não está na lista branca da ATI-MA. Solicite inclusão de rota junto à equipe de redes.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-blue-700 font-mono text-[11px] bg-blue-100 px-2 py-0.5 rounded">
              Erro HTTP 504 Gateway Timeout
            </span>
            <p className="font-bold text-slate-800">Congestionamento do Barramento</p>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              O WebService do SEI está demorando mais de 30 segundos. O Circuit Breaker assumirá o controle automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
