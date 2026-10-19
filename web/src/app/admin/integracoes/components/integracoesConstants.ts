import { IntegracaoConfig, AuditLogEntry } from '../types';

export const DEFAULT_CONFIG: IntegracaoConfig = {
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

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
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
