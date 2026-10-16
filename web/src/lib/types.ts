export type TipoUnidade = 
  | 'SECRETARIA'
  | 'SUBSECRETARIA'
  | 'SECRETARIA_ADJUNTA'
  | 'SUPERINTENDENCIA'
  | 'SUPERVISAO'
  | 'ASSESSORIA'
  | 'COMISSAO'
  | 'REGIONAL'
  | 'SETOR';

export type UserRole = 
  | 'ADMIN'
  | 'SECRETARIO'
  | 'SUBSECRETARIO'
  | 'SECRETARIO_ADJUNTO'
  | 'SUPERINTENDENTE'
  | 'SUPERVISOR'
  | 'ASSESSOR'
  | 'TECNICO'
  | 'AUDITOR';

export type ProcessoPrioridade = 'QUENTE' | 'MORNO' | 'FRIO';
export type OrigemSistema = 'SEI' | 'STARTGOV' | 'PNCP';
export type StatusEtapaProcessual = 
  | 'FASE_INTERNA_SEI'
  | 'INSTRUCAO_TR'
  | 'ANALISE_JURIDICA'
  | 'FASE_EXTERNA_LICITACAO'
  | 'CONTRATO_EXECUCAO'
  | 'CONCLUIDO';

export interface UnidadeOrganizacional {
  id: string;
  nome: string;
  sigla: string;
  tipo: TipoUnidade;
  parent_id?: string | null;
  caminho_hierarquico: string;
  titular_nome?: string | null;
}

export interface PerfilUsuario {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  unidade_id: string;
  cargo_titulo?: string;
  unidade?: UnidadeOrganizacional;
}

export interface Processo {
  id: string;
  protocolo_sei: string;
  protocolo_startgov?: string | null;
  numero_contrato_pncp?: string | null;
  objeto: string;
  unidade_origem_id: string;
  unidade_origem?: UnidadeOrganizacional;
  unidade_atual_sei: string;
  fase_atual_startgov?: string | null;
  status_etapa: StatusEtapaProcessual;
  prioridade: ProcessoPrioridade;
  dias_parado_na_unidade: number;
  hash_ultimo_estado?: string | null;
  proximo_passo_esperado?: string | null;
  tem_novidade_hoje?: boolean;
  ultima_movimentacao_em: string;
  ultima_verificacao_em?: string | null;
  proxima_verificacao_em: string;
  created_at: string;
  updated_at: string;
}

export interface HistoricoTramitacao {
  id: string;
  processo_id: string;
  origem_sistema: OrigemSistema;
  data_hora_evento: string;
  unidade_setor: string;
  descricao_andamento: string;
  documento_anexado?: string | null;
  tipo_documento?: string | null;
  resumo_ia?: string | null;
  hash_evento: string;
  metadados?: Record<string, any>;
  created_at: string;
}

export interface AlertaConfigurado {
  id: string;
  usuario_id: string;
  processo_id?: string | null;
  unidade_id?: string | null;
  tipo: 'MUDANCA_SETOR_FASE' | 'PALAVRA_CHAVE' | 'INERCIA_SLA' | 'VENCIMENTO_CONTRATO' | 'PUBLICACAO_PNCP';
  parametros: Record<string, any>;
  notificar_email: boolean;
  notificar_sistema: boolean;
  ativo: boolean;
  created_at: string;
}

export interface NotificacaoLog {
  id: string;
  usuario_id: string;
  processo_id: string;
  alerta_id?: string | null;
  titulo: string;
  mensagem: string;
  enviado_email: boolean;
  lida: boolean;
  lida_em?: string | null;
  created_at: string;
}
