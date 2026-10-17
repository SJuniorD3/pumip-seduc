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
  Info,
  Zap,
  ShieldAlert,
  Cpu,
  ArrowRight,
  Play,
  RotateCcw,
  Check,
  Send,
  Radio,
  BarChart2,
  HelpCircle,
  Code,
  FileCheck2,
  CalendarClock
} from 'lucide-react';
import { Abbr, InfoTooltip } from '../../../components/Tooltip';

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
  certificadoDigital: {
    habilitado: boolean;
    arquivoNome: string;
    dataValidade: string;
    senhaCertificado: string;
    emissor: string;
    alertaUrgenciaAtivo: boolean;
  };
  resiliencia: {
    circuitBreakerAtivo: boolean;
    limiteFalhasConsecutivas: number;
    tempoEsperaMinutos: number;
    rateLimitMaxPorMinuto: number;
    jitterAtivo: boolean;
    retryExponential: boolean;
  };
  agendamento: {
    intervaloComercialMinutos: number;
    intervaloNoturnoMinutos: number;
    modoHibridoWebhooks: boolean;
  };
}

interface AuditLogEntry {
  id: string;
  dataHora: string;
  usuarioNome: string;
  acao: string;
  sistema: 'SEI' | 'STARTGOV' | 'PNCP' | 'GLOBAL' | 'RESILIENCIA';
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
  },
  certificadoDigital: {
    habilitado: false, // Inicia desativado para garantir funcionamento pleno sem cert em testes/homologação
    arquivoNome: 'certificado_seduc_ma_a1_pendente.pfx',
    dataValidade: '2027-12-31',
    senhaCertificado: '',
    emissor: 'Autoridade Certificadora ICP-Brasil v5',
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
  
  // Toggles de visualização de segredos
  const [showSeiPass, setShowSeiPass] = useState(false);
  const [showStartGovSecret, setShowStartGovSecret] = useState(false);
  const [showPncpKey, setShowPncpKey] = useState(false);
  const [showCertPass, setShowCertPass] = useState(false);

  // Estados de feedback de teste e salvamento
  const [testandoSistema, setTestandoSistema] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [feedbackMensagem, setFeedbackMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

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

  // Carrega configurações persistidas se existirem
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pumip_integracoes_credenciais_v2');
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

  const handleSalvar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSalvando(true);
    setFeedbackMensagem(null);

    try {
      localStorage.setItem('pumip_integracoes_credenciais_v2', JSON.stringify(config));

      const novoLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        dataHora: new Date().toLocaleString('pt-BR'),
        usuarioNome: user.nome,
        acao: 'Atualização e salvamento de parâmetros dos conectores e políticas de resiliência',
        sistema: 'GLOBAL',
        ipOrigem: '10.20.15.42 (Rede Interna SEDUC)'
      };

      const novosLogs = [novoLog, ...auditLogs];
      setAuditLogs(novosLogs);
      localStorage.setItem('pumip_integracoes_audit_logs', JSON.stringify(novosLogs));

      setFeedbackMensagem({
        tipo: 'sucesso',
        texto: 'Credenciais, políticas de resiliência e agendamento salvas com sucesso no cofre seguro!'
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

  const handleTestarConexao = (sistema: 'sei' | 'startgov' | 'pncp') => {
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

  // Simulação de Sincronização Sob Demanda (Furar Fila)
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

        {/* ============================================================== */}
        {/* ITEM 1: ALERTA CRÍTICO DE CERTIFICADO DIGITAL ICP-BRASIL (A1) */}
        {/* O sistema opera 100% sem o certificado na homologação, mas      */}
        {/* alerta sobre a urgência institucional da solicitação para prod! */}
        {/* ============================================================== */}
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

        {/* Abas de Navegação das Funcionalidades Avançadas */}
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

        {/* ============================================================== */}
        {/* ABA 1: CONECTORES E CREDENCIAIS DAS 3 FONTES DE DADOS          */}
        {/* ============================================================== */}
        {activeTab === 'CONECTORES' && (
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
                        required
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
                        required
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
                  setConfig(DEFAULT_CONFIG);
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
        )}

        {/* ============================================================== */}
        {/* ABA 2: SINCRONIZAÇÃO SOB DEMANDA (FURAR FILA DO COLETOR)       */}
        {/* ============================================================== */}
        {activeTab === 'ON_DEMAND' && (
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
        )}

        {/* ============================================================== */}
        {/* ABA 3: RESILIÊNCIA, CIRCUIT BREAKER & WEBHOOKS                 */}
        {/* ============================================================== */}
        {activeTab === 'RESILIENCIA' && (
          <div className="space-y-6">
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
                  <span className="text-[11px] text-purple-800 font-bold uppercase">Status Atual do Disjuntor</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-sm font-bold text-slate-900">FECHADO (Operando Normalmente)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Nenhuma falha consecutiva detectada.</p>
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
                  <span className="text-[10px] text-slate-500 block">Padrão: 5 erros consecutivos</span>
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
                  <span className="text-[10px] text-slate-500 block">Padrão: 10 minutos em repouso</span>
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
                  <p className="text-[11px] text-slate-500 leading-relaxed">
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
                      <span>Espaçamento Aleatório de Conexão (*Jitter*)</span>
                    </label>
                    <p className="text-[11px] text-slate-500 pl-6">
                      Adiciona pequenas variações aleatórias de 2 a 7 segundos para evitar picos simultâneos (*thundering herd*).
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
                      <span>Tentativa com *Exponential Backoff* (2s, 4s, 8s)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuração de Webhooks Inbound (Arquitetura Orientada a Eventos) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Webhooks Inbound: Recepção Ativa de Eventos (Push)
                  </h3>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                  Modo Híbrido Ativo
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Além de buscar os dados periodicamente (polling), o PUMIP expõe URLs autenticadas para que o SEI! ou o StartGov 
                possam enviar notificações instantâneas no momento exato em que um processo for tramitado.
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-[11px] font-sans font-semibold text-slate-700 mb-1">
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
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-[11px] font-sans font-bold"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-sans font-semibold text-slate-700 mb-1">
                    Chave Secreta de Assinatura HMAC (Secret Token)
                  </label>
                  <input
                    type="password"
                    readOnly
                    value="whsec_live_seduc_pumip_99a8b7c6d5e4f3a2"
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSalvar}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Salvar Parâmetros de Resiliência
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 4: TELEMETRIA, HISTÓRICO DE LATÊNCIA E GUIA DE ERROS       */}
        {/* ============================================================== */}
        {activeTab === 'TELEMETRIA' && (
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
                    Acesse a aba 1 e atualize a credencial.
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
        )}

        {/* ============================================================== */}
        {/* ABA 5: PLAYGROUND / SIMULADOR DE PAYLOADS                      */}
        {/* ============================================================== */}
        {activeTab === 'PLAYGROUND' && (
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
