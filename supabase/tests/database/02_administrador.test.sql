-- ==============================================================================
-- PUMIP-SEDUC: Teste pgTAP - Perfil Administrador e Auditor (Visão Global)
-- ==============================================================================
BEGIN;
SELECT plan(4);

-- 1. Setup de usuário administrador
INSERT INTO auth.users (id, email)
VALUES ('aaaaaaaa-0000-0000-0000-000000000002', 'admin@exemplo.test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.perfis_usuarios (id, nome, email, role, unidade_id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000002', 'Administrador Exemplo', 'admin@exemplo.test',
        'ADMIN', '00000000-0000-0000-0000-000000000030')
ON CONFLICT (id) DO NOTHING;

-- 2. Ativa contexto de authenticated como Administrador
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated"}';

-- Teste 1: Administrador enxerga 100% dos processos do banco
SELECT is(
    (SELECT count(*)::int FROM public.processos),
    (SELECT count(*)::int FROM public.processos_com_inercia),
    'Administrador possui visão global de todos os processos cadastrados'
);

-- Teste 2: usuario_pode_ver_processo retorna TRUE para qualquer processo
SELECT is(
    public.usuario_pode_ver_processo('aaaaaaaa-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000003'::uuid),
    true,
    'usuario_pode_ver_processo retorna TRUE irrestrito para perfil ADMIN'
);

-- Teste 3: Administrador tem permissão para ler configuracoes_integracao
SELECT lives_ok(
    $$ SELECT count(*) FROM public.configuracoes_integracao $$,
    'Administrador acessa a tabela de configuracoes_integracao'
);

-- Teste 4: Administrador tem permissão de leitura na visão status_integracoes
SELECT lives_ok(
    $$ SELECT count(*) FROM public.status_integracoes $$,
    'Administrador acessa a visão de status_integracoes'
);

SELECT * FROM finish();
ROLLBACK;
