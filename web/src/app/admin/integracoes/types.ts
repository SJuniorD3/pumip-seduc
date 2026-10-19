export interface IntegracaoConfig {
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

export interface AuditLogEntry {
  id: string;
  dataHora: string;
  usuarioNome: string;
  acao: string;
  sistema: 'SEI' | 'STARTGOV' | 'PNCP' | 'GLOBAL' | 'RESILIENCIA';
  ipOrigem: string;
}
