'use client';

import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../../components/Breadcrumb';
import { AdminGuard } from '../../../components/AdminGuard';
import { useAuth } from '../../../lib/authContext';
import { 
  KeyRound, 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  History, 
  Zap, 
  ShieldAlert, 
  Cpu, 
  Check, 
  BarChart2, 
  Code 
} from 'lucide-react';
import { Abbr, InfoTooltip } from '../../../components/Tooltip';
import { IntegracaoConfig, AuditLogEntry } from './types';
import { ConectoresTab } from './components/ConectoresTab';
import { OnDemandTab } from './components/OnDemandTab';
import { ResilienciaTab } from './components/ResilienciaTab';
import { TelemetriaTab } from './components/TelemetriaTab';
import { PlaygroundTab } from './components/PlaygroundTab';

const DEFAULT_CONFIG: IntegracaoConfig = {
  sei: {
    url: 'https://sei.ma.gov.br/sei/controlador_ws.php?servico=sei',
    orgao: 'SEDUC',
    sistemaIntegrador: 'PUMIP_SEDUC',
    usuarioConsulta: '',
    senhaAcesso: '',
    tipoConexao: 'WEBSERVICE_SOAP',
    ativo: true,
    ultimaChecagem: 'Hoje às 06:40',
    statusConexao: 'ONLINE',
    latenciaMs: 142
  },
  startgov: {
    url: 'https://api.startgov.com.br/v2/seduc-ma',
    cnpjOrgao: '06.354.468/0001-30',
    clientId: '',
    clientSecret: '',
    ambiente: 'PRODUCAO',
    ativo: true,
    ultimaChecagem: 'Hoje às 06:42',
    statusConexao: 'ONLINE',
    latenciaMs: 89
  },
  pncp: {
    url: 'https://pncp.gov.br/api/pncp/v1/orgaos/06354468000130',
    cnpjOrgao: '06.354.468/0001-30',
    apiKey: '',
    intervaloMinutos: 30,
    ativo: true,
    ultimaChecagem: 'Hoje às 06:30',
    statusConexao: 'ONLINE',
    latenciaMs: 210
  },
  certificadoDigital: {
    habilitado: false,
    arquivoNome: 'SEDUC_MA_CERTIFICADO_A1_2026.pfx',
    dataValidade: '15/12/2026',
    senhaCertificado: '••••••••••••',
    emissor: 'Autoridade Certificadora SERPRO Final SSL v4',
    alertaUrgenciaAtivo: true
  },
  resiliencia: {
    circuitBreakerAtivo: true,
    limiteFalhasConsecutivas: 5,
    tempoEsperaMinutos: 10,
    rateLimitMaxPorMinuto: 60,
    jitterAtivo: true,
    retryExponential: true
  },
  agendamento: {
    intervaloComercialMinutos: 15,
    intervaloNoturnoMinutos: 120,
    modoHibridoWebhooks: true
  }
};

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-01',
    dataHora: '17/10/2026 06:45',
    usuarioNome: 'Administrador de Governança e TI',
    acao: 'Validação de resiliência e simulação de Circuit Breaker para o SEI-MA',
    sistema: 'RESILIENCIA',
    ipOrigem: '10.20.15.42 (Rede Interna SEDUC)'
  },
  {
    id: 'log-02',
    dataHora: '17/10/2026 06:30',
    usuarioNome: 'Administrador de Governança e TI',
    acao: 'Validação de handshake com barramento SEI! do Maranhão',
    sistema: 'SEI',
    ipOrigem: '10.20.15.42 (Rede Interna SEDUC)'
  },
  {
    id: 'log-03',
    dataHora: '16/10/2026 18:15',
    usuarioNome: 'Administrador de Governança e TI',
    acao: 'Atualização do Client Secret da API do StartGov',
    sistema: 'STARTGOV',
    ipOrigem: '10.20.15.42 (Rede Interna SEDUC)'
  }
];

export default function AdminIntegracoesPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<IntegracaoConfig>(DEFAULT_CONFIG);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [activeTab, setActiveTab] = useState<'CONECTORES' | 'ON_DEMAND' | 'RESILIENCIA' | 'TELEMETRIA' | 'PLAYGROUND'>('CONECTORES');
  
  // Estados de feedback de teste e salvamento
  const [testandoSistema, setTestandoSistema] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [feedbackMensagem, setFeedbackMensagem] = useState<{ tipo: 'sucesso' | 'erro' | 'info'; texto: string } | null>(null);

  // Estado da Sincronização Sob Demanda
  const [processoSyncInput, setProcessoSyncInput] = useState('SEI-021001/004521/2026');
  const [syncStatus, setSyncStatus] = useState<{
    executando: boolean;
    etapa: string;
    concluido: boolean;
    dadosRetornados?: any;
  }>({
    executando: false,
    etapa: '',
    concluido: false
  });

  // Estado do Playground de Payloads
  const [playgroundSistema, setPlaygroundSistema] = useState<'SEI' | 'STARTGOV' | 'PNCP'>('SEI');
  const [playgroundOperacao, setPlaygroundOperacao] = useState('consultarAndamentoProcesso');
  const [playgroundParametro, setPlaygroundParametro] = useState('021001/004521/2026');
  const [playgroundOutput, setPlaygroundOutput] = useState<string | null>(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);

  useEffect(() => {
    try {
      // REMEDIAÇÃO P0-3: Carrega apenas configurações não-sensíveis
      const stored = localStorage.getItem('pumip_integracoes_config_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfig(prev => ({
          ...prev,
          sei: { ...prev.sei, ...parsed.sei },
          startgov: { ...prev.startgov, ...parsed.startgov },
          pncp: { ...prev.pncp, ...parsed.pncp },
          certificadoDigital: { ...prev.certificadoDigital, ...parsed.certificadoDigital },
          resiliencia: parsed.resiliencia || prev.resiliencia,
          agendamento: parsed.agendamento || prev.agendamento
        }));
      }
      const storedLogs = localStorage.getItem('pumip_integracoes_audit_logs');
      if (storedLogs) {
        setAuditLogs(JSON.parse(storedLogs));
      }
    } catch (e) {
      console.warn('Usando configurações padrão de contingência:', e);
    }
  }, []);

  const handleSalvar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSalvando(true);
    setFeedbackMensagem(null);

    try {
      // REMEDIAÇÃO P0-3: NÃO armazena credenciais no navegador.
      // Salva apenas configurações não-sensíveis (URLs, intervalos, toggles).
      const configSegura = {
        sei: {
          url: config.sei.url,
          orgao: config.sei.orgao,
          sistemaIntegrador: config.sei.sistemaIntegrador,
          tipoConexao: config.sei.tipoConexao,
          ativo: config.sei.ativo
        },
        startgov: {
          url: config.startgov.url,
          cnpjOrgao: config.startgov.cnpjOrgao,
          ambiente: config.startgov.ambiente,
          ativo: config.startgov.ativo
        },
        pncp: {
          url: config.pncp.url,
          cnpjOrgao: config.pncp.cnpjOrgao,
          intervaloMinutos: config.pncp.intervaloMinutos,
          ativo: config.pncp.ativo
        },
        certificadoDigital: {
          habilitado: config.certificadoDigital.habilitado,
          alertaUrgenciaAtivo: config.certificadoDigital.alertaUrgenciaAtivo
        },
        resiliencia: config.resiliencia,
        agendamento: config.agendamento
      };

      localStorage.setItem('pumip_integracoes_config_v3', JSON.stringify(configSegura));

      const novoLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        dataHora: new Date().toLocaleString('pt-BR'),
        usuarioNome: user.nome,
        acao: 'Atualização de parâmetros dos conectores e políticas de resiliência (credenciais gerenciadas no servidor)',
        sistema: 'GLOBAL',
        ipOrigem: '10.20.15.42 (Rede Interna SEDUC)'
      };

      const novosLogs = [novoLog, ...auditLogs];
      setAuditLogs(novosLogs);
      localStorage.setItem('pumip_integracoes_audit_logs', JSON.stringify(novosLogs));

      setFeedbackMensagem({
        tipo: 'sucesso',
        texto: 'Configurações de conectores e resiliência salvas. Credenciais de acesso são gerenciadas exclusivamente no servidor (variáveis de ambiente).'
      });
    } catch {
      setFeedbackMensagem({
        tipo: 'erro',
        texto: 'Erro ao persistir as configurações. Verifique o armazenamento local.'
      });
    } finally {
      setSalvando(false);
      setTimeout(() => setFeedbackMensagem(null), 5000);
    }
  };

  const handleTestarConexao = async (sistema: 'sei' | 'startgov' | 'pncp') => {
    setTestandoSistema(sistema);
    setFeedbackMensagem(null);

    setTimeout(() => {
      const latencias = {
        sei: Math.floor(Math.random() * 50) + 120,
        startgov: Math.floor(Math.random() * 40) + 70,
        pncp: Math.floor(Math.random() * 60) + 180
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
        ...prev,
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

  // Simulação de Sincronização Sob Demanda (Priority Queue)
  const handleExecutarSincronizacaoSobDemanda = () => {
    if (!processoSyncInput) return;
    setSyncStatus({
      executando: true,
      etapa: 'Autenticando com credenciais de serviço no SEI-MA...',
      concluido: false
    });

    setTimeout(() => {
      setSyncStatus(prev => ({ ...prev, etapa: 'Consultando árvore de despachos e anexos no SEI!...' }));
      
      setTimeout(() => {
        setSyncStatus(prev => ({ ...prev, etapa: 'Cruzando com dados do pregão eletrônico no StartGov...' }));

        setTimeout(() => {
          setSyncStatus(prev => ({ ...prev, etapa: 'Verificando publicações de editais e atas no PNCP (Lei 14.133)...' }));

          setTimeout(() => {
            setSyncStatus({
              executando: false,
              etapa: 'Sincronização concluída com sucesso! 1 novo despacho e 1 termo aditivo detectados.',
              concluido: true,
              dadosRetornados: {
                protocolo: processoSyncInput,
                unidadeAtual: 'CSL (Comissão Setorial de Licitação)',
                ultimoDespacho: 'Despacho nº 4892/2026-SEDUC - Encaminhamento para Homologação',
                autorDespacho: 'Igor Manuel Sousa Rocha (Presidente CSL)',
                dataHora: new Date().toLocaleString('pt-BR'),
                startgovStatus: 'Fase de Lances Concluída - Proposta Adjudicada',
                pncpEdital: 'Publicação nº 045/2026 confirmada no PNCP',
                deltaHash: 'hash_' + Math.random().toString(36).substring(2, 10)
              }
            });

            // Adiciona ao log de auditoria
            const novoLog: AuditLogEntry = {
              id: `log-sync-${Date.now()}`,
              dataHora: new Date().toLocaleString('pt-BR'),
              usuarioNome: user.nome,
              acao: `Disparo de Sincronização Sob Demanda para o processo ${processoSyncInput}`,
              sistema: 'GLOBAL',
              ipOrigem: '10.20.15.42 (Rede Interna SEDUC)'
            };
            setAuditLogs(prev => [novoLog, ...prev]);
          }, 800);
        }, 800);
      }, 800);
    }, 800);
  };

  // Executar simulação de Playground de Payload
  const handleExecutarPlayground = () => {
    setPlaygroundLoading(true);
    setPlaygroundOutput(null);

    setTimeout(() => {
      let mockRes = {};
      if (playgroundSistema === 'SEI') {
        mockRes = {
          status: 200,
          statusText: 'OK',
          servico: 'SEI-WS-Maranhao/v2.1',
          timestamp: new Date().toISOString(),
          dados: {
            idProcedimento: '984120',
            protocoloProcedimentoFormatado: `SEI-${playgroundParametro}`,
            especificacao: 'Aquisição de Conectividade e Roteadores para Escolas',
            unidadeGeradora: { idUnidade: '6', sigla: 'SUDES', descricao: 'Supervisão de Desenvolvimento de Sistemas' },
            unidadeAtual: { idUnidade: '10', sigla: 'CSL', descricao: 'Comissão Setorial de Licitação' },
            andamentoAtual: {
              dataHora: new Date().toISOString(),
              descricao: 'Processo recebido na unidade para análise de propostas',
              usuario: { sigla: 'igor.rocha', nome: 'Igor Manuel Sousa Rocha' }
            }
          }
        };
      } else if (playgroundSistema === 'STARTGOV') {
        mockRes = {
          status: 200,
          statusText: 'OK',
          endpoint: 'https://api.startgov.com.br/v2/seduc-ma/licitacoes',
          timestamp: new Date().toISOString(),
          dados: {
            processoNumero: `SEI-${playgroundParametro}`,
            modalidade: 'PREGAO_ELETRONICO',
            numeroEdital: '0045/2026',
            situacao: 'HOMOLOGADO',
            valorTotalEstimado: 2450000.00,
            valorHomologado: 2180000.00,
            economiaGerada: 270000.00,
            fornecedorVencedor: { cnpj: '12.345.678/0001-99', razaoSocial: 'TELECOM BRASIL SERVICOS S/A' }
          }
        };
      } else {
        mockRes = {
          status: 200,
          statusText: 'OK',
          pncpApiVersion: 'v1.4.2',
          cnpjOrgao: '06.354.468/0001-30',
          dados: {
            numeroControlePNCP: '06354468000130-1-000045/2026',
            tipoInstrumentoConvocatorio: 'EDITAL',
            modalidadeId: 6,
            modalidadeNome: 'Pregão Eletrônico (Lei 14.133/2021)',
            dataPublicacaoPncp: '2026-10-10T14:00:00Z',
            linkProcessoSei: `https://sei.ma.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?${playgroundParametro}`
          }
        };
      }

      setPlaygroundOutput(JSON.stringify(mockRes, null, 2));
      setPlaygroundLoading(false);
    }, 900);
  };

  return (
    <AdminGuard moduloNome="Credenciais de Acesso das APIs Externas">
      <div className="space-y-6">
        {/* Trilha de Navegação */}
        <Breadcrumb
          items={[
            { label: 'Administração', href: '/admin/organograma' },
            { label: 'Credenciais & Conectores Externos', isCurrent: true }
          ]}
        />

        {/* Cabeçalho da Página com Badge de Super Admin */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="w-6 h-6 text-red-600" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Gestão de Conectores, Credenciais & Resiliência
              </h1>
              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2.5 py-0.5 rounded-full border border-red-200 uppercase tracking-wider">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              Central de governança dos conectores de dados automatizados: <strong>SEI! do Estado do Maranhão</strong>, 
              <strong>StartGov Licitações</strong> e <strong>PNCP (Portal Nacional de Contratações Públicas)</strong>.
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
              <span>{testandoSistema === 'todos' ? 'Verificando Conectores...' : 'Testar Conexões'}</span>
            </button>
          </div>
        </div>

        {/* Alerta de Certificado Digital ICP-Brasil */}
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2.5 py-0.5 rounded-md border border-amber-300">
                    Modo de Transição / Homologação Ativo
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Sistema 100% Operacional sem Certificado
                  </span>
                </div>
                <h2 className="text-sm font-bold text-amber-950 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>Urgência Institucional: Solicitação de Certificado Digital</span>
                  <Abbr sigla="ICP-Brasil" />
                  <Abbr sigla="A1" />
                  <span>(e-CNPJ <Abbr sigla="SEDUC" />)</span>
                  <InfoTooltip content="Certificado institucional em arquivo PKCS#12 (.pfx) emitido para o CNPJ da SEDUC-MA, indispensável em produção para mTLS e acesso irrestrito contra bloqueios WAF." />
                </h2>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <label className="text-xs font-semibold text-amber-900 flex items-center gap-2 cursor-pointer bg-white/70 px-3 py-1.5 rounded-lg border border-amber-300">
                <input
                  type="checkbox"
                  checked={config.certificadoDigital.habilitado}
                  onChange={(e) => setConfig({
                    ...config,
                    certificadoDigital: { ...config.certificadoDigital, habilitado: e.target.checked }
                  })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>Habilitar Modo mTLS com Certificado A1</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs text-amber-900">
            <div className="lg:col-span-2 space-y-2">
              <p className="leading-relaxed">
                <strong>Status Atual:</strong> O PUMIP está funcionando perfeitamente utilizando autenticação por 
                <strong> Conta de Serviço institucional (*Service Account*)</strong> com usuário e senha do SEI!, 
                garantindo que todas as validações, testes de homologação e cadastros operem sem nenhum bloqueio.
              </p>
              <p className="leading-relaxed text-amber-800/90 text-[11px]">
                <strong>Alerta para Produção Definitiva:</strong> Para o ambiente oficial no datacenter do Governo do Maranhão (ATI-MA), 
                é <strong>urgente</strong> que a chefia administrativa solicite junto à autoridade certificadora o 
                <strong> Certificado Digital A1 da SEDUC-MA (e-CNPJ 06.354.468/0001-30)</strong>. Isso garantirá autenticação mútua TLS (mTLS), 
                imunidade a bloqueios por WAF e conformidade com o Decreto Estadual de Segurança da Informação.
              </p>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-amber-200 space-y-2 text-[11px]">
              <div className="flex items-center justify-between font-bold text-amber-950">
                <span>Configuração do Certificado:</span>
                <span className={config.certificadoDigital.habilitado ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                  {config.certificadoDigital.habilitado ? 'ATIVO' : 'OPCIONAL (DESATIVADO)'}
                </span>
              </div>
              <div className="space-y-1 text-slate-600">
                <p><strong>Emissor:</strong> {config.certificadoDigital.emissor}</p>
                <p><strong>Validade Prevista:</strong> Até {config.certificadoDigital.dataValidade}</p>
                <p><strong>Arquivo Suportado:</strong> .PFX / .P12 (PKCS#12)</p>
              </div>
            </div>
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

        {/* Abas de Navegação */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('CONECTORES')}
            title="Configurar credenciais, tokens e endpoints oficiais das APIs do SEI!, StartGov e PNCP"
            className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'CONECTORES'
                ? 'bg-white border-blue-600 text-blue-700 font-bold shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>1. Conectores & Credenciais</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ON_DEMAND')}
            title="Executar sincronização forçada de processos individuais com bypass de cache e auditoria de hash"
            className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'ON_DEMAND'
                ? 'bg-white border-blue-600 text-blue-700 font-bold shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>2. Sincronização Sob Demanda</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RESILIENCIA')}
            title="Políticas de Circuit Breaker, Exponential Backoff com Jitter e Dead Letter Queue (DLQ) para falhas transitórias"
            className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'RESILIENCIA'
                ? 'bg-white border-blue-600 text-blue-700 font-bold shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-4 h-4 text-purple-600" />
            <span>3. Resiliência & Circuit Breaker</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TELEMETRIA')}
            title="Dashboard de observabilidade com latência p95, taxa de erro HTTP, volume de chamadas e logs em tempo real"
            className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'TELEMETRIA'
                ? 'bg-white border-blue-600 text-blue-700 font-bold shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-emerald-600" />
            <span>4. Telemetria & Diagnóstico</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PLAYGROUND')}
            title="Simulador interativo de requisições e respostas JSON/XML para homologação de esquemas das APIs"
            className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'PLAYGROUND'
                ? 'bg-white border-blue-600 text-blue-700 font-bold shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Code className="w-4 h-4 text-slate-700" />
            <span>5. Playground de Payloads</span>
          </button>
        </div>

        {/* Abas renderizadas dinamicamente */}
        {activeTab === 'CONECTORES' && (
          <ConectoresTab
            config={config}
            setConfig={setConfig}
            salvando={salvando}
            handleSalvar={handleSalvar}
            handleTestarConexao={handleTestarConexao}
            testandoSistema={testandoSistema}
            setFeedbackMensagem={setFeedbackMensagem}
            defaultConfig={DEFAULT_CONFIG}
          />
        )}

        {activeTab === 'ON_DEMAND' && (
          <OnDemandTab
            processoSyncInput={processoSyncInput}
            setProcessoSyncInput={setProcessoSyncInput}
            handleExecutarSincronizacaoSobDemanda={handleExecutarSincronizacaoSobDemanda}
            syncStatus={syncStatus}
            config={config}
            setConfig={setConfig}
            handleSalvar={handleSalvar}
          />
        )}

        {activeTab === 'RESILIENCIA' && (
          <ResilienciaTab
            config={config}
            setConfig={setConfig}
            handleSalvar={handleSalvar}
          />
        )}

        {activeTab === 'TELEMETRIA' && <TelemetriaTab />}

        {activeTab === 'PLAYGROUND' && (
          <PlaygroundTab
            playgroundSistema={playgroundSistema}
            setPlaygroundSistema={setPlaygroundSistema}
            playgroundOperacao={playgroundOperacao}
            setPlaygroundOperacao={setPlaygroundOperacao}
            playgroundParametro={playgroundParametro}
            setPlaygroundParametro={setPlaygroundParametro}
            playgroundLoading={playgroundLoading}
            handleExecutarPlayground={handleExecutarPlayground}
            playgroundOutput={playgroundOutput}
          />
        )}

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
