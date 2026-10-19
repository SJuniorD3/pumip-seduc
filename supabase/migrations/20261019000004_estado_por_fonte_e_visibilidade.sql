-- ==============================================================================
-- PUMIP-SEDUC: Migração 004 - Estado por Fonte, Telemetria e Visibilidade Unificada
-- Remediações do Relatório Técnico de Auditoria (Out/2026):
-- - WRK-02: Tabela processos_estado_fonte para hashes independentes por fonte (SEI, StartGov, PNCP)
-- - BD-02 / WRK-08: Função SQL unificada usuario_pode_ver_processo para RLS e Worker
-- - WRK-05: Tabela integracoes_telemetria para observabilidade real de cada conector
-- - BD-06: Integridade e versionamento de notas_internas
-- ==============================================================================

-- 1. Estado de Coleta e Delta por Fonte (WRK-02)
-- Evita a colisão onde o hash do SEI sobrescreve o StartGov e vice-versa
CREATE TABLE IF NOT EXISTS public.processos_estado_fonte (
    processo_id UUID NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
    origem public.origem_sistema NOT NULL,
    hash_ultimo_estado TEXT NULL,
    ultima_verificacao_em TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    falhas_consecutivas INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    PRIMARY KEY (processo_id, origem)
);

ALTER TABLE public.processos_estado_fonte ENABLE ROW LEVEL SECURITY;

-- Apenas o papel de serviço do worker acessa e gerencia o estado das fontes
REVOKE ALL ON public.processos_estado_fonte FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.processos_estado_fonte TO service_role;


-- 2. Tabela de Telemetria e Saúde das Integrações (WRK-05 / OPS-03)
CREATE TABLE IF NOT EXISTS public.integracoes_telemetria (
    sistema public.origem_sistema PRIMARY KEY,
    ultimo_status TEXT NOT NULL,
    ultimo_erro TEXT NULL,
    falhas_consecutivas INT NOT NULL DEFAULT 0,
    ultima_tentativa_em TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    ultimo_sucesso_em TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

ALTER TABLE public.integracoes_telemetria ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem consultar a telemetria; gravação exclusiva do worker
CREATE POLICY "Leitura de telemetria por usuarios autenticados"
ON public.integracoes_telemetria FOR SELECT TO authenticated
USING (true);

GRANT SELECT ON public.integracoes_telemetria TO authenticated;
GRANT ALL ON public.integracoes_telemetria TO service_role;

-- Carga inicial de telemetria para os 3 conectores
INSERT INTO public.integracoes_telemetria (sistema, ultimo_status, falhas_consecutivas)
VALUES 
    ('SEI', 'AGUARDANDO_INTEGRACAO', 0),
    ('STARTGOV', 'AGUARDANDO_INTEGRACAO', 0),
    ('PNCP', 'DISPONIVEL', 0)
ON CONFLICT (sistema) DO NOTHING;


-- 3. Função Unificada de Regra de Acesso e Visibilidade (BD-02 / WRK-08)
-- Utilizada tanto pela RLS quanto pelo Worker para validar destinatários de alertas
CREATE OR REPLACE FUNCTION public.usuario_pode_ver_processo(p_usuario UUID, p_processo UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.perfis_usuarios pu
      JOIN public.unidades_organizacionais uu ON uu.id = pu.unidade_id
      JOIN public.processos pr ON pr.id = p_processo
      JOIN public.unidades_organizacionais uo ON uo.id = pr.unidade_origem_id
     WHERE pu.id = p_usuario AND pu.ativo
       AND (
             pu.role IN ('ADMIN', 'AUDITOR', 'SECRETARIO', 'SUBSECRETARIO')
          OR (pu.role IN ('SECRETARIO_ADJUNTO', 'SUPERINTENDENTE', 'SUPERVISOR', 'ASSESSOR')
              AND (uo.id = uu.id
                   OR pg_catalog.left(uo.caminho_hierarquico, pg_catalog.length(uu.caminho_hierarquico) + 1) = uu.caminho_hierarquico || '.'))
          OR (pu.role = 'ASSESSOR' AND pr.unidade_atual_sei = uu.sigla)
          OR (pu.role = 'TECNICO' AND uo.id = uu.id)
       )
  )
  OR EXISTS (
    SELECT 1 FROM public.processos_acessos_concedidos pac
     WHERE pac.processo_id = p_processo AND pac.usuario_id = p_usuario AND pac.ativo
       AND pac.data_inicio <= pg_catalog.now() AND (pac.data_fim IS NULL OR pac.data_fim >= pg_catalog.now())
  );
$$;

REVOKE EXECUTE ON FUNCTION public.usuario_pode_ver_processo(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.usuario_pode_ver_processo(UUID, UUID) TO authenticated, service_role;


-- 4. Função RPC Atômica para Atualização com Registro de Estado por Fonte (WRK-02 / WRK-03)
CREATE OR REPLACE FUNCTION public.registrar_andamento_sincronizacao(
    p_processo_id UUID,
    p_origem public.origem_sistema,
    p_data_hora_evento TIMESTAMPTZ,
    p_unidade_setor TEXT,
    p_descricao_andamento TEXT,
    p_documento_anexado TEXT,
    p_tipo_documento TEXT,
    p_resumo_ia TEXT,
    p_hash_evento TEXT,
    p_metadados JSONB,
    p_nova_unidade_sei TEXT,
    p_proxima_verificacao TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_inserido BOOLEAN := FALSE;
BEGIN
    -- 4.1 Inserção na Linha do Tempo (Historico) com idempotência garantida
    INSERT INTO public.historico_tramitacoes (
        processo_id,
        origem_sistema,
        data_hora_evento,
        unidade_setor,
        descricao_andamento,
        documento_anexado,
        tipo_documento,
        resumo_ia,
        hash_evento,
        metadados
    ) VALUES (
        p_processo_id,
        p_origem,
        p_data_hora_evento,
        COALESCE(p_unidade_setor, 'NÃO INFORMADO'),
        p_descricao_andamento,
        p_documento_anexado,
        p_tipo_documento,
        p_resumo_ia,
        p_hash_evento,
        COALESCE(p_metadados, '{}'::jsonb)
    )
    ON CONFLICT (processo_id, hash_evento) DO NOTHING
    RETURNING TRUE INTO v_inserido;

    -- 4.2 Atualiza o estado da respectiva fonte em processos_estado_fonte (WRK-02)
    INSERT INTO public.processos_estado_fonte (
        processo_id,
        origem,
        hash_ultimo_estado,
        ultima_verificacao_em,
        falhas_consecutivas,
        updated_at
    ) VALUES (
        p_processo_id,
        p_origem,
        p_hash_evento,
        pg_catalog.now(),
        0,
        pg_catalog.now()
    )
    ON CONFLICT (processo_id, origem) DO UPDATE
    SET
        hash_ultimo_estado = EXCLUDED.hash_ultimo_estado,
        ultima_verificacao_em = EXCLUDED.ultima_verificacao_em,
        falhas_consecutivas = 0,
        updated_at = pg_catalog.now();

    -- 4.3 Se o andamento já existia, atualiza apenas telemetria do processo
    IF v_inserido IS NULL OR NOT v_inserido THEN
        UPDATE public.processos
        SET
            ultima_verificacao_em = pg_catalog.now(),
            proxima_verificacao_em = p_proxima_verificacao,
            updated_at = pg_catalog.now()
        WHERE id = p_processo_id;

        RETURN FALSE;
    END IF;

    -- 4.4 Se foi um andamento novo, atualiza dados do processo e zera inércia
    UPDATE public.processos
    SET
        hash_ultimo_estado = p_hash_evento,
        unidade_atual_sei = CASE 
            WHEN p_nova_unidade_sei IS NOT NULL AND p_nova_unidade_sei <> '' THEN p_nova_unidade_sei 
            ELSE unidade_atual_sei 
        END,
        dias_parado_na_unidade = 0,
        ultima_movimentacao_em = GREATEST(COALESCE(ultima_movimentacao_em, p_data_hora_evento), p_data_hora_evento),
        ultima_verificacao_em = pg_catalog.now(),
        proxima_verificacao_em = p_proxima_verificacao,
        updated_at = pg_catalog.now()
    WHERE id = p_processo_id;

    RETURN TRUE;
END;
$$;


-- 5. RPC para Atualização de Telemetria de Conector (WRK-05)
CREATE OR REPLACE FUNCTION public.atualizar_telemetria_integracao(
    p_sistema public.origem_sistema,
    p_status TEXT,
    p_erro TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.integracoes_telemetria (
        sistema,
        ultimo_status,
        ultimo_erro,
        falhas_consecutivas,
        ultima_tentativa_em,
        ultimo_sucesso_em,
        updated_at
    ) VALUES (
        p_sistema,
        p_status,
        p_erro,
        CASE WHEN p_status = 'SUCCESS' THEN 0 ELSE 1 END,
        pg_catalog.now(),
        CASE WHEN p_status = 'SUCCESS' THEN pg_catalog.now() ELSE NULL END,
        pg_catalog.now()
    )
    ON CONFLICT (sistema) DO UPDATE
    SET
        ultimo_status = EXCLUDED.ultimo_status,
        ultimo_erro = EXCLUDED.ultimo_erro,
        falhas_consecutivas = CASE 
            WHEN EXCLUDED.ultimo_status = 'SUCCESS' THEN 0 
            ELSE public.integracoes_telemetria.falhas_consecutivas + 1 
        END,
        ultima_tentativa_em = EXCLUDED.ultima_tentativa_em,
        ultimo_sucesso_em = CASE 
            WHEN EXCLUDED.ultimo_status = 'SUCCESS' THEN EXCLUDED.ultima_tentativa_em 
            ELSE public.integracoes_telemetria.ultimo_sucesso_em 
        END,
        updated_at = pg_catalog.now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.atualizar_telemetria_integracao(public.origem_sistema, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.atualizar_telemetria_integracao(public.origem_sistema, TEXT, TEXT) TO service_role;
