-- ==============================================================================
-- PUMIP-SEDUC: Teste pgTAP - Perfis Assessor Jurídico e Supervisor (RLS Hierárquico)
-- ==============================================================================
BEGIN;
SELECT plan(4);

-- 1. Setup de usuário Assessor Jurídico (ASJUR)
INSERT INTO auth.users (id, email)
VALUES ('aaaaaaaa-0000-0000-0000-000000000003', 'assessor@exemplo.test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.perfis_usuarios (id, nome, email, role, unidade_id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000003', 'Assessor Jurídico Exemplo', 'assessor@exemplo.test',
        'ASSESSOR', '00000000-0000-0000-0000-000000000004') -- ASJUR
ON CONFLICT (id) DO NOTHING;

-- 2. Ativa contexto authenticated como Assessor Jurídico
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';

-- Teste 1: Assessor vê processos que tramitam na sua unidade atual (ex: processo 002 está em ASJUR)
SELECT is(
    public.usuario_pode_ver_processo('aaaaaaaa-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000002'::uuid),
    true,
    'Assessor Jurídico visualiza processo em tramitação atual no setor jurídico (ASJUR)'
);

-- Teste 2: Assessor NÃO vê processos que tramitam fora de seu setor e não originados nele
SELECT is(
    public.usuario_pode_ver_processo('aaaaaaaa-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000003'::uuid),
    false,
    'Assessor Jurídico é bloqueado para processos fora da unidade e sem tramitação jurídica'
);

-- 3. Concessão temporária de acesso para o processo 003
RESET ROLE;
INSERT INTO public.processos_acessos_concedidos (
    processo_id, usuario_id, concedido_por_id, motivo, data_inicio, data_fim, ativo
) VALUES (
    '10000000-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'Parecer específico solicitado pelo Secretário',
    now() - interval '1 hour',
    now() + interval '2 days',
    true
);

SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';

-- Teste 3: Com a concessão ativa, usuario_pode_ver_processo passa a retornar TRUE
SELECT is(
    public.usuario_pode_ver_processo('aaaaaaaa-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000003'::uuid),
    true,
    'Assessor visualiza processo concedido via processos_acessos_concedidos em vigência'
);

-- Teste 4: Assessor é impedido de ler configuracoes_integracao (exclusivo ADMIN)
SELECT throws_ok(
    $$ SELECT count(*) FROM public.configuracoes_integracao $$,
    '42501',
    null,
    'Assessor é impedido de acessar configuracoes_integracao por RLS'
);

SELECT * FROM finish();
ROLLBACK;
