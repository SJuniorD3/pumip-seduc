'use client';

import React from 'react';
import { Code, Send } from 'lucide-react';

interface PlaygroundTabProps {
  playgroundSistema: 'SEI' | 'STARTGOV' | 'PNCP';
  setPlaygroundSistema: (sistema: 'SEI' | 'STARTGOV' | 'PNCP') => void;
  playgroundOperacao: string;
  setPlaygroundOperacao: (op: string) => void;
  playgroundParametro: string;
  setPlaygroundParametro: (param: string) => void;
  playgroundLoading: boolean;
  handleExecutarPlayground: () => void;
  playgroundOutput: string | null;
}

export const PlaygroundTab: React.FC<PlaygroundTabProps> = ({
  playgroundSistema,
  setPlaygroundSistema,
  playgroundOperacao,
  setPlaygroundOperacao,
  playgroundParametro,
  setPlaygroundParametro,
  playgroundLoading,
  handleExecutarPlayground,
  playgroundOutput
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          <Code className="w-5 h-5 text-slate-800" />
          <h2 className="text-base font-bold text-slate-900">
            Simulador de Chamadas de API & Inspecionador de Payloads Brutos
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Ferramenta de testes do Super Administrador para simular chamadas contra os endpoints oficiais e 
          inspecionar a resposta em JSON antes de aplicar novas regras de extração pelo coletor de dados.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sistema Alvo</label>
            <select
              value={playgroundSistema}
              onChange={(e) => setPlaygroundSistema(e.target.value as any)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            >
              <option value="SEI">SEI! Maranhão (WebService)</option>
              <option value="STARTGOV">StartGov Licitações (API REST)</option>
              <option value="PNCP">PNCP Nacional (API v1)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Operação</label>
            <select
              value={playgroundOperacao}
              onChange={(e) => setPlaygroundOperacao(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            >
              <option value="consultarAndamentoProcesso">consultarAndamentoProcesso()</option>
              <option value="listarDocumentosAnexados">listarDocumentosAnexados()</option>
              <option value="obterMetadadosCertame">obterMetadadosCertame()</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Parâmetro de Protocolo</label>
            <input
              type="text"
              value={playgroundParametro}
              onChange={(e) => setPlaygroundParametro(e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleExecutarPlayground}
            disabled={playgroundLoading}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            <Send className={`w-3.5 h-3.5 ${playgroundLoading ? 'animate-spin' : ''}`} />
            <span>{playgroundLoading ? 'Executando Chamada...' : 'Executar Chamada de Teste'}</span>
          </button>
        </div>

        {/* Terminal de Saída JSON */}
        {playgroundOutput && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
              <span>Resposta Bruta (JSON Formatado):</span>
              <span className="font-mono text-emerald-600">HTTP 200 OK &bull; application/json</span>
            </div>
            <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-96 border border-slate-800 shadow-inner">
              {playgroundOutput}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
