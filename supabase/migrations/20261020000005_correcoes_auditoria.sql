-- ==============================================================================
-- PUMIP-SEDUC: Migração 20261020000005 - Correções de Auditoria Técnica (@Cpacesso)
-- Implementa:
-- 1. Políticas RLS Idempotentes (DROP POLICY IF EXISTS)
-- 2. Trilha de Auditoria no Banco de Dados via Gatilho SECURITY DEFINER
-- 3. Tabela de Feriados Oficiais e Função SQL dias_uteis_entre (Art. 183 Lei 14.133/2021)
-- 4. Visão processos_com_inercia com cálculo dinâmico de dias_uteis_parado
-- 5. Índices de Desempenho para Linha do Tempo e Painel
-- 6. Tabela configuracoes_integracao e Visão status_integracoes (Restrito ADMIN)
-- ==============================================================================

-- 1. POLÍTICAS RLS IDEMPOTENTES E BLINDAGEM DA AUDITORIA
-- Remove permissão de inserção manual de usuários na trilha de auditoria
DROP POLICY IF EXISTS "Registro de auditoria pelo sistema" ON public.auditoria_log;
REVOKE INSERT ON public.auditoria_log FROM authenticated, anon, PUBLIC;
GRANT SELECT ON public.auditoria_log TO authenticated;
GRANT ALL ON public.auditoria_log TO service_role;

-- 2. FUNÇÃO E GATILHO DE TRILHA DE AUDITORIA IMUTÁVEL NO BANCO
CREATE OR REPLACE FUNCTION public.gravar_trilha_auditoria_banco()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_usuario_id UUID;
    v_headers JSONB;
    v_ip TEXT := '127.0.0.1';
    v_entidade_id UUID;
    v_dados_evento JSONB;
BEGIN
    -- Captura usuário autenticado da sessão Supabase Auth
    BEGIN
        v_usuario_id := (pg_catalog.current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_usuario_id := NULL;
    END;

    -- Captura IP do cabeçalho PostgREST / Proxy reverso
    BEGIN
        v_headers := pg_catalog.current_setting('request.headers', true)::jsonb;
        v_ip := COALESCE(v_headers ->> 'x-forwarded-for', v_headers ->> 'x-real-ip', '127.0.0.1');
    EXCEPTION WHEN OTHERS THEN
        v_ip := '127.0.0.1';
    END;

    -- Identifica o ID da entidade afetada
    IF TG_OP = 'DELETE' THEN
        v_entidade_id := OLD.id;
        v_dados_evento := pg_catalog.jsonb_build_object(
            'operacao', 'DELETE',
            'valores_antigos', pg_catalog.to_jsonb(OLD),
            'ip', v_ip
        );
    ELSIF TG_OP = 'UPDATE' THEN
        v_entidade_id := NEW.id;
        v_dados_evento := pg_catalog.jsonb_build_object(
            'operacao', 'UPDATE',
            'valores_novos', pg_catalog.to_jsonb(NEW),
            'valores_antigos', pg_catalog.to_jsonb(OLD),
            'ip', v_ip
        );
    ELSE
        v_entidade_id := NEW.id;
        v_dados_evento := pg_catalog.jsonb_build_object(
            'operacao', 'INSERT',
            'valores_novos', pg_catalog.to_jsonb(NEW),
            'ip', v_ip
        );
    END IF;

    -- Gravação atômica e imutável na trilha
    INSERT INTO public.auditoria_log (
        usuario_id,
        acao,
        entidade,
        entidade_id,
        dados,
        ip_origem,
        created_at
    ) VALUES (
        v_usuario_id,
        TG_OP || '_' || TG_TABLE_NAME,
        TG_TABLE_NAME,
        v_entidade_id,
        v_dados_evento,
        v_ip,
        pg_catalog.now()
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Gatilhos automáticos nas tabelas críticas de negócio e segurança
DROP TRIGGER IF EXISTS trg_audit_processos ON public.processos;
CREATE TRIGGER trg_audit_processos
AFTER INSERT OR UPDATE OR DELETE ON public.processos
FOR EACH ROW EXECUTE FUNCTION public.gravar_trilha_auditoria_banco();

DROP TRIGGER IF EXISTS trg_audit_perfis_usuarios ON public.perfis_usuarios;
CREATE TRIGGER trg_audit_perfis_usuarios
AFTER INSERT OR UPDATE OR DELETE ON public.perfis_usuarios
FOR EACH ROW EXECUTE FUNCTION public.gravar_trilha_auditoria_banco();

DROP TRIGGER IF EXISTS trg_audit_concessoes ON public.processos_acessos_concedidos;
CREATE TRIGGER trg_audit_concessoes
AFTER INSERT OR UPDATE OR DELETE ON public.processos_acessos_concedidos
FOR EACH ROW EXECUTE FUNCTION public.gravar_trilha_auditoria_banco();

DROP TRIGGER IF EXISTS trg_audit_notas ON public.notas_internas;
CREATE TRIGGER trg_audit_notas
AFTER INSERT OR UPDATE OR DELETE ON public.notas_internas
FOR EACH ROW EXECUTE FUNCTION public.gravar_trilha_auditoria_banco();


-- 3. TABELA DE FERIADOS E DIAS ÚTEIS NO BANCO DE DADOS
CREATE TABLE IF NOT EXISTS public.feriados (
    data DATE PRIMARY KEY,
    descricao TEXT NOT NULL,
    abrangencia TEXT NOT NULL -- 'NACIONAL', 'ESTADUAL', 'MUNICIPAL'
);

ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de feriados" ON public.feriados;
CREATE POLICY "Leitura pública de feriados"
ON public.feriados FOR SELECT
TO authenticated, anon
USING (true);

-- Carga dos feriados oficiais vigentes no Maranhão (2025 - 2027)
INSERT INTO public.feriados (data, descricao, abrangencia) VALUES
    -- Nacionais Fixos
    ('2025-01-01', 'Confraternização Universal', 'NACIONAL'),
    ('2025-04-21', 'Tiradentes', 'NACIONAL'),
    ('2025-05-01', 'Dia do Trabalho', 'NACIONAL'),
    ('2025-07-28', 'Adesão do Maranhão à Independência', 'ESTADUAL'),
    ('2025-09-07', 'Independência do Brasil', 'NACIONAL'),
    ('2025-10-12', 'Nossa Senhora Aparecida', 'NACIONAL'),
    ('2025-11-02', 'Finados', 'NACIONAL'),
    ('2025-11-15', 'Proclamação da República', 'NACIONAL'),
    ('2025-11-20', 'Dia Nacional de Zumbi e da Consciência Negra', 'NACIONAL'),
    ('2025-12-08', 'Nossa Senhora da Conceição', 'MUNICIPAL'),
    ('2025-12-25', 'Natal', 'NACIONAL'),
    -- Móveis 2025
    ('2025-03-03', 'Carnaval (Segunda-feira)', 'NACIONAL'),
    ('2025-03-04', 'Carnaval (Terça-feira)', 'NACIONAL'),
    ('2025-04-18', 'Sexta-feira Santa', 'NACIONAL'),
    ('2025-06-19', 'Corpus Christi', 'NACIONAL'),
    -- 2026
    ('2026-01-01', 'Confraternização Universal', 'NACIONAL'),
    ('2026-02-16', 'Carnaval (Segunda-feira)', 'NACIONAL'),
    ('2026-02-17', 'Carnaval (Terça-feira)', 'NACIONAL'),
    ('2026-04-03', 'Sexta-feira Santa', 'NACIONAL'),
    ('2026-04-21', 'Tiradentes', 'NACIONAL'),
    ('2026-05-01', 'Dia do Trabalho', 'NACIONAL'),
    ('2026-06-04', 'Corpus Christi', 'NACIONAL'),
    ('2026-07-28', 'Adesão do Maranhão à Independência', 'ESTADUAL'),
    ('2026-09-07', 'Independência do Brasil', 'NACIONAL'),
    ('2026-10-12', 'Nossa Senhora Aparecida', 'NACIONAL'),
    ('2026-11-02', 'Finados', 'NACIONAL'),
    ('2026-11-15', 'Proclamação da República', 'NACIONAL'),
    ('2026-11-20', 'Dia Nacional de Zumbi e da Consciência Negra', 'NACIONAL'),
    ('2026-12-08', 'Nossa Senhora da Conceição', 'MUNICIPAL'),
    ('2026-12-25', 'Natal', 'NACIONAL'),
    -- 2027
    ('2027-01-01', 'Confraternização Universal', 'NACIONAL'),
    ('2027-02-08', 'Carnaval (Segunda-feira)', 'NACIONAL'),
    ('2027-02-09', 'Carnaval (Terça-feira)', 'NACIONAL'),
    ('2027-03-26', 'Sexta-feira Santa', 'NACIONAL'),
    ('2027-04-21', 'Tiradentes', 'NACIONAL'),
    ('2027-05-01', 'Dia do Trabalho', 'NACIONAL'),
    ('2027-05-27', 'Corpus Christi', 'NACIONAL'),
    ('2027-07-28', 'Adesão do Maranhão à Independência', 'ESTADUAL'),
    ('2027-09-07', 'Independência do Brasil', 'NACIONAL'),
    ('2027-10-12', 'Nossa Senhora Aparecida', 'NACIONAL'),
    ('2027-11-02', 'Finados', 'NACIONAL'),
    ('2027-11-15', 'Proclamação da República', 'NACIONAL'),
    ('2027-11-20', 'Dia Nacional de Zumbi e da Consciência Negra', 'NACIONAL'),
    ('2027-12-08', 'Nossa Senhora da Conceição', 'MUNICIPAL'),
    ('2027-12-25', 'Natal', 'NACIONAL')
ON CONFLICT (data) DO NOTHING;

-- Função de contagem de dias úteis com exclusão do primeiro dia e inclusão do último (Art. 183 Lei 14.133/2021)
CREATE OR REPLACE FUNCTION public.dias_uteis_entre(inicio DATE, fim DATE)
RETURNS INT
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
BEGIN
    IF fim <= inicio THEN
        RETURN 0;
    END IF;

    RETURN (
        SELECT COALESCE(pg_catalog.count(*)::INT, 0)
        FROM pg_catalog.generate_series(inicio + 1, fim, '1 day'::interval) d
        WHERE pg_catalog.extract(isodow FROM d) < 6
          AND d::date NOT IN (SELECT data FROM public.feriados)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dias_uteis_entre(DATE, DATE) TO authenticated, anon, service_role;


-- 4. VISÃO DE PROCESSOS COM INÉRCIA PROCESSUAL COMPUTADA NO BANCO
CREATE OR REPLACE VIEW public.processos_com_inercia AS
SELECT
    p.*,
    public.dias_uteis_entre(p.ultima_movimentacao_em::DATE, pg_catalog.now()::DATE) AS dias_uteis_parado
FROM public.processos p;

GRANT SELECT ON public.processos_com_inercia TO authenticated;


-- 5. ÍNDICES DE DESEMPENHO E APOIO
CREATE INDEX IF NOT EXISTS idx_tramitacoes_data_hora_evento
ON public.historico_tramitacoes (data_hora_evento);

CREATE INDEX IF NOT EXISTS idx_processos_ultima_movimentacao_em
ON public.processos (ultima_movimentacao_em);


-- 6. TABELA DE CONFIGURAÇÕES DE INTEGRAÇÃO (Parâmetros não-secretos com RLS para ADMIN)
CREATE TABLE IF NOT EXISTS public.configuracoes_integracao (
    chave TEXT PRIMARY KEY,
    valor JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

ALTER TABLE public.configuracoes_integracao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de configuracoes por administradores" ON public.configuracoes_integracao;
CREATE POLICY "Leitura de configuracoes por administradores"
ON public.configuracoes_integracao FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.perfis_usuarios pu
        WHERE pu.id = auth.uid() AND pu.role = 'ADMIN'
    )
);

DROP POLICY IF EXISTS "Gravacao de configuracoes por administradores" ON public.configuracoes_integracao;
CREATE POLICY "Gravacao de configuracoes por administradores"
ON public.configuracoes_integracao FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.perfis_usuarios pu
        WHERE pu.id = auth.uid() AND pu.role = 'ADMIN'
    )
);

-- Visão pública de status das integrações (sem segredos, sem tokens)
CREATE OR REPLACE VIEW public.status_integracoes AS
SELECT
    it.sistema,
    it.ultimo_status,
    it.falhas_consecutivas,
    it.ultima_tentativa_em,
    it.ultimo_sucesso_em
FROM public.integracoes_telemetria it;

GRANT SELECT ON public.status_integracoes TO authenticated;
