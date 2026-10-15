-- ==============================================================================
-- PUMIP-SEDUC: Plataforma Unificada de Monitoramento e Inteligência Processual
-- Migração 001: Esquema Oficial do Organograma SEDUC-MA, Hierarquia de Cargos, RLS e Auditoria
-- Versão de Engenharia: v2.1 (Conforme Organograma SEDUC Oficial de 22/06/2026)
-- Hierarquia: SECRETARIO > SUBSECRETARIO > SECRETARIO_ADJUNTO > SUPERINTENDENTE > SUPERVISOR > ASSESSOR / TECNICO
-- ==============================================================================

-- 1. EXTENSÕES DO POSTGRESQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS E ENUMERAÇÕES
DO $$ BEGIN
    CREATE TYPE public.tipo_unidade AS ENUM (
        'SECRETARIA',
        'SUBSECRETARIA',
        'SECRETARIA_ADJUNTA',
        'SUPERINTENDENCIA',
        'SUPERVISAO',
        'ASSESSORIA',
        'COMISSAO',
        'REGIONAL',
        'SETOR'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM (
        'ADMIN',
        'SECRETARIO',
        'SUBSECRETARIO',
        'SECRETARIO_ADJUNTO',
        'SUPERINTENDENTE',
        'SUPERVISOR',
        'ASSESSOR',
        'TECNICO',
        'AUDITOR'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.processo_prioridade AS ENUM (
        'QUENTE',
        'MORNO',
        'FRIO'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.origem_sistema AS ENUM (
        'SEI',
        'STARTGOV',
        'PNCP'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.tipo_gatilho_alerta AS ENUM (
        'MUDANCA_SETOR_FASE',
        'PALAVRA_CHAVE',
        'INERCIA_SLA',
        'VENCIMENTO_CONTRATO',
        'PUBLICACAO_PNCP'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.status_etapa_processual AS ENUM (
        'FASE_INTERNA_SEI',
        'INSTRUCAO_TR',
        'ANALISE_JURIDICA',
        'FASE_EXTERNA_LICITACAO',
        'CONTRATO_EXECUCAO',
        'CONCLUIDO'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. TABELA: unidades_organizacionais (Organograma Estrutural com Caminho Hierárquico)
CREATE TABLE IF NOT EXISTS public.unidades_organizacionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    sigla TEXT NOT NULL UNIQUE,
    tipo public.tipo_unidade NOT NULL,
    parent_id UUID REFERENCES public.unidades_organizacionais(id) ON DELETE RESTRICT,
    caminho_hierarquico TEXT NOT NULL, -- Ex: SEDUC.SAAD.STI.SUDES para buscas rápidas com LIKE
    titular_nome TEXT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_unidades_caminho ON public.unidades_organizacionais (caminho_hierarquico text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_unidades_parent ON public.unidades_organizacionais (parent_id);

-- 4. TABELA: perfis_usuarios (Vinculada ao Supabase Auth com Cargos Estruturados)
CREATE TABLE IF NOT EXISTS public.perfis_usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role public.user_role NOT NULL DEFAULT 'TECNICO',
    unidade_id UUID NOT NULL REFERENCES public.unidades_organizacionais(id) ON DELETE RESTRICT,
    cargo_titulo TEXT, -- Ex: "Supervisor de Desenvolvimento de Sistemas", "Assessor Jurídico", "Técnico"
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_perfis_unidade ON public.perfis_usuarios (unidade_id);
CREATE INDEX IF NOT EXISTS idx_perfis_role ON public.perfis_usuarios (role);

-- 5. TABELA: processos (Entidade Central de Correlação SEI <-> StartGov <-> PNCP)
CREATE TABLE IF NOT EXISTS public.processos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocolo_sei TEXT NOT NULL UNIQUE,
    protocolo_startgov TEXT NULL,
    numero_contrato_pncp TEXT NULL,
    objeto TEXT NOT NULL,
    unidade_origem_id UUID NOT NULL REFERENCES public.unidades_organizacionais(id) ON DELETE RESTRICT,
    unidade_atual_sei TEXT NOT NULL,
    fase_atual_startgov TEXT NULL,
    status_etapa public.status_etapa_processual NOT NULL DEFAULT 'FASE_INTERNA_SEI',
    prioridade public.processo_prioridade NOT NULL DEFAULT 'QUENTE',
    dias_parado_na_unidade INT NOT NULL DEFAULT 0,
    hash_ultimo_estado TEXT NULL, -- SHA256 do último andamento consolidado
    ultima_movimentacao_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    ultima_verificacao_em TIMESTAMPTZ NULL,
    proxima_verificacao_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_processos_protocolo_sei ON public.processos (protocolo_sei);
CREATE INDEX IF NOT EXISTS idx_processos_protocolo_startgov ON public.processos (protocolo_startgov);
CREATE INDEX IF NOT EXISTS idx_processos_unidade_origem ON public.processos (unidade_origem_id);
CREATE INDEX IF NOT EXISTS idx_processos_sync_queue ON public.processos (proxima_verificacao_em, prioridade);
CREATE INDEX IF NOT EXISTS idx_processos_status_etapa ON public.processos (status_etapa);

-- 6. TABELA: historico_tramitacoes (Linha do Tempo Híbrida / Eventos Imutáveis)
CREATE TABLE IF NOT EXISTS public.historico_tramitacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id UUID NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
    origem_sistema public.origem_sistema NOT NULL,
    data_hora_evento TIMESTAMPTZ NOT NULL,
    unidade_setor TEXT NOT NULL,
    descricao_andamento TEXT NOT NULL,
    documento_anexado TEXT NULL,
    tipo_documento TEXT NULL, -- Ex: 'Parecer Jurídico', 'Termo de Referência', 'DFD'
    resumo_ia TEXT NULL,
    hash_evento TEXT NOT NULL, -- SHA256 para idempotência estrita
    metadados JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_processo_evento_hash UNIQUE (processo_id, hash_evento)
);

CREATE INDEX IF NOT EXISTS idx_tramitacoes_processo_data ON public.historico_tramitacoes (processo_id, data_hora_evento DESC);
CREATE INDEX IF NOT EXISTS idx_tramitacoes_origem ON public.historico_tramitacoes (origem_sistema);

-- 7. TABELA: alertas_configurados
CREATE TABLE IF NOT EXISTS public.alertas_configurados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.perfis_usuarios(id) ON DELETE CASCADE,
    processo_id UUID NULL REFERENCES public.processos(id) ON DELETE CASCADE,
    unidade_id UUID NULL REFERENCES public.unidades_organizacionais(id) ON DELETE CASCADE,
    tipo public.tipo_gatilho_alerta NOT NULL,
    parametros JSONB NOT NULL DEFAULT '{}'::jsonb,
    notificar_email BOOLEAN NOT NULL DEFAULT TRUE,
    notificar_sistema BOOLEAN NOT NULL DEFAULT TRUE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_alertas_usuario ON public.alertas_configurados (usuario_id);
CREATE INDEX IF NOT EXISTS idx_alertas_processo ON public.alertas_configurados (processo_id);

-- 8. TABELA: notificacoes_log
CREATE TABLE IF NOT EXISTS public.notificacoes_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.perfis_usuarios(id) ON DELETE CASCADE,
    processo_id UUID NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
    alerta_id UUID NULL REFERENCES public.alertas_configurados(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    enviado_email BOOLEAN NOT NULL DEFAULT FALSE,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    lida_em TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_lida ON public.notificacoes_log (usuario_id, lida);

-- 9. TABELA: sessoes_coletor (Segurança de Sessão para Scraping - Acesso apenas Service Role)
CREATE TABLE IF NOT EXISTS public.sessoes_coletor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sistema TEXT NOT NULL UNIQUE, -- 'SEI', 'STARTGOV', 'PNCP'
    cookies_cifrados TEXT NOT NULL,
    token_sessao TEXT NULL,
    expira_em TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'ATIVA',
    tentativas_falha INT NOT NULL DEFAULT 0,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 10. TABELA: notas_internas (RF15 - Lei de Acesso à Informação 12.527/2011)
CREATE TABLE IF NOT EXISTS public.notas_internas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id UUID NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
    autor_id UUID NOT NULL REFERENCES public.perfis_usuarios(id) ON DELETE RESTRICT,
    conteudo TEXT NOT NULL,
    versao INT NOT NULL DEFAULT 1,
    nota_original_id UUID REFERENCES public.notas_internas(id),
    aviso_lai TEXT NOT NULL DEFAULT 'Informação pública sujeita à Lei nº 12.527/2011 (LAI). Retificações preservam versões anteriores sem exclusão.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_notas_processo ON public.notas_internas (processo_id, versao);

-- 11. TABELA: auditoria_log (Trilha LGPD e Segurança - ASVS Nível 2)
CREATE TABLE IF NOT EXISTS public.auditoria_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.perfis_usuarios(id) ON DELETE SET NULL,
    acao TEXT NOT NULL,
    entidade TEXT NOT NULL,
    entidade_id TEXT NOT NULL,
    ip_origem TEXT NULL,
    dados JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON public.auditoria_log (usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidade ON public.auditoria_log (entidade, entidade_id);

-- ==============================================================================
-- 12. FUNÇÕES AUXILIARES E TRIGGERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_unidades_updated ON public.unidades_organizacionais;
CREATE TRIGGER trg_unidades_updated BEFORE UPDATE ON public.unidades_organizacionais
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_perfis_updated ON public.perfis_usuarios;
CREATE TRIGGER trg_perfis_updated BEFORE UPDATE ON public.perfis_usuarios
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_processos_updated ON public.processos;
CREATE TRIGGER trg_processos_updated BEFORE UPDATE ON public.processos
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_alertas_updated ON public.alertas_configurados;
CREATE TRIGGER trg_alertas_updated BEFORE UPDATE ON public.alertas_configurados
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para computar o caminho_hierarquico automaticamente
CREATE OR REPLACE FUNCTION public.calcular_caminho_hierarquico()
RETURNS TRIGGER AS $$
DECLARE
    parent_caminho TEXT;
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.caminho_hierarquico = NEW.sigla;
    ELSE
        SELECT caminho_hierarquico INTO parent_caminho
        FROM public.unidades_organizacionais
        WHERE id = NEW.parent_id;

        IF parent_caminho IS NOT NULL THEN
            NEW.caminho_hierarquico = parent_caminho || '.' || NEW.sigla;
        ELSE
            NEW.caminho_hierarquico = NEW.sigla;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_unidades_caminho ON public.unidades_organizacionais;
CREATE TRIGGER trg_unidades_caminho BEFORE INSERT OR UPDATE OF sigla, parent_id ON public.unidades_organizacionais
FOR EACH ROW EXECUTE FUNCTION public.calcular_caminho_hierarquico();

-- Função auxiliar de contexto do usuário atual autenticado
CREATE OR REPLACE FUNCTION public.get_user_context()
RETURNS TABLE (
    user_id UUID,
    role public.user_role,
    unidade_id UUID,
    caminho_hierarquico TEXT
) LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS user_id,
        p.role,
        p.unidade_id,
        u.caminho_hierarquico
    FROM public.perfis_usuarios p
    JOIN public.unidades_organizacionais u ON u.id = p.unidade_id
    WHERE p.id = auth.uid() AND p.ativo = TRUE;
END;
$$;

-- ==============================================================================
-- 13. POLÍTICAS DE ROW LEVEL SECURITY (RLS) - CONTROLE DE ACESSO HIERÁRQUICO
-- Hierarquia: SECRETARIO > SUBSECRETARIO > SECRETARIO_ADJUNTO > SUPERINTENDENTE > SUPERVISOR > ASSESSOR / TECNICO
-- ==============================================================================

ALTER TABLE public.unidades_organizacionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_tramitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_configurados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessoes_coletor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_internas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_log ENABLE ROW LEVEL SECURITY;

-- 13.1 Políticas para unidades_organizacionais
CREATE POLICY "Leitura de unidades por usuários autenticados"
ON public.unidades_organizacionais FOR SELECT
TO authenticated
USING (ativo = TRUE);

CREATE POLICY "Admin gerencia unidades"
ON public.unidades_organizacionais FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.get_user_context() ctx WHERE ctx.role = 'ADMIN')
);

-- 13.2 Políticas para perfis_usuarios
CREATE POLICY "Usuário consulta seu próprio perfil"
ON public.perfis_usuarios FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admin consulta todos os perfis"
ON public.perfis_usuarios FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.get_user_context() ctx WHERE ctx.role = 'ADMIN')
);

CREATE POLICY "Admin gerencia perfis"
ON public.perfis_usuarios FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.get_user_context() ctx WHERE ctx.role = 'ADMIN')
);

-- 13.3 Políticas para processos (RBAC + Herança Completa no Organograma)
CREATE POLICY "Visualização de processos por hierarquia e unidade"
ON public.processos FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.get_user_context() ctx
        JOIN public.unidades_organizacionais u_origem ON u_origem.id = public.processos.unidade_origem_id
        WHERE
            -- 1. ADMIN, AUDITOR, SECRETÁRIO DE ESTADO e SUBSECRETÁRIO: Visão global de toda a SEDUC
            ctx.role IN ('ADMIN', 'AUDITOR', 'SECRETARIO', 'SUBSECRETARIO')
            -- 2. SECRETÁRIO ADJUNTO: Vê toda a Secretaria Adjunta e todas as Superintendências, Supervisões e Setores subordinados
            OR (
                ctx.role = 'SECRETARIO_ADJUNTO'
                AND (
                    u_origem.caminho_hierarquico LIKE ctx.caminho_hierarquico || '%'
                    OR processos.unidade_origem_id = ctx.unidade_id
                )
            )
            -- 3. SUPERINTENDENTE: Vê sua Superintendência e todas as Supervisões subordinadas por herança de prefixo
            OR (
                ctx.role = 'SUPERINTENDENTE'
                AND (
                    u_origem.caminho_hierarquico LIKE ctx.caminho_hierarquico || '%'
                    OR processos.unidade_origem_id = ctx.unidade_id
                )
            )
            -- 4. SUPERVISOR: Vê processos originados na sua Supervisão ou setores subordinados
            OR (
                ctx.role = 'SUPERVISOR'
                AND (
                    processos.unidade_origem_id = ctx.unidade_id
                    OR u_origem.caminho_hierarquico LIKE ctx.caminho_hierarquico || '%'
                )
            )
            -- 5. ASSESSOR: Vê processos de sua Assessoria/Setor ou que atualmente tramitam por ela
            OR (
                ctx.role = 'ASSESSOR'
                AND (
                    processos.unidade_origem_id = ctx.unidade_id
                    OR u_origem.caminho_hierarquico LIKE ctx.caminho_hierarquico || '%'
                    OR processos.unidade_atual_sei = (SELECT sigla FROM public.unidades_organizacionais WHERE id = ctx.unidade_id)
                )
            )
            -- 6. TÉCNICO: Vê processos da sua unidade direta de lotação
            OR (
                ctx.role = 'TECNICO'
                AND processos.unidade_origem_id = ctx.unidade_id
            )
    )
);

CREATE POLICY "Service Role e Admin gerenciam processos"
ON public.processos FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.get_user_context() ctx WHERE ctx.role = 'ADMIN')
);

-- 13.4 Políticas para historico_tramitacoes (Herda permissão de processos)
CREATE POLICY "Visualizar tramitações de processos permitidos"
ON public.historico_tramitacoes FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.processos p
        WHERE p.id = public.historico_tramitacoes.processo_id
    )
);

-- 13.5 Políticas para sessoes_coletor (RESTRIÇÃO ESTRITA - Apenas Service Role do Worker)
CREATE POLICY "Apenas Service Role lê sessões do coletor"
ON public.sessoes_coletor FOR ALL
TO service_role
USING (TRUE)
WITH CHECK (TRUE);

-- 13.6 Políticas para alertas e notificações
CREATE POLICY "Usuário gerencia seus próprios alertas"
ON public.alertas_configurados FOR ALL
TO authenticated
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

-- 13.7 Políticas para notas_internas (RF15 - Sem exclusão física)
CREATE POLICY "Visualizar notas de processos autorizados"
ON public.notas_internas FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.processos p
        WHERE p.id = public.notas_internas.processo_id
    )
);

CREATE POLICY "Inserir nota interna vinculada ao autor"
ON public.notas_internas FOR INSERT
TO authenticated
WITH CHECK (
    autor_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.processos p
        WHERE p.id = public.notas_internas.processo_id
    )
);

-- 13.8 Políticas para auditoria_log
CREATE POLICY "Admin consulta auditoria"
ON public.auditoria_log FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.get_user_context() ctx WHERE ctx.role = 'ADMIN')
);

CREATE POLICY "Registro de auditoria pelo sistema"
ON public.auditoria_log FOR INSERT
TO authenticated
WITH CHECK (usuario_id = auth.uid() OR usuario_id IS NULL);

-- ==============================================================================
-- 14. SEED DATA OFICIAL - ORGANOGRAMA SEDUC-MA (22/06/2026)
-- ==============================================================================

-- 1. Nível Central (Secretaria e Subsecretaria)
INSERT INTO public.unidades_organizacionais (id, nome, sigla, tipo, parent_id, caminho_hierarquico, titular_nome)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Secretaria de Estado da Educação do Maranhão', 'SEDUC', 'SECRETARIA', NULL, 'SEDUC', 'Jandira Dias Araújo Silva'),
    ('00000000-0000-0000-0000-000000000002', 'Subsecretaria de Educação', 'SUBSEDUC', 'SUBSECRETARIA', '00000000-0000-0000-0000-000000000001', 'SEDUC.SUBSEDUC', 'José Antônio Barros Heluy'),
    ('00000000-0000-0000-0000-000000000003', 'Chefia de Gabinete', 'GAB', 'SETOR', '00000000-0000-0000-0000-000000000001', 'SEDUC.GAB', 'Aleya de Cassia Pereira Pires Pantoja'),
    ('00000000-0000-0000-0000-000000000004', 'Assessoria Jurídica', 'ASJUR', 'ASSESSORIA', '00000000-0000-0000-0000-000000000001', 'SEDUC.ASJUR', 'Valter Pereira Veras Neto'),
    ('00000000-0000-0000-0000-000000000005', 'Assessoria de Comunicação', 'ASCOM', 'ASSESSORIA', '00000000-0000-0000-0000-000000000001', 'SEDUC.ASCOM', 'Igor Vinicius Gomes Linhares'),
    ('00000000-0000-0000-0000-000000000006', 'Assessoria de Planejamento e Ações Estratégicas', 'ASPLAN', 'ASSESSORIA', '00000000-0000-0000-0000-000000000001', 'SEDUC.ASPLAN', 'Fabiane Cristine Froz Sousa'),
    ('00000000-0000-0000-0000-000000000007', 'Ouvidoria', 'E-OUV', 'SETOR', '00000000-0000-0000-0000-000000000001', 'SEDUC.E-OUV', 'Samira Simas de S. Lobão'),
    ('00000000-0000-0000-0000-000000000008', 'Fundo Estadual de Educação', 'FEE', 'SETOR', '00000000-0000-0000-0000-000000000001', 'SEDUC.FEE', 'José Adriano C. de S. Campelo'),
    ('00000000-0000-0000-0000-000000000009', 'Comissão Setorial de Licitação', 'CSL', 'COMISSAO', '00000000-0000-0000-0000-000000000001', 'SEDUC.CSL', 'Igor Manuel Sousa Rocha'),
    ('00000000-0000-0000-0000-000000000010', 'Comissão Permanente de Tomada de Contas Especial', 'CPTCE', 'COMISSAO', '00000000-0000-0000-0000-000000000001', 'SEDUC.CPTCE', 'Antonia do Espírito Santo da Silva Hortegal'),
    ('00000000-0000-0000-0000-000000000011', 'Comissão de Processo Administrativo e Disciplinar', 'CPAD', 'COMISSAO', '00000000-0000-0000-0000-000000000001', 'SEDUC.CPAD', 'Dilson Dias Sá')
ON CONFLICT (sigla) DO NOTHING;

-- 2. Secretarias Adjuntas
INSERT INTO public.unidades_organizacionais (id, nome, sigla, tipo, parent_id, caminho_hierarquico, titular_nome)
VALUES
    ('00000000-0000-0000-0000-000000000020', 'Secretaria Adjunta de Orçamento, Finanças e Contabilidade', 'SAOFC', 'SECRETARIA_ADJUNTA', '00000000-0000-0000-0000-000000000001', 'SEDUC.SAOFC', 'Igor de Souza Carneiro da Costa'),
    ('00000000-0000-0000-0000-000000000021', 'Secretaria Adjunta de Administração', 'SAAD', 'SECRETARIA_ADJUNTA', '00000000-0000-0000-0000-000000000001', 'SEDUC.SAAD', 'Luzivete Botelho da Silva Rodrigues'),
    ('00000000-0000-0000-0000-000000000022', 'Secretaria Adjunta de Gestão de Pessoas', 'SAGEP', 'SECRETARIA_ADJUNTA', '00000000-0000-0000-0000-000000000001', 'SEDUC.SAGEP', 'Vitor Pflueger Pereira dos Santos'),
    ('00000000-0000-0000-0000-000000000023', 'Secretaria Adjunta de Gestão da Rede do Ensino e da Aprendizagem', 'SAGEA', 'SECRETARIA_ADJUNTA', '00000000-0000-0000-0000-000000000001', 'SEDUC.SAGEA', 'Francisco de Assis Costa Filho'),
    ('00000000-0000-0000-0000-000000000024', 'Secretaria Adjunta de Educação Profissional e Inclusão Social', 'SAEP', 'SECRETARIA_ADJUNTA', '00000000-0000-0000-0000-000000000001', 'SEDUC.SAEP', 'Sonia Maria da Silva Maciela'),
    ('00000000-0000-0000-0000-000000000025', 'Secretaria Adjunta de Educação dos Povos Indígenas', 'SAPI', 'SECRETARIA_ADJUNTA', '00000000-0000-0000-0000-000000000001', 'SEDUC.SAPI', 'Cintia Maria Santana da Silva'),
    ('00000000-0000-0000-0000-000000000026', 'Secretaria Adjunta da Região dos Cocais', 'SARCOC', 'SECRETARIA_ADJUNTA', '00000000-0000-0000-0000-000000000001', 'SEDUC.SARCOC', 'Suely Almeida Mendes')
ON CONFLICT (sigla) DO NOTHING;

-- 3. Superintendências de SAAD (Administração)
INSERT INTO public.unidades_organizacionais (id, nome, sigla, tipo, parent_id, caminho_hierarquico, titular_nome)
VALUES
    ('00000000-0000-0000-0000-000000000030', 'Superintendência de Tecnologia da Informação', 'STI', 'SUPERINTENDENCIA', '00000000-0000-0000-0000-000000000021', 'SEDUC.SAAD.STI', 'Roberto Max Louzeiro Pimentel'),
    ('00000000-0000-0000-0000-000000000031', 'Superintendência de Infraestrutura', 'SUINFRA', 'SUPERINTENDENCIA', '00000000-0000-0000-0000-000000000021', 'SEDUC.SAAD.SUINFRA', 'Núbia Cristina Furtado Theodoro'),
    ('00000000-0000-0000-0000-000000000032', 'Superintendência de Suprimentos', 'SUPRI', 'SUPERINTENDENCIA', '00000000-0000-0000-0000-000000000021', 'SEDUC.SAAD.SUPRI', 'Jaqueline Jansen Pereira'),
    ('00000000-0000-0000-0000-000000000033', 'Superintendência de Logística', 'SUPERLOG', 'SUPERINTENDENCIA', '00000000-0000-0000-0000-000000000021', 'SEDUC.SAAD.SUPERLOG', 'Carlos Eduardo da Costa Santos')
ON CONFLICT (sigla) DO NOTHING;

-- 4. Supervisões da STI (Tecnologia da Informação)
INSERT INTO public.unidades_organizacionais (id, nome, sigla, tipo, parent_id, caminho_hierarquico, titular_nome)
VALUES
    ('00000000-0000-0000-0000-000000000040', 'Supervisão de Desenvolvimento e Manutenção de Sistemas', 'SUDES', 'SUPERVISAO', '00000000-0000-0000-0000-000000000030', 'SEDUC.SAAD.STI.SUDES', 'Sérvulo José Freire Junior'),
    ('00000000-0000-0000-0000-000000000041', 'Supervisão de Redes', 'SUPREDES', 'SUPERVISAO', '00000000-0000-0000-0000-000000000030', 'SEDUC.SAAD.STI.SUPREDES', 'Marcos Camilo Freitas'),
    ('00000000-0000-0000-0000-000000000042', 'Supervisão de Gerenciamento de Chamados', 'SUGEC', 'SUPERVISAO', '00000000-0000-0000-0000-000000000030', 'SEDUC.SAAD.STI.SUGEC', 'Daniela Etsuko Miwa Ramos'),
    ('00000000-0000-0000-0000-000000000043', 'Supervisão de Manutenção de Equipamentos e Softwares', 'SUMES', 'SUPERVISAO', '00000000-0000-0000-0000-000000000030', 'SEDUC.SAAD.STI.SUMES', 'Equipe Técnica STI')
ON CONFLICT (sigla) DO NOTHING;

-- 5. Superintendências e Supervisões de SAOFC (Orçamento e Finanças)
INSERT INTO public.unidades_organizacionais (id, nome, sigla, tipo, parent_id, caminho_hierarquico, titular_nome)
VALUES
    ('00000000-0000-0000-0000-000000000050', 'Superintendência de Orçamento e Finanças', 'SUPORFI', 'SUPERINTENDENCIA', '00000000-0000-0000-0000-000000000020', 'SEDUC.SAOFC.SUPORFI', 'Silviana Maria Athan Fernandes'),
    ('00000000-0000-0000-0000-000000000051', 'Supervisão de Orçamento', 'SUORC', 'SUPERVISAO', '00000000-0000-0000-0000-000000000050', 'SEDUC.SAOFC.SUPORFI.SUORC', 'Edleusa Gomes Santos Martins'),
    ('00000000-0000-0000-0000-000000000052', 'Supervisão Financeira', 'SUFIN', 'SUPERVISAO', '00000000-0000-0000-0000-000000000050', 'SEDUC.SAOFC.SUPORFI.SUFIN', 'Equipe SUFIN'),
    ('00000000-0000-0000-0000-000000000053', 'Supervisão Contábil', 'SUCONT', 'SUPERVISAO', '00000000-0000-0000-0000-000000000050', 'SEDUC.SAOFC.SUPORFI.SUCONT', 'Equipe SUCONT'),
    ('00000000-0000-0000-0000-000000000054', 'Superintendência de Contratos, Convênios e Prestação de Contas', 'SUPECON', 'SUPERINTENDENCIA', '00000000-0000-0000-0000-000000000020', 'SEDUC.SAOFC.SUPECON', 'Camila Pimentel Fernandes Andrade'),
    ('00000000-0000-0000-0000-000000000055', 'Supervisão de Contratos e Convênios', 'SUCONV', 'SUPERVISAO', '00000000-0000-0000-0000-000000000054', 'SEDUC.SAOFC.SUPECON.SUCONV', 'Michele Oliveira Pacheco'),
    ('00000000-0000-0000-0000-000000000056', 'Supervisão de Prestação de Contas', 'SUPC', 'SUPERVISAO', '00000000-0000-0000-0000-000000000054', 'SEDUC.SAOFC.SUPECON.SUPC', 'Júlio Vinícius Montelo Correa')
ON CONFLICT (sigla) DO NOTHING;

-- Inserção de Processos de Demonstração
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

-- Inserção de Histórico de Tramitações
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
    'Autuação do processo administrativo e emissão do DFD nº 12/2026 por Sérvulo José Freire Junior',
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
    'Especificação técnica aprovada por Roberto Max Louzeiro Pimentel para 120 switches gerenciáveis.',
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
    'Processo publicado no StartGov vinculado ao SEI-021001/004521/2026 por Igor Manuel Sousa Rocha.',
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
