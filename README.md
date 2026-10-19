# PUMIP-SEDUC: Plataforma Unificada de Monitoramento e Inteligência Processual

> **Secretaria de Estado da Educação do Maranhão (SEDUC-MA)**  
> Sistema de Acompanhamento Integrado de Processos Administrativos e Contratações Públicas.  
> **Arquitetura Web Moderna, Versionada em Git e com Governança por Banco de Dados Relacional (PostgreSQL / Supabase RLS).**

---

## 1. Visão Geral e Matriz de Situação Funcional (DOC-01)

A **PUMIP** consolida em visão integrada o ciclo das demandas da SEDUC-MA que se iniciam na fase interna no **SEI! (GOVMA)** (DFD, ETP, TR) e prosseguem para contratação e licitação no **StartGov**, correlacionando dados com o **PNCP (Portal Nacional de Contratações Públicas)**.

### Matriz de Maturidade dos Módulos:

| Módulo / Funcionalidade | Situação Atual | Próximo Passo Planejado |
| :--- | :---: | :--- |
| **Painel Executivo & KPIs** | ✅ Implementado | Conexão com dados consolidados do banco |
| **Metrô Processual (Linha do Tempo)** | ✅ Implementado | Alimentação contínua via RPC atômica |
| **Quadro Kanban Setorial** | ✅ Implementado | Transição de colunas por evento de tramitação |
| **Controle de SLA e Inércia Processual** | ✅ Implementado | Cálculo unificado (meta 5 dias úteis, São Luís/MA) |
| **Exportação CSV/Excel com Proteção Anti-Injection** | ✅ Implementado | Neutralização de fórmulas maliciosas ativa |
| **Regras de RLS Hierárquico (PostgreSQL)** | ✅ Implementado | Validação estrita por prefixo de caminho (`.`) |
| **Sincronização Atômica via RPC (Worker)** | ✅ Implementado | RPC `registrar_andamento_sincronizacao` (`service_role`) |
| **Automação de CI (GitHub Actions)** | ✅ Implementado | Validação de tipos, ESLint, testes e build |
| **Coleta SEI! WebService SOAP** | ⏳ Planejado | Cadastro de Sistema Integrador junto à ATI-MA |
| **Coleta StartGov API REST** | ⏳ Planejado | Validação de credenciais e rotas de homologação |
| **Coleta PNCP API Pública** | ⏳ Em desenvolvimento | Implementação do coletor de editais e atas |
| **Login Gov.br / Supabase Auth** | ⏳ Em transição | Substituição da emulação demo por `@supabase/ssr` |

---

## 2. Estrutura do Monorepo

```
pumip-seduc/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Esteira de CI: Lint, TypeScript, Testes e Build
│       └── hourly_sync.yml         # Agendamento horário de sincronização do worker
├── supabase/
│   └── migrations/
│       ├── 001_init_schema.sql     # DDL, Organograma, Tabelas e RLS inicial
│       ├── 002_atomic_sync_transaction.sql # Transação atômica inicial
│       └── 003_seguranca_rpc_e_hierarquia.sql # RPC blindada, INVOKER e propagação
├── worker/
│   ├── requirements.txt            # Dependências Python (httpx, pydantic, supabase, cryptography)
│   └── sync_engine.py              # Motor de Coleta com Jitter, Sessão e Delta Hash
├── web/
│   ├── package.json                # Next.js 14.2.25, Tailwind CSS, Lucide Icons, ESLint
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.mjs             # Cabeçalhos HTTP de segurança estritos
│   ├── tests/                      # 27 testes automatizados de segurança, SLA e RLS
│   └── src/
│       ├── app/                    # App Router (Dashboard, Processos, Kanban, Admin, etc.)
│       ├── components/             # Metrô Processual, KanbanBoard, KPICards, ProcessTable
│       └── lib/                    # Supabase Client, Tipos e Funções de SLA
├── .env.example                    # Modelo documentado de variáveis
├── .gitignore
└── README.md
```

---

## 3. Guia de Inicialização do Projeto

### Passo 1: Configurar o Banco no Supabase
1. Crie um projeto no [supabase.com](https://supabase.com).
2. Acesse a aba **SQL Editor** e execute sequencialmente as migrações:
   - [`supabase/migrations/001_init_schema.sql`](supabase/migrations/001_init_schema.sql)
   - [`supabase/migrations/002_atomic_sync_transaction.sql`](supabase/migrations/002_atomic_sync_transaction.sql)
   - [`supabase/migrations/003_seguranca_rpc_e_hierarquia.sql`](supabase/migrations/003_seguranca_rpc_e_hierarquia.sql)

### Passo 2: Executar o Frontend (Next.js)
```bash
cd web
npm install
npm run lint    # Verificação de qualidade de código
npm test        # Suíte de 27 testes automatizados
npm run build   # Compilação de produção
npm start       # Inicia servidor de produção na porta 3000
```
Acesse `http://localhost:3000` para visualizar o Dashboard e o painel administrativo.

### Passo 3: Executar o Motor de Coleta (Worker)
```bash
cd worker
python3 -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
pip install -r requirements.txt
python sync_engine.py
```

---

## 4. Segurança e Conformidade
- **Proteção Anti-Injection (CSV/Excel):** Exportações neutralizam fórmulas maliciosas que iniciam com `=`, `+`, `-`, `@`.
- **Cabeçalhos HTTP:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`.
- **Row Level Security (RLS):** Consultas filtradas diretamente no PostgreSQL com base na lotação do usuário e organograma institucional.
- **Funções de Banco Restritas:** RPC `registrar_andamento_sincronizacao` com execução restrita ao papel `service_role` e `search_path = ''`.
