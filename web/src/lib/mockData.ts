import { Processo, HistoricoTramitacao, UnidadeOrganizacional } from './types';

export const mockUnidades: UnidadeOrganizacional[] = [
  { id: '1', nome: 'Secretaria de Estado da Educação do Maranhão', sigla: 'SEDUC', tipo: 'SECRETARIA', caminho_hierarquico: 'SEDUC' },
  { id: '2', nome: 'Superintendência de Tecnologia da Informação', sigla: 'SUPTI', tipo: 'SUPERINTENDENCIA', parent_id: '1', caminho_hierarquico: 'SEDUC.SUPTI' },
  { id: '3', nome: 'Superintendência de Administração', sigla: 'SUPADM', tipo: 'SUPERINTENDENCIA', parent_id: '1', caminho_hierarquico: 'SEDUC.SUPADM' },
  { id: '4', nome: 'Supervisão de Desenvolvimento e Sistemas', sigla: 'SUPDEV', tipo: 'SUPERVISAO', parent_id: '2', caminho_hierarquico: 'SEDUC.SUPTI.SUPDEV' },
  { id: '5', nome: 'Supervisão de Infraestrutura e Redes', sigla: 'SUPINFRA', tipo: 'SUPERVISAO', parent_id: '2', caminho_hierarquico: 'SEDUC.SUPTI.SUPINFRA' },
  { id: '6', nome: 'Comissão Setorial de Licitação', sigla: 'CSL', tipo: 'SETOR', parent_id: '3', caminho_hierarquico: 'SEDUC.SUPADM.CSL' },
  { id: '7', nome: 'Assessoria Jurídica da SEDUC', sigla: 'ASJUR', tipo: 'SETOR', parent_id: '1', caminho_hierarquico: 'SEDUC.ASJUR' },
];

export const mockProcessos: Processo[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    protocolo_sei: 'SEI-021001/004521/2026',
    protocolo_startgov: 'STARTGOV-2026/0892',
    numero_contrato_pncp: '12345678000199-1-000045/2026',
    objeto: 'Aquisição de Switches Gerenciáveis e Roteadores para Expansão da Rede Escolar Digital',
    unidade_origem_id: '4',
    unidade_origem: mockUnidades[3],
    unidade_atual_sei: 'CSL',
    fase_atual_startgov: 'Fase de Lances / Pregão Eletrônico',
    status_etapa: 'FASE_EXTERNA_LICITACAO',
    prioridade: 'QUENTE',
    dias_parado_na_unidade: 2,
    hash_ultimo_estado: 'hash_mock_001_abc123',
    ultima_movimentacao_em: '2026-10-13T14:20:00Z',
    ultima_verificacao_em: '2026-10-15T13:00:00Z',
    proxima_verificacao_em: '2026-10-15T14:00:00Z',
    created_at: '2026-09-20T10:00:00Z',
    updated_at: '2026-10-15T13:00:00Z'
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    protocolo_sei: 'SEI-021001/007812/2026',
    protocolo_startgov: 'STARTGOV-2026/1045',
    numero_contrato_pncp: null,
    objeto: 'Contratação de Serviços Especializados de Nuvem Governamental e Banco de Dados Supabase',
    unidade_origem_id: '4',
    unidade_origem: mockUnidades[3],
    unidade_atual_sei: 'ASJUR',
    fase_atual_startgov: 'Elaboração de Parecer Jurídico Conclusivo',
    status_etapa: 'ANALISE_JURIDICA',
    prioridade: 'QUENTE',
    dias_parado_na_unidade: 8, // Alerta SLA estourado (> 5 dias)
    hash_ultimo_estado: 'hash_mock_002_def456',
    ultima_movimentacao_em: '2026-10-07T09:15:00Z',
    ultima_verificacao_em: '2026-10-15T12:00:00Z',
    proxima_verificacao_em: '2026-10-15T13:00:00Z',
    created_at: '2026-09-25T11:30:00Z',
    updated_at: '2026-10-15T12:00:00Z'
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    protocolo_sei: 'SEI-021001/001190/2026',
    protocolo_startgov: null,
    numero_contrato_pncp: null,
    objeto: 'Elaboração de ETP e Termo de Referência para Reforma e Modernização das Escolas DIGNAS',
    unidade_origem_id: '2',
    unidade_origem: mockUnidades[1],
    unidade_atual_sei: 'SUPTI',
    fase_atual_startgov: null,
    status_etapa: 'FASE_INTERNA_SEI',
    prioridade: 'MORNO',
    dias_parado_na_unidade: 18, // Inércia alta
    hash_ultimo_estado: 'hash_mock_003_ghi789',
    ultima_movimentacao_em: '2026-09-27T16:45:00Z',
    ultima_verificacao_em: '2026-10-15T08:00:00Z',
    proxima_verificacao_em: '2026-10-15T20:00:00Z',
    created_at: '2026-09-10T08:00:00Z',
    updated_at: '2026-10-15T08:00:00Z'
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    protocolo_sei: 'SEI-021001/009940/2026',
    protocolo_startgov: 'STARTGOV-2026/0612',
    numero_contrato_pncp: '12345678000199-2-000011/2026',
    objeto: 'Registro de Preços para Fornecimento Contínuo de Merenda Escolar e Gêneros Alimentícios',
    unidade_origem_id: '3',
    unidade_origem: mockUnidades[2],
    unidade_atual_sei: 'SUPADM',
    fase_atual_startgov: 'Contrato Vigente / Publicado no PNCP',
    status_etapa: 'CONTRATO_EXECUCAO',
    prioridade: 'FRIO',
    dias_parado_na_unidade: 1,
    hash_ultimo_estado: 'hash_mock_004_jkl012',
    ultima_movimentacao_em: '2026-10-14T10:00:00Z',
    ultima_verificacao_em: '2026-10-15T00:00:00Z',
    proxima_verificacao_em: '2026-10-18T00:00:00Z',
    created_at: '2026-08-01T09:00:00Z',
    updated_at: '2026-10-14T10:00:00Z'
  }
];

export const mockTramitacoes: Record<string, HistoricoTramitacao[]> = {
  '10000000-0000-0000-0000-000000000001': [
    {
      id: 'evt-01',
      processo_id: '10000000-0000-0000-0000-000000000001',
      origem_sistema: 'SEI',
      data_hora_evento: '2026-09-20T10:00:00Z',
      unidade_setor: 'SUPDEV',
      descricao_andamento: 'Autuação do processo administrativo e emissão do DFD nº 12/2026.',
      documento_anexado: 'DFD-2026-SUPDEV.pdf',
      tipo_documento: 'Documento de Formalização da Demanda (DFD)',
      resumo_ia: 'Abertura formal da demanda com justificativa técnica e alinhamento ao PCA 2026.',
      hash_evento: 'hash_evt_01',
      created_at: '2026-09-20T10:05:00Z'
    },
    {
      id: 'evt-02',
      processo_id: '10000000-0000-0000-0000-000000000001',
      origem_sistema: 'SEI',
      data_hora_evento: '2026-09-28T15:30:00Z',
      unidade_setor: 'SUPTI',
      descricao_andamento: 'Aprovação do Estudo Técnico Preliminar (ETP) e Termo de Referência pela Superintendência.',
      documento_anexado: 'TR-Switches-vFinal.pdf',
      tipo_documento: 'Termo de Referência',
      resumo_ia: 'Especificação técnica aprovada para 120 switches gerenciáveis L2/L3 com garantia on-site de 36 meses.',
      hash_evento: 'hash_evt_02',
      created_at: '2026-09-28T15:35:00Z'
    },
    {
      id: 'evt-03',
      processo_id: '10000000-0000-0000-0000-000000000001',
      origem_sistema: 'STARTGOV',
      data_hora_evento: '2026-10-05T11:00:00Z',
      unidade_setor: 'CSL',
      descricao_andamento: 'Importação da demanda no StartGov com geração do certame PE nº 042/2026 e vinculação automática com SEI.',
      documento_anexado: 'Edital-PE-042-2026.pdf',
      tipo_documento: 'Edital de Pregão Eletrônico',
      resumo_ia: 'Processo cadastrado no StartGov sob identificador STARTGOV-2026/0892 e abertura de prazos para impugnação.',
      hash_evento: 'hash_evt_03',
      created_at: '2026-10-05T11:05:00Z'
    },
    {
      id: 'evt-04',
      processo_id: '10000000-0000-0000-0000-000000000001',
      origem_sistema: 'PNCP',
      data_hora_evento: '2026-10-06T09:00:00Z',
      unidade_setor: 'PNCP-API',
      descricao_andamento: 'Publicação oficial do Edital e aviso de licitação no Portal Nacional de Contratações Públicas.',
      documento_anexado: null,
      tipo_documento: 'Publicação Oficial Art. 54',
      resumo_ia: 'Cumprimento dos prazos de publicidade da Lei 14.133/2021 com registro no PNCP.',
      hash_evento: 'hash_evt_04',
      created_at: '2026-10-06T09:05:00Z'
    },
    {
      id: 'evt-05',
      processo_id: '10000000-0000-0000-0000-000000000001',
      origem_sistema: 'STARTGOV',
      data_hora_evento: '2026-10-13T14:20:00Z',
      unidade_setor: 'CSL',
      descricao_andamento: 'Sessão pública aberta para disputa de lances entre os 8 fornecedores habilitados.',
      documento_anexado: 'Ata-Lances-Inicial.pdf',
      tipo_documento: 'Ata de Sessão Pública',
      resumo_ia: 'Etapa competitiva de lances em andamento com proposta classificada abaixo do valor orçado pelo Estado.',
      hash_evento: 'hash_evt_05',
      created_at: '2026-10-13T14:25:00Z'
    }
  ]
};
