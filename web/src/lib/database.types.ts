/**
 * PUMIP-SEDUC: Tipos Tipados do Banco de Dados PostgreSQL / Supabase
 * Gerados para alinhamento estrito entre esquema SQL e código TypeScript (Etapa 3.1).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      unidades_organizacionais: {
        Row: {
          id: string;
          nome: string;
          sigla: string;
          tipo: 'SECRETARIA' | 'SUBSECRETARIA' | 'SECRETARIA_ADJUNTA' | 'SUPERINTENDENCIA' | 'SUPERVISAO' | 'ASSESSORIA' | 'COMISSAO' | 'SETOR';
          parent_id: string | null;
          caminho_hierarquico: string;
          titular_nome: string | null;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          sigla: string;
          tipo: 'SECRETARIA' | 'SUBSECRETARIA' | 'SECRETARIA_ADJUNTA' | 'SUPERINTENDENCIA' | 'SUPERVISAO' | 'ASSESSORIA' | 'COMISSAO' | 'SETOR';
          parent_id?: string | null;
          caminho_hierarquico: string;
          titular_nome?: string | null;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          sigla?: string;
          tipo?: 'SECRETARIA' | 'SUBSECRETARIA' | 'SECRETARIA_ADJUNTA' | 'SUPERINTENDENCIA' | 'SUPERVISAO' | 'ASSESSORIA' | 'COMISSAO' | 'SETOR';
          parent_id?: string | null;
          caminho_hierarquico?: string;
          titular_nome?: string | null;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      perfis_usuarios: {
        Row: {
          id: string;
          nome: string;
          email: string;
          role: 'SECRETARIO' | 'SUBSECRETARIO' | 'SECRETARIO_ADJUNTO' | 'SUPERINTENDENTE' | 'SUPERVISOR' | 'ASSESSOR' | 'TECNICO' | 'ADMIN' | 'AUDITOR';
          unidade_id: string;
          cargo_titulo: string | null;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nome: string;
          email: string;
          role?: 'SECRETARIO' | 'SUBSECRETARIO' | 'SECRETARIO_ADJUNTO' | 'SUPERINTENDENTE' | 'SUPERVISOR' | 'ASSESSOR' | 'TECNICO' | 'ADMIN' | 'AUDITOR';
          unidade_id: string;
          cargo_titulo?: string | null;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          role?: 'SECRETARIO' | 'SUBSECRETARIO' | 'SECRETARIO_ADJUNTO' | 'SUPERINTENDENTE' | 'SUPERVISOR' | 'ASSESSOR' | 'TECNICO' | 'ADMIN' | 'AUDITOR';
          unidade_id?: string;
          cargo_titulo?: string | null;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      processos: {
        Row: {
          id: string;
          protocolo_sei: string;
          protocolo_startgov: string | null;
          numero_contrato_pncp: string | null;
          objeto: string;
          unidade_origem_id: string;
          unidade_atual_sei: string;
          fase_atual_startgov: string | null;
          status_etapa: 'FASE_INTERNA_SEI' | 'INSTRUCAO_TR' | 'ANALISE_JURIDICA' | 'FASE_EXTERNA_LICITACAO' | 'CONTRATO_EXECUCAO' | 'CONCLUIDO';
          prioridade: 'QUENTE' | 'MORNO' | 'FRIO';
          dias_parado_na_unidade: number;
          hash_ultimo_estado: string | null;
          ultima_movimentacao_em: string;
          ultima_verificacao_em: string | null;
          proxima_verificacao_em: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          protocolo_sei: string;
          protocolo_startgov?: string | null;
          numero_contrato_pncp?: string | null;
          objeto: string;
          unidade_origem_id: string;
          unidade_atual_sei: string;
          fase_atual_startgov?: string | null;
          status_etapa?: 'FASE_INTERNA_SEI' | 'INSTRUCAO_TR' | 'ANALISE_JURIDICA' | 'FASE_EXTERNA_LICITACAO' | 'CONTRATO_EXECUCAO' | 'CONCLUIDO';
          prioridade?: 'QUENTE' | 'MORNO' | 'FRIO';
          dias_parado_na_unidade?: number;
          hash_ultimo_estado?: string | null;
          ultima_movimentacao_em?: string;
          ultima_verificacao_em?: string | null;
          proxima_verificacao_em?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          protocolo_sei?: string;
          protocolo_startgov?: string | null;
          numero_contrato_pncp?: string | null;
          objeto?: string;
          unidade_origem_id?: string;
          unidade_atual_sei?: string;
          fase_atual_startgov?: string | null;
          status_etapa?: 'FASE_INTERNA_SEI' | 'INSTRUCAO_TR' | 'ANALISE_JURIDICA' | 'FASE_EXTERNA_LICITACAO' | 'CONTRATO_EXECUCAO' | 'CONCLUIDO';
          prioridade?: 'QUENTE' | 'MORNO' | 'FRIO';
          dias_parado_na_unidade?: number;
          hash_ultimo_estado?: string | null;
          ultima_movimentacao_em?: string;
          ultima_verificacao_em?: string | null;
          proxima_verificacao_em?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      historico_tramitacoes: {
        Row: {
          id: string;
          processo_id: string;
          origem_sistema: 'SEI' | 'STARTGOV' | 'PNCP';
          data_hora_evento: string;
          unidade_setor: string;
          descricao_andamento: string;
          documento_anexado: string | null;
          tipo_documento: string | null;
          resumo_ia: string | null;
          hash_evento: string;
          metadados: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          processo_id: string;
          origem_sistema: 'SEI' | 'STARTGOV' | 'PNCP';
          data_hora_evento: string;
          unidade_setor: string;
          descricao_andamento: string;
          documento_anexado?: string | null;
          tipo_documento?: string | null;
          resumo_ia?: string | null;
          hash_evento: string;
          metadados?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          processo_id?: string;
          origem_sistema?: 'SEI' | 'STARTGOV' | 'PNCP';
          data_hora_evento?: string;
          unidade_setor?: string;
          descricao_andamento?: string;
          documento_anexado?: string | null;
          tipo_documento?: string | null;
          resumo_ia?: string | null;
          hash_evento?: string;
          metadados?: Json;
          created_at?: string;
        };
      };
      alertas_configurados: {
        Row: {
          id: string;
          usuario_id: string;
          processo_id: string | null;
          unidade_id: string | null;
          tipo: 'INERCIA_SLA' | 'PALAVRA_CHAVE' | 'VENCIMENTO_CONTRATO' | 'PUBLICACAO_PNCP';
          parametros: Json;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          processo_id?: string | null;
          unidade_id?: string | null;
          tipo: 'INERCIA_SLA' | 'PALAVRA_CHAVE' | 'VENCIMENTO_CONTRATO' | 'PUBLICACAO_PNCP';
          parametros?: Json;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string;
          processo_id?: string | null;
          unidade_id?: string | null;
          tipo?: 'INERCIA_SLA' | 'PALAVRA_CHAVE' | 'VENCIMENTO_CONTRATO' | 'PUBLICACAO_PNCP';
          parametros?: Json;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      notas_internas: {
        Row: {
          id: string;
          processo_id: string;
          autor_id: string;
          autor_nome: string;
          autor_cargo: string | null;
          texto: string;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          processo_id: string;
          autor_id: string;
          autor_nome: string;
          autor_cargo?: string | null;
          texto: string;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          processo_id?: string;
          autor_id?: string;
          autor_nome?: string;
          autor_cargo?: string | null;
          texto?: string;
          criado_em?: string;
          atualizado_em?: string;
        };
      };
      feriados: {
        Row: {
          data: string;
          descricao: string;
          abrangencia: 'NACIONAL' | 'ESTADUAL' | 'MUNICIPAL';
        };
        Insert: {
          data: string;
          descricao: string;
          abrangencia: 'NACIONAL' | 'ESTADUAL' | 'MUNICIPAL';
        };
        Update: {
          data?: string;
          descricao?: string;
          abrangencia?: 'NACIONAL' | 'ESTADUAL' | 'MUNICIPAL';
        };
      };
      configuracoes_integracao: {
        Row: {
          chave: string;
          valor: Json;
          updated_at: string;
        };
        Insert: {
          chave: string;
          valor: Json;
          updated_at?: string;
        };
        Update: {
          chave?: string;
          valor?: Json;
          updated_at?: string;
        };
      };
    };
    Views: {
      processos_com_inercia: {
        Row: Database['public']['Tables']['processos']['Row'] & {
          dias_uteis_parado: number;
        };
      };
      status_integracoes: {
        Row: {
          sistema: 'SEI' | 'STARTGOV' | 'PNCP';
          ultimo_status: string;
          falhas_consecutivas: number;
          ultima_tentativa_em: string;
          ultimo_sucesso_em: string | null;
        };
      };
    };
    Functions: {
      dias_uteis_entre: {
        Args: { inicio: string; fim: string };
        Returns: number;
      };
      usuario_pode_ver_processo: {
        Args: { p_usuario: string; p_processo: string };
        Returns: boolean;
      };
      registrar_andamento_sincronizacao: {
        Args: {
          p_processo_id: string;
          p_origem: 'SEI' | 'STARTGOV' | 'PNCP';
          p_data_hora_evento: string;
          p_unidade_setor: string;
          p_descricao_andamento: string;
          p_documento_anexado: string | null;
          p_tipo_documento: string | null;
          p_resumo_ia: string | null;
          p_hash_evento: string;
          p_metadados: Json;
          p_nova_unidade_sei: string | null;
          p_proxima_verificacao: string;
        };
        Returns: boolean;
      };
    };
  };
}
