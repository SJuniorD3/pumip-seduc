-- ==============================================================================
-- PUMIP-SEDUC: Teste pgTAP - Propagação em Cascata de Caminho Hierárquico (BD-01)
-- ==============================================================================
BEGIN;
SELECT plan(3);

-- Teste 1: Confere estado inicial das unidades STI e SUDES
SELECT is(
    (SELECT caminho_hierarquico FROM public.unidades_organizacionais WHERE sigla = 'STI'),
    'SEDUC.SAAD.STI',
    'Caminho hierárquico inicial da STI está consistente'
);

SELECT is(
    (SELECT caminho_hierarquico FROM public.unidades_organizacionais WHERE sigla = 'SUDES'),
    'SEDUC.SAAD.STI.SUDES',
    'Caminho hierárquico inicial da SUDES (filha da STI) está consistente'
);

-- Atualiza o caminho da superintendência pai (ex: renomeação da superintendência)
UPDATE public.unidades_organizacionais
SET caminho_hierarquico = 'SEDUC.SAAD.STI_NOVA'
WHERE sigla = 'STI';

-- Teste 2: Confere se o gatilho trg_unidades_caminho_propaga atualizou a filha automaticamente
SELECT is(
    (SELECT caminho_hierarquico FROM public.unidades_organizacionais WHERE sigla = 'SUDES'),
    'SEDUC.SAAD.STI_NOVA.SUDES',
    'Gatilho trg_unidades_caminho_propaga propagou a alteração em cascata para SUDES'
);

SELECT * FROM finish();
ROLLBACK;
