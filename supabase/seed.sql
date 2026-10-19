-- ==============================================================================
-- PUMIP-SEDUC: Dados Fictícios de Demonstração e Homologação (seed.sql)
-- Conformidade Estrita com LGPD / Auditoria Técnica (19/10/2026):
-- - Todos os titulares e servidores utilizam exclusivamente nomes fictícios
-- - Aplicado automaticamente pela Supabase CLI após as migrações (npx supabase db reset)
-- ==============================================================================

-- 1. Nível Central (Secretaria e Subsecretaria)
INSERT INTO public.unidades_organizacionais (id, nome, sigla, tipo, parent_id, caminho_hierarquico, titular_nome)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Secretaria de Estado da Educação do Maranhão', 'SEDUC', 'SECRETARIA', NULL, 'SEDUC', 'Secretário(a) Exemplo 01'),
    ('00000000-0000-0000-0000-000000000002', 'Subsecretaria de Educação', 'SUBSEDUC', 'SUBSECRETARIA', '00000000-0000-0000-0000-000000000001', 'SEDUC.SUBSEDUC', 'Subsecretário(a) Exemplo 02'),
    ('00000000-0000-0000-0000-000000000003', 'Chefia de Gabinete', 'GAB', 'SETOR', '00000000-0000-0000-0000-000000000001', 'SEDUC.GAB', 'Chefe de Gabinete Exemplo 03'),
    ('00000000-0000-0000-0000-000000000004', 'Assessoria Jurídica', 'ASJUR', 'ASSESSORIA', '00000000-0000-0000-0000-000000000001', 'SEDUC.ASJUR', 'Assessor(a) Jurídico Exemplo 04'),
    ('00000000-0000-0000-0000-000000000005', 'Assessoria de Comunicação', 'ASCOM', 'ASSESSORIA', '00000000-0000-0000-0000-000000000001', 'SEDUC.ASCOM', 'Assessor(a) Comunicação Exemplo 05'),
    ('00000000-0000-0000-0000-000000000006', 'Assessoria de Planejamento e Ações Estratégicas', 'ASPLAN', 'ASSESSORIA', '00000000-0000-0000-0000-000000000001', 'SEDUC.ASPLAN', 'Assessor(a) Planejamento Exemplo 06'),
    ('00000000-0000-0000-0000-000000000007', 'Ouvidoria', 'E-OUV', 'SETOR', '00000000-0000-0000-0000-000000000001', 'SEDUC.E-OUV', 'Ouvidor(a) Exemplo 07'),
    ('00000000-0000-0000-0000-000000000008', 'Fundo Estadual de Educação', 'FEE', 'SETOR', '00000000-0000-0000-0000-000000000001', 'SEDUC.FEE', 'Gestor(a) Fundo Exemplo 08'),
    ('00000000-0000-0000-0000-000000000009', 'Comissão Setorial de Licitação', 'CSL', 'COMISSAO', '00000000-0000-0000-0000-000000000001', 'SEDUC.CSL', 'Presidente CSL Exemplo 09'),
    ('00000000-0000-0000-0000-000000000010', 'Comissão Permanente de Tomada de Contas Especial', 'CPTCE', 'COMISSAO', '00000000-0000-0000-0000-000000000001', 'SEDUC.CPTCE', 'Presidente CPTCE Exemplo 10'),
    ('00000000-0000-0000-0000-000000000011', 'Comissão de Processo Administrativo e Disciplinar', 'CPAD', 'COMISSAO', '00000000-0000-0000-0000-000000000001', 'SEDUC.CPAD', 'Presidente CPAD Exemplo 11')
ON CONFLICT (sigla) DO NOTHING;

-- 2. Secretarias Adjuntas
INSERT INTO public.unidades_organizacionais (id, nome, sigla, tipo, parent_id, caminho_hierarquico, titular_nome)
VALUES
    ('00000000-0000-0000-0000-000000000020', 'Secretaria Adjunta de Orçamento, Finanças e Contabilidade', 'SAOFC', 'SECRETARIA_ADJUNTA', '00000000-0000-0000-0000-000000000001', 'SEDUC.SAOFC', 'Secretário(a) Adjunto(a) Exemplo 20'),
    ('00000000-0000-0000-0000-000000000021', 'Secretaria Adjunta de Administração', 'SAAD', 'SECRETARIA_ADJUNTA', '00000000-0000-0000-0000-000000000001', 'SEDUC.SAAD', 'Secretário(a) Adjunto(a) Exemplo 21'),
    ('00000000-0000-0000-0000-000000000022', 'Secretaria Adjunta de Gestão de Pessoas', 'SAGEP', 'SECRETARIA_ADJUNTA', '00000000-0000-0000-0000-000000000001', 'SEDUC.SAGEP', 'Secretário(a) Adjunto(a) Exemplo 22'),
    ('00000000-0000-0000-0000-000000000023', 'Secretaria Adjunta de Gestão da Rede do Ensino e da Aprendizagem', 'SAGEA', 'SECRETARIA_ADJUNTA', '00000000-0000-0000-0000-000000000001', 'SEDUC.SAGEA', 'Secretário(a) Adjunto(a) Exemplo 23'),
    ('00000000-0000-0000-0000-000000000024', 'Secretaria Adjunta de Educação Profissional e Inclusão Social', 'SAEP', 'SECRETARIA_ADJUNTA', '00000000-0000-0000-0000-000000000001', 'SEDUC.SAEP', 'Secretário(a) Adjunto(a) Exemplo 24'),
    ('00000000-0000-0000-0000-000000000025', 'Secretaria Adjunta de Educação dos Povos Indígenas', 'SAPI', 'SECRETARIA_ADJUNTA', '00000000-0000-0000-0000-000000000001', 'SEDUC.SAPI', 'Secretário(a) Adjunto(a) Exemplo 25'),
    ('00000000-0000-0000-0000-000000000026', 'Secretaria Adjunta da Região dos Cocais', 'SARCOC', 'SECRETARIA_ADJUNTA', '00000000-0000-0000-0000-000000000001', 'SEDUC.SARCOC', 'Secretário(a) Adjunto(a) Exemplo 26')
ON CONFLICT (sigla) DO NOTHING;

-- 3. Superintendências de SAAD (Administração)
INSERT INTO public.unidades_organizacionais (id, nome, sigla, tipo, parent_id, caminho_hierarquico, titular_nome)
VALUES
    ('00000000-0000-0000-0000-000000000030', 'Superintendência de Tecnologia da Informação', 'STI', 'SUPERINTENDENCIA', '00000000-0000-0000-0000-000000000021', 'SEDUC.SAAD.STI', 'Superintendente Exemplo 30'),
    ('00000000-0000-0000-0000-000000000031', 'Superintendência de Infraestrutura', 'SUINFRA', 'SUPERINTENDENCIA', '00000000-0000-0000-0000-000000000021', 'SEDUC.SAAD.SUINFRA', 'Superintendente Exemplo 31'),
    ('00000000-0000-0000-0000-000000000032', 'Superintendência de Suprimentos', 'SUPRI', 'SUPERINTENDENCIA', '00000000-0000-0000-0000-000000000021', 'SEDUC.SAAD.SUPRI', 'Superintendente Exemplo 32'),
    ('00000000-0000-0000-0000-000000000033', 'Superintendência de Logística', 'SUPERLOG', 'SUPERINTENDENCIA', '00000000-0000-0000-0000-000000000021', 'SEDUC.SAAD.SUPERLOG', 'Superintendente Exemplo 33')
ON CONFLICT (sigla) DO NOTHING;

-- 4. Supervisões da STI (Tecnologia da Informação)
INSERT INTO public.unidades_organizacionais (id, nome, sigla, tipo, parent_id, caminho_hierarquico, titular_nome)
VALUES
    ('00000000-0000-0000-0000-000000000040', 'Supervisão de Desenvolvimento e Manutenção de Sistemas', 'SUDES', 'SUPERVISAO', '00000000-0000-0000-0000-000000000030', 'SEDUC.SAAD.STI.SUDES', 'Supervisor(a) Exemplo 40'),
    ('00000000-0000-0000-0000-000000000041', 'Supervisão de Redes', 'SUPREDES', 'SUPERVISAO', '00000000-0000-0000-0000-000000000030', 'SEDUC.SAAD.STI.SUPREDES', 'Supervisor(a) Exemplo 41'),
    ('00000000-0000-0000-0000-000000000042', 'Supervisão de Gerenciamento de Chamados', 'SUGEC', 'SUPERVISAO', '00000000-0000-0000-0000-000000000030', 'SEDUC.SAAD.STI.SUGEC', 'Supervisor(a) Exemplo 42'),
    ('00000000-0000-0000-0000-000000000043', 'Supervisão de Manutenção de Equipamentos e Softwares', 'SUMES', 'SUPERVISAO', '00000000-0000-0000-0000-000000000030', 'SEDUC.SAAD.STI.SUMES', 'Equipe Técnica Exemplo 43')
ON CONFLICT (sigla) DO NOTHING;

-- 5. Superintendências e Supervisões de SAOFC (Orçamento e Finanças)
INSERT INTO public.unidades_organizacionais (id, nome, sigla, tipo, parent_id, caminho_hierarquico, titular_nome)
VALUES
    ('00000000-0000-0000-0000-000000000050', 'Superintendência de Orçamento e Finanças', 'SUPORFI', 'SUPERINTENDENCIA', '00000000-0000-0000-0000-000000000020', 'SEDUC.SAOFC.SUPORFI', 'Superintendente Exemplo 50'),
    ('00000000-0000-0000-0000-000000000051', 'Supervisão de Orçamento', 'SUORC', 'SUPERVISAO', '00000000-0000-0000-0000-000000000050', 'SEDUC.SAOFC.SUPORFI.SUORC', 'Supervisor(a) Exemplo 51'),
    ('00000000-0000-0000-0000-000000000052', 'Supervisão Financeira', 'SUFIN', 'SUPERVISAO', '00000000-0000-0000-0000-000000000050', 'SEDUC.SAOFC.SUPORFI.SUFIN', 'Equipe Financeira Exemplo 52'),
    ('00000000-0000-0000-0000-000000000053', 'Supervisão Contábil', 'SUCONT', 'SUPERVISAO', '00000000-0000-0000-0000-000000000050', 'SEDUC.SAOFC.SUPORFI.SUCONT', 'Equipe Contábil Exemplo 53'),
    ('00000000-0000-0000-0000-000000000054', 'Superintendência de Contratos, Convênios e Prestação de Contas', 'SUPECON', 'SUPERINTENDENCIA', '00000000-0000-0000-0000-000000000020', 'SEDUC.SAOFC.SUPECON', 'Superintendente Exemplo 54'),
    ('00000000-0000-0000-0000-000000000055', 'Supervisão de Contratos e Convênios', 'SUCONV', 'SUPERVISAO', '00000000-0000-0000-0000-000000000054', 'SEDUC.SAOFC.SUPECON.SUCONV', 'Supervisor(a) Exemplo 55'),
    ('00000000-0000-0000-0000-000000000056', 'Supervisão de Prestação de Contas', 'SUPC', 'SUPERVISAO', '00000000-0000-0000-0000-000000000054', 'SEDUC.SAOFC.SUPECON.SUPC', 'Supervisor(a) Exemplo 56')
ON CONFLICT (sigla) DO NOTHING;

-- 6. Inserção de Processos de Demonstração
INSERT INTO public.processos (
    id,
    protocolo_sei,
    protocolo_startgov,
    numero_contrato_pncp,
    objeto,
    unidade_origem_id,
    unidade_atual_sei,
    fase_atual_startgov,
    status_etapa,
    prioridade,
    dias_parado_na_unidade,
    hash_ultimo_estado,
    ultima_movimentacao_em,
    proxima_verificacao_em
) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'SEI-021001/004521/2026',
    'STARTGOV-2026/0892',
    '12345678000199-1-000045/2026',
    'Aquisição de Switches e Equipamentos de Conectividade para Unidades Escolares da Rede Estadual',
    '00000000-0000-0000-0000-000000000040', -- SUDES / STI / SAAD / SEDUC
    'CSL',
    'Fase de Lances / Pregão Eletrônico',
    'FASE_EXTERNA_LICITACAO',
    'QUENTE',
    2,
    'hash_mock_001_abc123',
    timezone('utc', now() - interval '2 days'),
    timezone('utc', now())
),
(
    '10000000-0000-0000-0000-000000000002',
    'SEI-021001/007812/2026',
    'STARTGOV-2026/1045',
    NULL,
    'Contratação de Serviços Especializados de Nuvem Governamental e Banco de Dados Supabase/PostgreSQL',
    '00000000-0000-0000-0000-000000000040', -- SUDES / STI / SAAD / SEDUC
    'ASJUR',
    'Parecer Jurídico Conclusivo do Art. 53',
    'ANALISE_JURIDICA',
    'QUENTE',
    8,
    'hash_mock_002_def456',
    timezone('utc', now() - interval '8 days'),
    timezone('utc', now())
),
(
    '10000000-0000-0000-0000-000000000003',
    'SEI-021001/001190/2026',
    NULL,
    NULL,
    'Elaboração de ETP e Termo de Referência para Reforma das Escolas DIGNAS do Polo Munin',
    '00000000-0000-0000-0000-000000000031', -- SUINFRA / SAAD / SEDUC
    'SUINFRA',
    NULL,
    'FASE_INTERNA_SEI',
    'MORNO',
    18,
    'hash_mock_003_ghi789',
    timezone('utc', now() - interval '18 days'),
    timezone('utc', now() + interval '4 hours')
)
ON CONFLICT (protocolo_sei) DO NOTHING;

-- 7. Inserção de Histórico de Tramitações
INSERT INTO public.historico_tramitacoes (
    processo_id,
    origem_sistema,
    data_hora_evento,
    unidade_setor,
    descricao_andamento,
    documento_anexado,
    tipo_documento,
    resumo_ia,
    hash_evento
) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'SEI',
    timezone('utc', now() - interval '20 days'),
    'SUDES',
    'Autuação do processo administrativo e emissão do DFD nº 12/2026 por Servidor Exemplo 01',
    'DFD-2026-SUDES.pdf',
    'Documento de Formalização da Demanda (DFD)',
    'Abertura formal da demanda com justificativa técnica para aquisição de infraestrutura de conectividade escolar.',
    'hash_evt_01'
),
(
    '10000000-0000-0000-0000-000000000001',
    'SEI',
    timezone('utc', now() - interval '14 days'),
    'STI',
    'Aprovação do Estudo Técnico Preliminar (ETP) e Termo de Referência pela Superintendência de TI',
    'TR-Switches-vFinal.pdf',
    'Termo de Referência',
    'Especificação técnica aprovada por Servidor Exemplo 02 para 120 switches gerenciáveis.',
    'hash_evt_02'
),
(
    '10000000-0000-0000-0000-000000000001',
    'STARTGOV',
    timezone('utc', now() - interval '7 days'),
    'CSL',
    'Importação da demanda no StartGov com geração do certame PE nº 042/2026',
    'Edital-PE-042-2026.pdf',
    'Edital de Licitação',
    'Processo publicado no StartGov vinculado ao SEI-021001/004521/2026 por Servidor Exemplo 03.',
    'hash_evt_03'
),
(
    '10000000-0000-0000-0000-000000000001',
    'PNCP',
    timezone('utc', now() - interval '6 days'),
    'PNCP-API',
    'Publicação automática do Edital no Portal Nacional de Contratações Públicas',
    NULL,
    'Publicação Legal Art. 54',
    'Edital em conformidade com art. 54 da Lei 14.133/2021 no PNCP sob CNPJ da SEDUC.',
    'hash_evt_04'
),
(
    '10000000-0000-0000-0000-000000000001',
    'STARTGOV',
    timezone('utc', now() - interval '2 days'),
    'CSL',
    'Sessão pública aberta para disputa de lances entre fornecedores credenciados',
    'Ata-Lances-Inicial.pdf',
    'Ata de Abertura',
    'Recebidas 8 propostas válidas. Etapa de lances em andamento na CSL.',
    'hash_evt_05'
)
ON CONFLICT (processo_id, hash_evento) DO NOTHING;
