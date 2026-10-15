# PUMIP-SEDUC: Plataforma Unificada de Monitoramento e Inteligência Processual

> **Secretaria de Estado da Educação do Maranhão (SEDUC-MA)**  
> Sistema de Acompanhamento Integrado de Processos Administrativos e Contratações Públicas.  
> **Arquitetura 100% Online, Versionada em Git e Baseada em Infraestrutura Gratuita (Zero-Cost Stack).**

---

## 1. Visão Geral e Objetivo

A **PUMIP** consolida em uma única tela o ciclo completo das demandas da SEDUC-MA que se iniciam no **SEI! (GOVMA)** (fase interna: DFD, ETP, TR) e prosseguem para a fase de contratação e licitação no **StartGov**, monitorando simultaneamente as publicações legais no **PNCP (Portal Nacional de Contratações Públicas)**.

### Características Principais:
- **Apenas Leitura / Não Invasivo:** Não altera, não assina e não tramita processos nas fontes. Opera estritamente com perfil de consulta.
- **Regra de Não Ampliação de Acesso:** Um usuário jamais visualiza no PUMIP o que não teria acesso no sistema de origem. Aplicado com **Row Level Security (RLS)** no PostgreSQL.
- **Linha do Tempo Híbrida ("Metrô Processual"):** Cor azul para eventos do SEI, cor verde para o StartGov e âmbar para o PNCP.
- **Quadro Kanban Setorial:** Acompanhamento por colunas dinâmicas (Fase Interna SEI &rarr; Instrução/TR &rarr; Análise Jurídica &rarr; Licitação Externa &rarr; Contrato).
- **Stack 100% Gratuita (Zero-Cost):** Vercel + Supabase + GitHub Actions Cron + Resend API.

---

## 2. Estrutura do Monorepo

```
pumip-seduc/
├── .github/
│   └── workflows/
│       └── hourly_sync.yml         # Cron Job gratuito a cada hora no GitHub Actions
├── supabase/
│   └── migrations/
│       └── 001_init_schema.sql     # Esquema DDL, Organograma, RLS e Seed
├── worker/
│   ├── requirements.txt            # Dependências Python (httpx, playwright, supabase)
│   └── sync_engine.py              # Motor de Coleta com Jitter, Sessão e Delta Hash
├── web/
│   ├── package.json                # Next.js 14, Tailwind CSS, Lucide Icons
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── app/                    # App Router (Dashboard, Processos, Kanban, Alertas)
│   │   ├── components/             # Metrô Processual, KanbanBoard, KPICards, ProcessTable
│   │   └── lib/                    # Supabase Client, Tipos e Dados de Homologação
├── .env.example                    # Modelo documentado de variáveis
├── .gitignore
└── README.md
```

---

## 3. Guia de Inicialização do Projeto

### Passo 1: Configurar o Banco no Supabase (Gratuito)
1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e crie um novo projeto (ex: `pumip-seduc-db`).
2. Acesse a aba **SQL Editor** no painel do Supabase.
3. Copie todo o conteúdo do arquivo [`supabase/migrations/001_init_schema.sql`](supabase/migrations/001_init_schema.sql) e execute.
4. O esquema criará o organograma hierárquico da SEDUC-MA, as tabelas com RLS, funções de permissão e dados iniciais de demonstração.

### Passo 2: Executar o Frontend (Next.js 14)
```bash
cd web
npm install
# Configure o .env.local baseado no .env.example se for conectar ao Supabase real
npm run dev
```
Acesse `http://localhost:3000` para visualizar o Dashboard Executivo, o Metrô Processual e o Kanban.

### Passo 3: Executar o Motor de Coleta Localmente (Worker)
```bash
cd worker
python3 -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
python sync_engine.py
```

### Passo 4: Automação Gratuita no GitHub Actions
1. Suba o repositório para o GitHub.
2. Acesse **Settings > Secrets and variables > Actions** e adicione:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `APP_SECRET_ENCRYPTION_KEY`
   - `RESEND_API_KEY`
   - `SEI_USER` e `SEI_PASSWORD`
   - `STARTGOV_USER` e `STARTGOV_PASSWORD`
3. O workflow [`.github/workflows/hourly_sync.yml`](.github/workflows/hourly_sync.yml) executará automaticamente a cada 1 hora.

---

## 4. Conformidade e Segurança
- **LGPD (Lei 13.709/2018):** Coleta restrita a metadados de tramitação pública ou institucional autorizada.
- **LAI (Lei 12.527/2011):** Notas internas registradas como informação oficial, com versão imutável e aviso obrigatório na interface.
- **OWASP ASVS Nível 2:** Políticas RLS impedem vazamentos de processos restritos mesmo em falhas de aplicação.
