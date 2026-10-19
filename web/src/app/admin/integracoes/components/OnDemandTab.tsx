'use client';

import React from 'react';
import { Zap, Play, CheckCircle2, RefreshCw, CalendarClock } from 'lucide-react';
import { IntegracaoConfig } from '../types';

interface OnDemandTabProps {
  processoSyncInput: string;
  setProcessoSyncInput: (val: string) => void;
  handleExecutarSincronizacaoSobDemanda: () => void;
  syncStatus: {
    executando: boolean;
    etapa: string;
    concluido: boolean;
    dadosRetornados?: any;
  };
  config: IntegracaoConfig;
  setConfig: React.Dispatch<React.SetStateAction<IntegracaoConfig>>;
  handleSalvar: (e?: React.FormEvent) => void;
}

export const OnDemandTab: React.FC<OnDemandTabProps> = ({
  processoSyncInput,
  setProcessoSyncInput,
  handleExecutarSincronizacaoSobDemanda,
  syncStatus,
  config,
  setConfig,
  handleSalvar
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          <Zap className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900">
            Disparo Imediato de Sincronização por Processo Específico (Priority Queue)
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Quando um despacho acabou de ser assinado pelo Secretário ou a CSL acabou de publicar uma ata, 
          você não precisa esperar o próximo ciclo de 15 ou 30 minutos. Digite o protocolo do processo abaixo 
          para acionar os conectores do SEI, StartGov e PNCP em tempo real.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={processoSyncInput}
              onChange={(e) => setProcessoSyncInput(e.target.value)}
              placeholder="Digite o número SEI (ex: SEI-021001/004521/2026)"
              className="w-full text-xs font-mono px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-semibold"
            />
          </div>
          <button
            type="button"
            onClick={handleExecutarSincronizacaoSobDemanda}
            disabled={syncStatus.executando || !processoSyncInput}
            className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className={`w-4 h-4 fill-current ${syncStatus.executando ? 'animate-spin' : ''}`} />
            <span>{syncStatus.executando ? 'Sincronizando...' : 'Sincronizar Agora (Furar Fila)'}</span>
          </button>
        </div>

        {/* Atalhos Rápidos de Processos Reais da Carteira */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium">Atalhos rápidos:</span>
          {[
            'SEI-021001/004521/2026',
            'SEI-021001/007812/2026',
            'SEI-021001/009134/2026'
          ].map((proto) => (
            <button
              key={proto}
              type="button"
              onClick={() => setProcessoSyncInput(proto)}
              className="text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md border border-slate-300 transition"
            >
              {proto}
            </button>
          ))}
        </div>

        {/* Barra de Progresso e Retorno em Tempo Real */}
        {(syncStatus.executando || syncStatus.concluido) && (
          <div className={`p-4 rounded-xl border space-y-3 transition ${
            syncStatus.concluido 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2">
                {syncStatus.concluido ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                )}
                <span>{syncStatus.etapa}</span>
              </span>
              <span className="text-[11px] font-mono">{syncStatus.concluido ? '100% Concluído' : 'Processando...'}</span>
            </div>

            {syncStatus.concluido && syncStatus.dadosRetornados && (
              <div className="bg-white p-4 rounded-lg border border-emerald-200 text-xs text-slate-800 space-y-2 font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div><strong>Protocolo:</strong> {syncStatus.dadosRetornados.protocolo}</div>
                  <div><strong>Unidade Atual:</strong> {syncStatus.dadosRetornados.unidadeAtual}</div>
                  <div><strong>Último Despacho:</strong> {syncStatus.dadosRetornados.ultimoDespacho}</div>
                  <div><strong>Assinado por:</strong> {syncStatus.dadosRetornados.autorDespacho}</div>
                  <div><strong>Status StartGov:</strong> {syncStatus.dadosRetornados.startgovStatus}</div>
                  <div><strong>Publicação PNCP:</strong> {syncStatus.dadosRetornados.pncpEdital}</div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
                  <span>Delta Hash Calculado: {syncStatus.dadosRetornados.deltaHash}</span>
                  <span>Sincronizado em: {syncStatus.dadosRetornados.dataHora}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Configuração de Agendamento Inteligente por Faixa de Horário */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          <CalendarClock className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Agendamento Inteligente de Sincronização por Horário Comercial
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Otimize o consumo de banda e infraestrutura configurando frequências mais rápidas durante o expediente da SEDUC 
          e espaçadas durante madrugadas e finais de semana.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Horário Comercial (Seg a Sex: 08h às 19h)
            </label>
            <select
              value={config.agendamento.intervaloComercialMinutos}
              onChange={(e) => setConfig({
                ...config,
                agendamento: { ...config.agendamento, intervaloComercialMinutos: Number(e.target.value) }
              })}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
            >
              <option value={10}>A cada 10 minutos (Alta Precisão)</option>
              <option value={15}>A cada 15 minutos (Padrão Recomendado)</option>
              <option value={30}>A cada 30 minutos</option>
            </select>
            <span className="text-[11px] text-slate-500 block">
              Garante que processos tramitados em gabinete apareçam na tela em minutos.
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Horário Noturno e Finais de Semana
            </label>
            <select
              value={config.agendamento.intervaloNoturnoMinutos}
              onChange={(e) => setConfig({
                ...config,
                agendamento: { ...config.agendamento, intervaloNoturnoMinutos: Number(e.target.value) }
              })}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
            >
              <option value={60}>A cada 1 hora</option>
              <option value={120}>A cada 2 horas (Recomendado)</option>
              <option value={240}>A cada 4 horas</option>
            </select>
            <span className="text-[11px] text-slate-500 block">
              Evita consultas inúteis fora do horário de expediente público estadual.
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSalvar}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
          >
            Salvar Política de Agendamento
          </button>
        </div>
      </div>
    </div>
  );
};
