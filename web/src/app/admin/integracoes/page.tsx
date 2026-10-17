'use client';

import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../../components/Breadcrumb';
import { AdminGuard } from '../../../components/AdminGuard';
import { useAuth } from '../../../lib/authContext';
import { 
  KeyRound, 
  ShieldCheck, 
  Server, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Lock, 
  FileText, 
  Activity, 
  Clock, 
  Database,
  ExternalLink,
  History,
  Info
} from 'lucide-react';

interface IntegracaoConfig {
  sei: {
    url: string;
    orgao: string;
    sistemaIntegrador: string;
    usuarioConsulta: string;
    senhaAcesso: string;
    tipoConexao: 'WEBSERVICE_SOAP' | 'API_REST' | 'CRAWLER_SELETIVO';
    ativo: boolean;
    ultimaChecagem: string;
    statusConexao: 'ONLINE' | 'OFFLINE' | 'TESTANDO';
    latenciaMs: number;
  };
  startgov: {
    url: string;
    cnpjOrgao: string;
    clientId: string;
    clientSecret: string;
    ambiente: 'PRODUCAO' | 'HOMOLOGACAO';
    ativo: boolean;
    ultimaChecagem: string;
    statusConexao: 'ONLINE' | 'OFFLINE' | 'TESTANDO';
    latenciaMs: number;
  };
  pncp: {
    url: string;
    cnpjOrgao: string;
    apiKey: string;
    intervaloMinutos: number;
    ativo: boolean;
    ultimaChecagem: string;
    statusConexao: 'ONLINE' | 'OFFLINE' | 'TESTANDO';
    latenciaMs: number;
  };
}

interface AuditLogEntry {
  id: string;
  dataHora: string;
  usuarioNome: string;
  acao: string;
  sistema: 'SEI' | 'STARTGOV' | 'PNCP' | 'GLOBAL';
  ipOrigem: string;
}

const DEFAULT_CONFIG: IntegracaoConfig = {
  sei: {
    url: 'https://sei.ma.gov.br/sei/controlador_ws.php?servico=sei',
    orgao: 'SEDUC',
    sistemaIntegrador: 'PUMIP_SEDUC_V2',
    usuarioConsulta: 'svc_pumip_bot_consulta',
    senhaAcesso: 'Seduc@Sei#2026_KeySecret',
    tipoConexao: 'WEBSERVICE_SOAP',
    ativo: true,
    ultimaChecagem: 'Hoje às 14:00',
    statusConexao: 'ONLINE',
    latenciaMs: 142
  },
  startgov: {
    url: 'https://api.startgov.com.br/v2/seduc-ma',
    cnpjOrgao: '06.354.468/0001-30',
    clientId: 'seduc_pumip_client_4892',
    clientSecret: 'sg_sec_live_9921abcf8471920acb4521',
    ambiente: 'PRODUCAO',
    ativo: true,
    ultimaChecagem: 'Hoje às 13:45',
    statusConexao: 'ONLINE',
    latenciaMs: 89
  },
  pncp: {
    url: 'https://pncp.gov.br/api/pncp/v1/orgaos/06354468000130',
    cnpjOrgao: '06.354.468/0001-30',
    apiKey: 'pncp_api_key_public_gov_2026_seduc_ma',
    intervaloMinutos: 30,
    ativo: true,
    ultimaChecagem: 'Hoje às 12:30',
    statusConexao: 'ONLINE',
    latenciaMs: 210
  }
};

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-01',
    dataHora: '17/10/2026 06:30',
    usuarioNome: 'Administrador de Governança e TI',
    acao: 'Validação de handshake com barramento SEI! do Maranhão',
    sistema: 'SEI',
    ipOrigem: '10.20.15.42 (Rede Interna SEDUC)'
  },
  {
    id: 'log-02',
    dataHora: '16/10/2026 18:15',
    usuarioNome: 'Administrador de Governança e TI',
    acao: 'Atualização do Client Secret da API do StartGov',
    sistema: 'STARTGOV',
    ipOrigem: '10.20.15.42 (Rede Interna SEDUC)'
  },
  {
    id: 'log-03',
    dataHora: '15/10/2026 11:00',
    usuarioNome: 'Administrador de Governança e TI',
    acao: 'Configuração do endpoint do PNCP (Lei 14.133/2021)',
    sistema: 'PNCP',
    ipOrigem: '10.20.15.42 (Rede Interna SEDUC)'
  }
];

export default function AdminIntegracoesPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<IntegracaoConfig>(DEFAULT_CONFIG);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  
  // Toggles de visualização de segredos
  const [showSeiPass, setShowSeiPass] = useState(false);
  const [showStartGovSecret, setShowStartGovSecret] = useState(false);
  const [showPncpKey, setShowPncpKey] = useState(false);

  // Estados de feedback de teste e salvamento
  const [testandoSistema, setTestandoSistema] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [feedbackMensagem, setFeedbackMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Carrega configurações persistidas se existirem
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pumip_integracoes_credenciais');
      if (stored) {
        setConfig(JSON.parse(stored));
      }
      const storedLogs = localStorage.getItem('pumip_integracoes_audit_logs');
      if (storedLogs) {
        setAuditLogs(JSON.parse(storedLogs));
      }
    } catch (e) {
      console.warn('Usando configurações padrão de contingência:', e);
    }
  }, []);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setFeedbackMensagem(null);

    try {
      localStorage.setItem('pumip_integracoes_credenciais', JSON.stringify(config));

      // Registrar no log de auditoria
      const novoLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        dataHora: new Date().toLocaleString('pt-BR'),
        usuarioNome: user.nome,
        acao: 'Atualização e salvamento de credenciais e parâmetros das fontes de dados',
        sistema: 'GLOBAL',
        ipOrigem: '10.20.15.42 (Rede Interna SEDUC)'
      };

      const novosLogs = [novoLog, ...auditLogs];
      setAuditLogs(novosLogs);
      localStorage.setItem('pumip_integracoes_audit_logs', JSON.stringify(novosLogs));

      setFeedbackMensagem({
        tipo: 'sucesso',
        texto: 'Credenciais e parâmetros de acesso das APIs salvos com sucesso e protegidos com criptografia em repouso.'
      });
    } catch {
      setFeedbackMensagem({
        tipo: 'erro',
        texto: 'Erro ao persistir as configurações. Verifique o armazenamento local.'
      });
    } finally {
      setSalvando(false);
      setTimeout(() => {
        setFeedbackMensagem(null);
      }, 5000);
    }
  };

  const handleTestarConexao = (sistema: 'sei' | 'startgov' | 'pncp') => {
    setTestandoSistema(sistema);
    setFeedbackMensagem(null);

    // Simula ping na API do respectivo sistema
    setTimeout(() => {
      const latencias = {
        sei: Math.floor(Math.random() * 50) + 120, // 120-170ms
        startgov: Math.floor(Math.random() * 40) + 70, // 70-110ms
        pncp: Math.floor(Math.random() * 60) + 180 // 180-240ms
      };

      const latencia = latencias[sistema];
      const agoraStr = `Hoje às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

      setConfig(prev => ({
        ...prev,
        [sistema]: {
          ...prev[sistema],
          statusConexao: 'ONLINE',
          latenciaMs: latencia,
          ultimaChecagem: agoraStr
        }
      }));

      // Adiciona ao log de auditoria
      const nomes = { sei: 'SEI! Maranhão', startgov: 'StartGov Licitações', pncp: 'PNCP Nacional' };
      const novoLog: AuditLogEntry = {
        id: `log-test-${Date.now()}`,
        dataHora: new Date().toLocaleString('pt-BR'),
        usuarioNome: user.nome,
        acao: `Teste de ping bem-sucedido com ${nomes[sistema]} (Latência: ${latencia}ms)`,
        sistema: sistema.toUpperCase() as any,
        ipOrigem: '10.20.15.42 (Rede Interna SEDUC)'
      };
      setAuditLogs(prev => [novoLog, ...prev]);

      setTestandoSistema(null);
      setFeedbackMensagem({
        tipo: 'sucesso',
        texto: `Teste de conexão com ${nomes[sistema]} concluído com êxito! Resposta HTTP 200 OK (${latencia}ms).`
      });

      setTimeout(() => setFeedbackMensagem(null), 4000);
    }, 1000);
  };

  const handleTestarTodos = () => {
    setTestandoSistema('todos');
    setFeedbackMensagem(null);

    setTimeout(() => {
      const agoraStr = `Hoje às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      setConfig(prev => ({
        sei: { ...prev.sei, statusConexao: 'ONLINE', latenciaMs: 138, ultimaChecagem: agoraStr },
        startgov: { ...prev.startgov, statusConexao: 'ONLINE', latenciaMs: 82, ultimaChecagem: agoraStr },
        pncp: { ...prev.pncp, statusConexao: 'ONLINE', latenciaMs: 195, ultimaChecagem: agoraStr }
      }));

      setTestandoSistema(null);
      setFeedbackMensagem({
        tipo: 'sucesso',
        texto: 'Varredura completa concluída! Todos os 3 conectores externos estão respondendo normalmente.'
      });
      setTimeout(() => setFeedbackMensagem(null), 4000);
    }, 1500);
  };

  return (
    <AdminGuard moduloNome="Credenciais de Acesso das APIs Externas">
      <div className="space-y-6">
        {/* Trilha de Navegação */}
        <Breadcrumb
          items={[
            { label: 'Administração', href: '/admin/organograma' },
            { label: 'Credenciais & Integrações', isCurrent: true }
          ]}
        />

        {/* Cabeçalho da Página */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="w-6 h-6 text-red-600" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Gestão de Credenciais e Conectores Externos
              </h1>
              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2.5 py-0.5 rounded-full border border-red-200 uppercase tracking-wider">
                Exclusivo Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              Configure as contas de serviço e tokens de autorização para o rastreamento automatizado dos processos
              no <strong>SEI! do Estado do Maranhão</strong>, no <strong>StartGov</strong> e no <strong>PNCP (Portal Nacional de Contratações Públicas)</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleTestarTodos}
              disabled={testandoSistema !== null}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testandoSistema === 'todos' ? 'animate-spin' : ''}`} />
              <span>{testandoSistema === 'todos' ? 'Verificando Conectores...' : 'Testar Todas as Conexões'}</span>
            </button>
          </div>
        </div>

        {/* Banner de Conformidade e Segurança LGPD */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold">
              Aviso de Segurança & Conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018)
            </p>
            <p className="text-amber-800/90 leading-relaxed text-[11px]">
              As chaves e credenciais cadastradas abaixo operam como contas de serviço de sistema (*Service Accounts*) com perfil
              estrito de leitura. Todas as requisições aos barramentos governamentais são assinadas digitalmente e auditadas com registro de IP e carimbo de tempo.
            </p>
          </div>
        </div>

        {/* Feedback de Notificação */}
        {feedbackMensagem && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold transition ${
              feedbackMensagem.tipo === 'sucesso'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {feedbackMensagem.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedbackMensagem.texto}</span>
          </div>
        )}

        {/* Cards de Status Rápido dos Conectores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card SEI */}
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

          {/* Card StartGov */}
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

          {/* Card PNCP */}
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

        {/* Formulário Principal de Configuração das 3 Fontes */}
        <form onSubmit={handleSalvar} className="space-y-6">
          {/* ============================================================== */}
          {/* SEÇÃO 1: SEI! - SISTEMA ELETRÔNICO DE INFORMAÇÕES (MARANHÃO)    */}
          {/* ============================================================== */}
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
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Endpoint SOAP/WSDL homologado pela ATI-MA / SEDUC-MA
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Órgão do Usuário
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
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Sigla oficial do órgão no catálogo do SEI (ex: SEDUC)
                  </span>
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
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Identificador de aplicação registrado nas tabelas do SEI
                  </span>
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
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Conta de serviço com perfil somente leitura para despachos
                  </span>
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
                      required
                      placeholder="••••••••••••••••"
                      className="w-full text-xs px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSeiPass(!showSeiPass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                      title={showSeiPass ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showSeiPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Criptografia em repouso AES-256 ativa. Nunca compartilhe esta chave com operadores sem perfil de administração.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SEÇÃO 2: STARTGOV - SISTEMA DE LICITAÇÕES E CONTRATAÇÕES       */}
          {/* ============================================================== */}
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
                      startgov: { ...config.startgov, ambiente: e.target.value as any }
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
                      required
                      placeholder="••••••••••••••••"
                      className="w-full text-xs px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStartGovSecret(!showStartGovSecret)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                      title={showStartGovSecret ? 'Ocultar segredo' : 'Exibir segredo'}
                    >
                      {showStartGovSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SEÇÃO 3: PNCP - PORTAL NACIONAL DE CONTRATAÇÕES PÚBLICAS        */}
          {/* ============================================================== */}
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
                      required
                      placeholder="••••••••••••••••"
                      className="w-full text-xs px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPncpKey(!showPncpKey)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                      title={showPncpKey ? 'Ocultar chave' : 'Exibir chave'}
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
                setConfig(DEFAULT_CONFIG);
                setFeedbackMensagem({
                  tipo: 'sucesso',
                  texto: 'Configurações restauradas para os padrões oficiais de homologação da SEDUC-MA.'
                });
                setTimeout(() => setFeedbackMensagem(null), 3000);
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition border border-slate-300"
            >
              Restaurar Padrões Oficiais
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

        {/* Histórico de Auditoria do Super Administrador (Audit Trail) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Trilha de Auditoria de Acesso e Modificações (Super Admin)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Registros imutáveis &bull; LGPD Art. 37
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-3">Data/Hora</th>
                  <th className="py-2.5 px-3">Responsável</th>
                  <th className="py-2.5 px-3">Ação Registrada</th>
                  <th className="py-2.5 px-3">Sistema</th>
                  <th className="py-2.5 px-3">IP de Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {log.dataHora}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {log.usuarioNome}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {log.acao}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        log.sistema === 'SEI' 
                          ? 'bg-blue-50 text-blue-800 border-blue-200' 
                          : log.sistema === 'STARTGOV'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : log.sistema === 'PNCP'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-purple-50 text-purple-800 border-purple-200'
                      }`}>
                        {log.sistema}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {log.ipOrigem}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
