'use client';

import React from 'react';
import { Cpu, Sliders, Radio } from 'lucide-react';
import { IntegracaoConfig } from '../types';

interface ResilienciaTabProps {
  config: IntegracaoConfig;
  setConfig: React.Dispatch<React.SetStateAction<IntegracaoConfig>>;
  handleSalvar: (e?: React.FormEvent) => void;
}

export const ResilienciaTab: React.FC<ResilienciaTabProps> = ({
  config,
  setConfig,
  handleSalvar
}) => {
  return (
    <div className="space-y-6">
      {/* Circuit Breaker */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          <Cpu className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-bold text-slate-900">
            Proteção por Circuit Breaker (Disjuntor Inteligente)
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          O padrão <strong>Circuit Breaker</strong> protege o PUMIP e a infraestrutura da SEDUC/ATI-MA. 
          Se o SEI! ou StartGov apresentarem falhas consecutivas, o conector suspende temporariamente as requisições 
          para evitar bloqueios por firewall ou agravamento da instabilidade.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 space-y-1">
            <span className="text-xs text-purple-800 font-bold uppercase">Status Atual do Disjuntor</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-sm font-bold text-slate-900">FECHADO (Operando Normalmente)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Nenhuma falha consecutiva detectada.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Limite de Falhas Consecutivas para Desarmar
            </label>
            <input
              type="number"
              min={3}
              max={15}
              value={config.resiliencia.limiteFalhasConsecutivas}
              onChange={(e) => setConfig({
                ...config,
                resiliencia: { ...config.resiliencia, limiteFalhasConsecutivas: Number(e.target.value) }
              })}
              className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg"
            />
            <span className="text-xs text-slate-500 block">Padrão: 5 erros consecutivos</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Tempo de Espera em Quarentena (Minutos)
            </label>
            <input
              type="number"
              min={2}
              max={60}
              value={config.resiliencia.tempoEsperaMinutos}
              onChange={(e) => setConfig({
                ...config,
                resiliencia: { ...config.resiliencia, tempoEsperaMinutos: Number(e.target.value) }
              })}
              className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg"
            />
            <span className="text-xs text-slate-500 block">Padrão: 10 minutos em repouso</span>
          </div>
        </div>
      </div>

      {/* Controle de Vazão (Rate Limiting) & Jitter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          <Sliders className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Rate Limiting, Jitter e Retry com Exponential Backoff
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Vazão Máxima (Requisições por Minuto)
              </label>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                {config.resiliencia.rateLimitMaxPorMinuto} req/min
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={180}
              step={10}
              value={config.resiliencia.rateLimitMaxPorMinuto}
              onChange={(e) => setConfig({
                ...config,
                resiliencia: { ...config.resiliencia, rateLimitMaxPorMinuto: Number(e.target.value) }
              })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-xs text-slate-500 leading-relaxed">
              Controla o número de chamadas ao SEI! para garantir que o coletor permaneça seguro e abaixo do limite de saturação da ATI-MA.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.resiliencia.jitterAtivo}
                  onChange={(e) => setConfig({
                    ...config,
                    resiliencia: { ...config.resiliencia, jitterAtivo: e.target.checked }
                  })}
                  className="rounded text-indigo-600 w-4 h-4"
                />
                <span>Espaçamento Aleatório de Conexão (<em>Jitter</em>)</span>
              </label>
              <p className="text-xs text-slate-500 pl-6">
                Adiciona pequenas variações aleatórias de 2 a 7 segundos para evitar picos simultâneos (<em>thundering herd</em>).
              </p>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={config.resiliencia.retryExponential}
                  onChange={(e) => setConfig({
                    ...config,
                    resiliencia: { ...config.resiliencia, retryExponential: e.target.checked }
                  })}
                  className="rounded text-indigo-600 w-4 h-4"
                />
                <span>Tentativa com <em>Exponential Backoff</em> (2s, 4s, 8s)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Configuração de Webhooks Inbound */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Webhooks Inbound: Recepção Ativa de Eventos (Push)
            </h3>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
            Modo Híbrido Ativo
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Além de buscar os dados periodicamente (polling), o PUMIP expõe URLs autenticadas para que o SEI! ou o StartGov 
          possam enviar notificações instantâneas no momento exato em que um processo for tramitado.
        </p>

        <div className="space-y-3 font-mono text-xs">
          <div>
            <label className="block text-xs font-sans font-semibold text-slate-700 mb-1">
              Endpoint de Webhook para o SEI! do Maranhão
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value="https://pumip.seduc.ma.gov.br/api/v1/webhooks/sei"
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 text-xs"
              />
              <button
                type="button"
                onClick={() => alert('URL copiada para a área de transferência')}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-sans font-bold"
              >
                Copiar
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans font-semibold text-slate-700 mb-1">
              Chave Secreta de Assinatura HMAC (Configurada no Servidor)
            </label>
            <input
              type="password"
              readOnly
              value="••••••••••••••••••••••••••••••••"
              className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => handleSalvar()}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            Salvar Parâmetros de Resiliência
          </button>
        </div>
      </div>
    </div>
  );
};
