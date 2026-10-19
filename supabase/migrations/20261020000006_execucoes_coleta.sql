-- ==============================================================================
-- PUMIP-SEDUC: Migração 006 - Observabilidade e Telemetria de Coleta
-- Tabela para rastreabilidade de rodadas de sincronização do worker (Etapa 8)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.execucoes_coleta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id TEXT NOT NULL UNIQUE,
    iniciada_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    concluida_em TIMESTAMPTZ NULL,
    duracao_ms INT NOT NULL DEFAULT 0,
    processos_analisados INT NOT NULL DEFAULT 0,
    novos_andamentos INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'EM_ANDAMENTO', -- EM_ANDAMENTO, SUCESSO, PARCIAL, FALHA
    detalhes_fontes JSONB NOT NULL DEFAULT '{}'::jsonb,
    erros TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_execucoes_coleta_iniciada ON public.execucoes_coleta (iniciada_em DESC);
CREATE INDEX IF NOT EXISTS idx_execucoes_coleta_status ON public.execucoes_coleta (status);

-- RLS: Apenas administradores e o worker interno (service_role) podem acessar telemetria
ALTER TABLE public.execucoes_coleta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas administradores podem visualizar telemetria de execucoes"
ON public.execucoes_coleta
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.perfis_usuarios p
        WHERE p.id = auth.uid()
        AND p.role = 'ADMIN'
    )
);

CREATE POLICY "Service Role possui acesso total a execucoes_coleta"
ON public.execucoes_coleta
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
