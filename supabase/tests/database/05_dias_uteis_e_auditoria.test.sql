-- ==============================================================================
-- PUMIP-SEDUC: Teste pgTAP - Dias Úteis no Banco e Trilha de Auditoria Automática
-- ==============================================================================
BEGIN;
SELECT plan(4);

-- Teste 1: dias_uteis_entre com exclusão do primeiro dia (Art. 183 Lei 14.133/2021)
-- Sexta 24/10/2025 para Segunda 27/10/2025 (início sexta não conta, sábado/domingo não contam, segunda conta = 1 dia)
SELECT is(
    public.dias_uteis_entre('2025-10-24'::date, '2025-10-27'::date),
    1,
    'Contagem de dias úteis exclui dia inicial e final de semana (Art. 183 Lei 14.133/2021)'
);

-- Teste 2: Cruzamento de feriado estadual do Maranhão (28/07 Adesão do Maranhão)
-- Segunda 27/07/2026 para Quarta 29/07/2026 (terça 28/07 é feriado estadual -> apenas quarta conta = 1 dia)
SELECT is(
    public.dias_uteis_entre('2026-07-27'::date, '2026-07-29'::date),
    1,
    'Feriado estadual da Adesão do Maranhão (28/07) é devidamente descontado dos dias úteis'
);

-- Teste 3: Visão processos_com_inercia expõe dias_uteis_parado computado
SELECT lives_ok(
    $$ SELECT id, dias_uteis_parado FROM public.processos_com_inercia LIMIT 1 $$,
    'Visão processos_com_inercia calcula dias_uteis_parado dinamicamente via SQL'
);

-- Teste 4: Gatilho automático de auditoria registra alteração no banco
INSERT INTO public.notas_internas (
    id, processo_id, autor_id, autor_nome, autor_cargo, texto
) VALUES (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Servidor Exemplo',
    'Técnico',
    'Nota de teste para verificar gatilho de auditoria'
);

SELECT is(
    (SELECT count(*)::int FROM public.auditoria_log WHERE entidade = 'notas_internas' AND entidade_id = '20000000-0000-0000-0000-000000000001'),
    1,
    'Gatilho trg_audit_notas gravou automaticamente na trilha de auditoria_log'
);

SELECT * FROM finish();
ROLLBACK;
