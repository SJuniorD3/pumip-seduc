import { Processo, HistoricoTramitacao, UnidadeOrganizacional } from './types';

export const mockUnidades: UnidadeOrganizacional[] = [
  { 
    id: '1', 
    nome: 'Secretaria de Estado da Educação do Maranhão', 
    sigla: 'SEDUC', 
    tipo: 'SECRETARIA', 
    caminho_hierarquico: 'SEDUC',
    titular_nome: 'Jandira Dias Araújo Silva'
  },
  { 
    id: '2', 
    nome: 'Subsecretaria de Educação', 
    sigla: 'SUBSEDUC', 
    tipo: 'SUBSECRETARIA', 
    parent_id: '1', 
    caminho_hierarquico: 'SEDUC.SUBSEDUC',
    titular_nome: 'José Antônio Barros Heluy'
  },
  { 
    id: '3', 
    nome: 'Secretaria Adjunta de Administração', 
    sigla: 'SAAD', 
    tipo: 'SECRETARIA_ADJUNTA', 
    parent_id: '1', 
    caminho_hierarquico: 'SEDUC.SAAD',
    titular_nome: 'Luzivete Botelho da Silva Rodrigues'
  },
  { 
    id: '4', 
    nome: 'Secretaria Adjunta de Orçamento, Finanças e Contabilidade', 
    sigla: 'SAOFC', 
    tipo: 'SECRETARIA_ADJUNTA', 
    parent_id: '1', 
    caminho_hierarquico: 'SEDUC.SAOFC',
    titular_nome: 'Igor de Souza Carneiro da Costa'
  },
  { 
    id: '5', 
    nome: 'Superintendência de Tecnologia da Informação', 
    sigla: 'STI', 
    tipo: 'SUPERINTENDENCIA', 
    parent_id: '3', 
    caminho_hierarquico: 'SEDUC.SAAD.STI',
    titular_nome: 'Roberto Max Louzeiro Pimentel'
  },
  { 
    id: '6', 
    nome: 'Supervisão de Desenvolvimento e Manutenção de Sistemas', 
    sigla: 'SUDES', 
    tipo: 'SUPERVISAO', 
    parent_id: '5', 
    caminho_hierarquico: 'SEDUC.SAAD.STI.SUDES',
    titular_nome: 'Sérvulo José Freire Junior'
  },
  { 
    id: '7', 
    nome: 'Supervisão de Redes', 
    sigla: 'SUPREDES', 
    tipo: 'SUPERVISAO', 
    parent_id: '5', 
    caminho_hierarquico: 'SEDUC.SAAD.STI.SUPREDES',
    titular_nome: 'Marcos Camilo Freitas'
  },
  { 
    id: '8', 
    nome: 'Supervisão de Gerenciamento de Chamados', 
    sigla: 'SUGEC', 
    tipo: 'SUPERVISAO', 
    parent_id: '5', 
    caminho_hierarquico: 'SEDUC.SAAD.STI.SUGEC',
    titular_nome: 'Daniela Etsuko Miwa Ramos'
  },
  { 
    id: '9', 
    nome: 'Superintendência de Infraestrutura', 
    sigla: 'SUINFRA', 
    tipo: 'SUPERINTENDENCIA', 
    parent_id: '3', 
    caminho_hierarquico: 'SEDUC.SAAD.SUINFRA',
    titular_nome: 'Núbia Cristina Furtado Theodoro'
  },
  { 
    id: '10', 
    nome: 'Comissão Setorial de Licitação', 
    sigla: 'CSL', 
    tipo: 'COMISSAO', 
    parent_id: '1', 
    caminho_hierarquico: 'SEDUC.CSL',
    titular_nome: 'Igor Manuel Sousa Rocha'
  },
  { 
    id: '11', 
    nome: 'Assessoria Jurídica', 
    sigla: 'ASJUR', 
    tipo: 'ASSESSORIA', 
    parent_id: '1', 
    caminho_hierarquico: 'SEDUC.ASJUR',
    titular_nome: 'Valter Pereira Veras Neto'
  },
  { 
    id: '12', 
    nome: 'Assessoria de Planejamento e Ações Estratégicas', 
    sigla: 'ASPLAN', 
    tipo: 'ASSESSORIA', 
    parent_id: '1', 
    caminho_hierarquico: 'SEDUC.ASPLAN',
    titular_nome: 'Fabiane Cristine Froz Sousa'
  }
];

export const mockProcessos: Processo[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    protocolo_sei: 'SEI-021001/004521/2026',
    protocolo_startgov: 'STARTGOV-2026/0892',
    numero_contrato_pncp: '12345678000199-1-000045/2026',
    objeto: 'Aquisição de Switches Gerenciáveis e Roteadores para Expansão da Conectividade nas Escolas Estaduais',
    unidade_origem_id: '6',
    unidade_origem: mockUnidades[5], // SUDES (Sérvulo José Freire Junior)
    unidade_atual_sei: 'CSL',
    fase_atual_startgov: 'Fase de Lances / Pregão Eletrônico',
    status_etapa: 'FASE_EXTERNA_LICITACAO',
    prioridade: 'QUENTE',
    dias_parado_na_unidade: 2,
    proximo_passo_esperado: 'Julgamento das propostas e adjudicação do certame na CSL',
    tem_novidade_hoje: true,
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
    objeto: 'Contratação de Serviços Especializados de Nuvem Governamental e Banco de Dados Supabase/PostgreSQL',
    unidade_origem_id: '6',
    unidade_origem: mockUnidades[5], // SUDES (Sérvulo José Freire Junior)
    unidade_atual_sei: 'ASJUR',
    fase_atual_startgov: 'Elaboração de Parecer Jurídico Conclusivo do Art. 53',
    status_etapa: 'ANALISE_JURIDICA',
    prioridade: 'QUENTE',
    dias_parado_na_unidade: 8, // Alerta SLA estourado (> 5 dias)
    proximo_passo_esperado: 'Emissão do Parecer Jurídico conclusivo do Art. 53 pela ASJUR',
    tem_novidade_hoje: true,
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
    objeto: 'Elaboração de ETP e Termo de Referência para Reforma e Modernização das Escolas DIGNAS do Polo Munin',
    unidade_origem_id: '9',
    unidade_origem: mockUnidades[8], // SUINFRA
    unidade_atual_sei: 'SUINFRA',
    fase_atual_startgov: null,
    status_etapa: 'FASE_INTERNA_SEI',
    prioridade: 'MORNO',
    dias_parado_na_unidade: 18, // Inércia alta
    proximo_passo_esperado: 'Finalização da planilha orçamentária e remessa do TR à CSL',
    tem_novidade_hoje: false,
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
    objeto: 'Registro de Preços para Fornecimento Contínuo de Merenda Escolar e Gêneros Alimentícios para a Rede Estadual',
    unidade_origem_id: '3',
    unidade_origem: mockUnidades[2], // SAAD
    unidade_atual_sei: 'SAAD',
    fase_atual_startgov: 'Contrato Vigente / Publicado no PNCP',
    status_etapa: 'CONTRATO_EXECUCAO',
    prioridade: 'FRIO',
    dias_parado_na_unidade: 1,
    proximo_passo_esperado: 'Emissão de Ordem de Fornecimento e monitoramento de entregas nas escolas',
    tem_novidade_hoje: false,
    hash_ultimo_estado: 'hash_mock_004_jkl012',
    ultima_movimentacao_em: '2026-10-14T10:00:00Z',
    ultima_verificacao_em: '2026-10-15T00:00:00Z',
    proxima_verificacao_em: '2026-10-18T00:00:00Z',
    created_at: '2026-08-01T09:00:00Z',
    updated_at: '2026-10-14T10:00:00Z'
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    protocolo_sei: 'SEI-021001/003420/2026',
    protocolo_startgov: 'STARTGOV-2026/0410',
    numero_contrato_pncp: null,
    objeto: 'Aquisição de Mobiliário e Carteiras Escolares Ergonômicas para Centros de Ensino Médio Integral',
    unidade_origem_id: '1',
    unidade_origem: mockUnidades[0], // SEDUC
    unidade_atual_sei: 'CSL',
    fase_atual_startgov: 'Sessão Pública de Lances Agendada',
    status_etapa: 'FASE_EXTERNA_LICITACAO',
    prioridade: 'QUENTE',
    dias_parado_na_unidade: 4,
    proximo_passo_esperado: 'Abertura da sessão de lances eletrônicos pelo Pregoeiro',
    tem_novidade_hoje: true,
    hash_ultimo_estado: 'hash_mock_005_mno345',
    ultima_movimentacao_em: '2026-10-16T11:00:00Z',
    ultima_verificacao_em: '2026-10-17T06:00:00Z',
    proxima_verificacao_em: '2026-10-17T12:00:00Z',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-10-16T11:00:00Z'
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    protocolo_sei: 'SEI-021001/008855/2026',
    protocolo_startgov: 'STARTGOV-2026/0921',
    numero_contrato_pncp: null,
    objeto: 'Contratação de Serviço Contínuo de Transporte Escolar Fluvial e Terrestre para Região dos Lençóis Maranhenses',
    unidade_origem_id: '3',
    unidade_origem: mockUnidades[2], // SAAD
    unidade_atual_sei: 'ASJUR',
    fase_atual_startgov: 'Parecer Jurídico sobre Minuta do Edital',
    status_etapa: 'ANALISE_JURIDICA',
    prioridade: 'QUENTE',
    dias_parado_na_unidade: 12, // Inércia crítica
    proximo_passo_esperado: 'Emissão de Parecer conclusivo pela ASJUR para saneamento do TR',
    tem_novidade_hoje: false,
    hash_ultimo_estado: 'hash_mock_006_pqr678',
    ultima_movimentacao_em: '2026-10-02T14:30:00Z',
    ultima_verificacao_em: '2026-10-17T06:00:00Z',
    proxima_verificacao_em: '2026-10-17T12:00:00Z',
    created_at: '2026-08-15T08:00:00Z',
    updated_at: '2026-10-02T14:30:00Z'
  },
  {
    id: '10000000-0000-0000-0000-000000000007',
    protocolo_sei: 'SEI-021001/006540/2026',
    protocolo_startgov: null,
    numero_contrato_pncp: null,
    objeto: 'Licenciamento e Manutenção de Plataforma Educacional de Aprendizagem Conectada e Inteligência de Dados',
    unidade_origem_id: '5',
    unidade_origem: mockUnidades[4], // STI
    unidade_atual_sei: 'STI',
    fase_atual_startgov: null,
    status_etapa: 'INSTRUCAO_TR',
    prioridade: 'MORNO',
    dias_parado_na_unidade: 6,
    proximo_passo_esperado: 'Conclusão da pesquisa de preços de mercado pela STI',
    tem_novidade_hoje: true,
    hash_ultimo_estado: 'hash_mock_007_stu901',
    ultima_movimentacao_em: '2026-10-11T16:00:00Z',
    ultima_verificacao_em: '2026-10-17T06:00:00Z',
    proxima_verificacao_em: '2026-10-17T12:00:00Z',
    created_at: '2026-09-18T14:00:00Z',
    updated_at: '2026-10-11T16:00:00Z'
  },
  {
    id: '10000000-0000-0000-0000-000000000008',
    protocolo_sei: 'SEI-021001/002310/2026',
    protocolo_startgov: null,
    numero_contrato_pncp: '12345678000199-2-000044/2026',
    objeto: 'Liquidação e Empenho de Fornecimento de Gás Liquefeito e Insumos para Escolas da Baixada Maranhense',
    unidade_origem_id: '4',
    unidade_origem: mockUnidades[3], // SAOFC
    unidade_atual_sei: 'SAOFC',
    fase_atual_startgov: 'Empenho Emitido / Aguardando Nota Fiscal',
    status_etapa: 'CONTRATO_EXECUCAO',
    prioridade: 'FRIO',
    dias_parado_na_unidade: 3,
    proximo_passo_esperado: 'Conferência de atesto de entrega pelo gestor do contrato',
    tem_novidade_hoje: false,
    hash_ultimo_estado: 'hash_mock_008_vwx234',
    ultima_movimentacao_em: '2026-10-13T09:00:00Z',
    ultima_verificacao_em: '2026-10-17T06:00:00Z',
    proxima_verificacao_em: '2026-10-17T12:00:00Z',
    created_at: '2026-09-05T09:00:00Z',
    updated_at: '2026-10-13T09:00:00Z'
  }
];

export const mockTramitacoes: Record<string, HistoricoTramitacao[]> = {
  '10000000-0000-0000-0000-000000000001': [
    {
      id: 'evt-01',
      processo_id: '10000000-0000-0000-0000-000000000001',
      origem_sistema: 'SEI',
      data_hora_evento: '2026-09-20T10:00:00Z',
      unidade_setor: 'SUDES',
      descricao_andamento: 'Autuação do processo administrativo e emissão do DFD nº 12/2026 por Sérvulo José Freire Junior.',
      documento_anexado: 'DFD-2026-SUDES.pdf',
      tipo_documento: 'Documento de Formalização da Demanda (DFD)',
      resumo_ia: 'Abertura formal da demanda com justificativa técnica e alinhamento estratégico ao PCA 2026.',
      hash_evento: 'hash_evt_01',
      created_at: '2026-09-20T10:05:00Z'
    },
    {
      id: 'evt-02',
      processo_id: '10000000-0000-0000-0000-000000000001',
      origem_sistema: 'SEI',
      data_hora_evento: '2026-09-28T15:30:00Z',
      unidade_setor: 'STI',
      descricao_andamento: 'Aprovação do ETP e Termo de Referência pela Superintendência de TI por Roberto Max Louzeiro Pimentel.',
      documento_anexado: 'TR-Switches-vFinal.pdf',
      tipo_documento: 'Termo de Referência',
      resumo_ia: 'Especificação técnica aprovada para 120 switches gerenciáveis com garantia on-site.',
      hash_evento: 'hash_evt_02',
      created_at: '2026-09-28T15:35:00Z'
    },
    {
      id: 'evt-03',
      processo_id: '10000000-0000-0000-0000-000000000001',
      origem_sistema: 'STARTGOV',
      data_hora_evento: '2026-10-05T11:00:00Z',
      unidade_setor: 'CSL',
      descricao_andamento: 'Importação da demanda no StartGov com geração do certame PE nº 042/2026 por Igor Manuel Sousa Rocha.',
      documento_anexado: 'Edital-PE-042-2026.pdf',
      tipo_documento: 'Edital de Pregão Eletrônico',
      resumo_ia: 'Processo cadastrado no StartGov sob identificador STARTGOV-2026/0892 e abertura de prazos.',
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
      descricao_andamento: 'Sessão pública aberta para disputa de lances entre os fornecedores credenciados.',
      documento_anexado: 'Ata-Lances-Inicial.pdf',
      tipo_documento: 'Ata de Sessão Pública',
      resumo_ia: 'Etapa competitiva de lances em andamento com proposta classificada abaixo do valor orçado.',
      hash_evento: 'hash_evt_05',
      created_at: '2026-10-13T14:25:00Z'
    }
  ]
};
