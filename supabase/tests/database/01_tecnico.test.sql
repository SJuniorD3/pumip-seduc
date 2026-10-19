-- ==============================================================================
-- PUMIP-SEDUC: Teste pgTAP - Perfil Técnico (Row Level Security)
-- ==============================================================================
BEGIN;
SELECT plan(4);

-- 1. Setup de usuário técnico e unidade de teste
INSERT INTO auth.users (id, email)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'tecnico@exemplo.test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.perfis_usuarios (id, nome, email, role, unidade_id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'Técnico Exemplo', 'tecnico@exemplo.test',
        'TECNICO', '00000000-0000-0000-0000-000000000040')
ON CONFLICT (id) DO NOTHING;

-- 2. Ativa contexto de authenticated como o técnico
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

-- Teste 1: Técnico vê apenas processos originados na sua própria unidade
SELECT is(
    (SELECT count(*)::int FROM public.processos WHERE unidade_origem_id = '00000000-0000-0000-0000-000000000040'),
    (SELECT count(*)::int FROM public.processos),
    'Técnico visualiza estritamente os processos da sua própria unidade'
);

-- Teste 2: Técnico é impedido de executar diretamente a função de sincronização (SEG-01)
SELECT throws_ok(
    $$ SELECT public.registrar_andamento_sincronizacao(
         '10000000-0000-0000-0000-000000000003', 'SEI', now(), 'X', 'Tentativa de forja',
         null, null, null, 'hash_forjado', '{}'::jsonb, null, now()) $$,
    '42501',
    null,
    'Técnico não tem permissão para executar a função de sincronização do worker'
);

-- Teste 3: Técnico é impedido de gravar diretamente na tabela auditoria_log
SELECT throws_ok(
    $$ INSERT INTO public.auditoria_log (acao, entidade, entidade_id) VALUES ('MANUAL_INJECTION', 'processos', '10000000-0000-0000-0000-000000000001') $$,
    '42501',
    null,
    'Técnico é impedido de gravar diretamente na trilha de auditoria'
);

-- Teste 4: Função usuario_pode_ver_processo valida isolamento para processo de outra unidade
SELECT is(
    public.usuario_pode_ver_processo('aaaaaaaa-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000003'::uuid),
    false,
    'usuario_pode_ver_processo retorna FALSE para técnico acessando processo fora de sua lotação'
);

SELECT * FROM finish();
ROLLBACK;
