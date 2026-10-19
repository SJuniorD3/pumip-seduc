'use client';

import React, { useState } from 'react';
import { Activity, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { IntegracaoConfig } from '../types';

interface ConectoresTabProps {
  config: IntegracaoConfig;
  setConfig: React.Dispatch<React.SetStateAction<IntegracaoConfig>>;
  salvando: boolean;
  handleSalvar: (e?: React.FormEvent) => void;
  handleTestarConexao: (sistema: 'sei' | 'startgov' | 'pncp') => Promise<void>;
  testandoSistema: string | null;
  setFeedbackMensagem: React.Dispatch<React.SetStateAction<{ tipo: 'sucesso' | 'erro' | 'info'; texto: string } | null>>;
  defaultConfig: IntegracaoConfig;
}

export const ConectoresTab: React.FC<ConectoresTabProps> = ({
  config,
  setConfig,
  salvando,
  handleSalvar,
  handleTestarConexao,
  testandoSistema,
  setFeedbackMensagem,
  defaultConfig
}) => {
  const [showSeiPass, setShowSeiPass] = useState(false);
  const [showStartGovSecret, setShowStartGovSecret] = useState(false);
  const [showPncpKey, setShowPncpKey] = useState(false);

  return (
    <form onSubmit={handleSalvar} className="space-y-6">
      {/* Cards de Status Rápido dos Conectores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-800">SEI! Maranhão</span>
            </div>
            <p className="text-[11px] text-slate-500">Última checagem: {config.sei.ultimaChecagem}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {config.sei.latenciaMs}ms
            </span>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">Status: Conectado</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-800">StartGov Licitações</span>
            </div>
            <p className="text-[11px] text-slate-500">Última checagem: {config.startgov.ultimaChecagem}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {config.startgov.latenciaMs}ms
            </span>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">Status: Conectado</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-800">PNCP Nacional</span>
            </div>
            <p className="text-[11px] text-slate-500">Última checagem: {config.pncp.ultimaChecagem}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {config.pncp.latenciaMs}ms
            </span>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">Status: Conectado</p>
          </div>
        </div>
      </div>

      {/* SEÇÃO SEI! */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
              SEI
            </div>
            <div>
              <h2 className="text-base font-bold">1. Conector SEI! do Estado do Maranhão</h2>
              <p className="text-xs text-blue-200">WebService oficial de consulta e tramitação processual (SEI-MA)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTestarConexao('sei')}
              disabled={testandoSistema !== null}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 ${testandoSistema === 'sei' ? 'animate-spin' : ''}`} />
              <span>{testandoSistema === 'sei' ? 'Testando Ping...' : 'Testar Conexão SEI!'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL do Endpoint do WebService SEI!
              </label>
              <input
                type="url"
                value={config.sei.url}
                onChange={(e) => setConfig({
                  ...config,
                  sei: { ...config.sei, url: e.target.value }
                })}
                required
                placeholder="https://sei.ma.gov.br/sei/controlador_ws.php?servico=sei"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Órgão Solicitante
              </label>
              <input
                type="text"
                value={config.sei.orgao}
                onChange={(e) => setConfig({
                  ...config,
                  sei: { ...config.sei, orgao: e.target.value }
                })}
                required
                placeholder="SEDUC"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sigla do Sistema Integrador
              </label>
              <input
                type="text"
                value={config.sei.sistemaIntegrador}
                onChange={(e) => setConfig({
                  ...config,
                  sei: { ...config.sei, sistemaIntegrador: e.target.value }
                })}
                required
                placeholder="PUMIP_SEDUC"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Usuário de Consulta / Serviço (Login)
              </label>
              <input
                type="text"
                value={config.sei.usuarioConsulta}
                onChange={(e) => setConfig({
                  ...config,
                  sei: { ...config.sei, usuarioConsulta: e.target.value }
                })}
                required
                placeholder="svc_pumip_bot_consulta"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Senha de Acesso / Chave Privada do Serviço
              </label>
              <div className="relative">
                <input
                  type={showSeiPass ? 'text' : 'password'}
                  value={config.sei.senhaAcesso}
                  onChange={(e) => setConfig({
                    ...config,
                    sei: { ...config.sei, senhaAcesso: e.target.value }
                  })}
                  placeholder="••••••••••••••••"
                  className="w-full text-xs px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowSeiPass(!showSeiPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showSeiPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO STARTGOV */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 to-teal-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-sm">
              SG
            </div>
            <div>
              <h2 className="text-base font-bold">2. Conector StartGov (Compras & Licitações)</h2>
              <p className="text-xs text-emerald-200">API REST de acompanhamento da fase externa e pregões da CSL</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTestarConexao('startgov')}
              disabled={testandoSistema !== null}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 ${testandoSistema === 'startgov' ? 'animate-spin' : ''}`} />
              <span>{testandoSistema === 'startgov' ? 'Testando Ping...' : 'Testar Conexão StartGov'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL Base da API do StartGov
              </label>
              <input
                type="url"
                value={config.startgov.url}
                onChange={(e) => setConfig({
                  ...config,
                  startgov: { ...config.startgov, url: e.target.value }
                })}
                required
                placeholder="https://api.startgov.com.br/v2/seduc-ma"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CNPJ do Órgão Gestor
              </label>
              <input
                type="text"
                value={config.startgov.cnpjOrgao}
                onChange={(e) => setConfig({
                  ...config,
                  startgov: { ...config.startgov, cnpjOrgao: e.target.value }
                })}
                required
                placeholder="06.354.468/0001-30"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client ID da Aplicação
              </label>
              <input
                type="text"
                value={config.startgov.clientId}
                onChange={(e) => setConfig({
                  ...config,
                  startgov: { ...config.startgov, clientId: e.target.value }
                })}
                required
                placeholder="seduc_pumip_client_4892"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ambiente de Execução
              </label>
              <select
                value={config.startgov.ambiente}
                onChange={(e) => setConfig({
                  ...config,
                  startgov: { ...config.startgov, ambiente: e.target.value as 'PRODUCAO' | 'HOMOLOGACAO' }
                })}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
              >
                <option value="PRODUCAO">Produção (Ambiente Oficial SEDUC-MA)</option>
                <option value="HOMOLOGACAO">Homologação / Sandbox de Testes</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client Secret / Token Bearer
              </label>
              <div className="relative">
                <input
                  type={showStartGovSecret ? 'text' : 'password'}
                  value={config.startgov.clientSecret}
                  onChange={(e) => setConfig({
                    ...config,
                    startgov: { ...config.startgov, clientSecret: e.target.value }
                  })}
                  placeholder="••••••••••••••••"
                  className="w-full text-xs px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowStartGovSecret(!showStartGovSecret)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showStartGovSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO PNCP */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-900 to-orange-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center font-bold text-white shadow-sm">
              PNCP
            </div>
            <div>
              <h2 className="text-base font-bold">3. Conector PNCP (Portal Nacional de Contratações)</h2>
              <p className="text-xs text-amber-200">Publicações obrigatórias de editais, atas e contratos (Lei 14.133/2021)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTestarConexao('pncp')}
              disabled={testandoSistema !== null}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 ${testandoSistema === 'pncp' ? 'animate-spin' : ''}`} />
              <span>{testandoSistema === 'pncp' ? 'Testando Ping...' : 'Testar Conexão PNCP'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL Endpoint da API do PNCP
              </label>
              <input
                type="url"
                value={config.pncp.url}
                onChange={(e) => setConfig({
                  ...config,
                  pncp: { ...config.pncp, url: e.target.value }
                })}
                required
                placeholder="https://pncp.gov.br/api/pncp/v1/orgaos/06354468000130"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Periodicidade da Consulta Automática
              </label>
              <select
                value={config.pncp.intervaloMinutos}
                onChange={(e) => setConfig({
                  ...config,
                  pncp: { ...config.pncp, intervaloMinutos: Number(e.target.value) }
                })}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-800"
              >
                <option value={15}>A cada 15 minutos (Alta Frequência)</option>
                <option value={30}>A cada 30 minutos (Recomendado)</option>
                <option value={60}>A cada 1 hora</option>
                <option value={360}>A cada 6 horas</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chave de Acesso / API Key de Consulta Pública
              </label>
              <div className="relative">
                <input
                  type={showPncpKey ? 'text' : 'password'}
                  value={config.pncp.apiKey}
                  onChange={(e) => setConfig({
                    ...config,
                    pncp: { ...config.pncp, apiKey: e.target.value }
                  })}
                  placeholder="••••••••••••••••"
                  className="w-full text-xs px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPncpKey(!showPncpKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPncpKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Ação Principal */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => {
            setConfig(defaultConfig);
            setFeedbackMensagem({
              tipo: 'sucesso',
              texto: 'Configurações restauradas para os padrões oficiais de homologação da SEDUC-MA.'
            });
            setTimeout(() => setFeedbackMensagem(null), 3000);
          }}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition border border-slate-300"
        >
          Restaurar Padrões de Homologação
        </button>

        <button
          type="submit"
          disabled={salvando}
          className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{salvando ? 'Salvando com Criptografia...' : 'Salvar Todas as Credenciais'}</span>
        </button>
      </div>
    </form>
  );
};
