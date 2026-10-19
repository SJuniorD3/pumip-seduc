# Política de Segurança da Informação — PUMIP-SEDUC

A **Plataforma Unificada de Monitoramento e Inteligência Processual (PUMIP)** da Secretaria de Estado da Educação do Maranhão (SEDUC-MA) adota o princípio de segurança defensiva, privacidade por padrão (*privacy by design*) e divulgação responsável de vulnerabilidades.

---

## 1. Versões com Suporte Oficial de Segurança

| Componente | Versão | Status de Suporte |
| :--- | :---: | :---: |
| **PUMIP Frontend (Next.js / SSR)** | `2.x` | Suportada com atualizações críticas semanais |
| **PUMIP Worker Engine (Python 3.12)** | `2.x` | Suportada com mitigação contínua |
| **Banco de Dados & Esquema (PostgreSQL / Supabase RLS)** | `PostgreSQL 16` | Suporte oficial ativo |

---

## 2. Reporte Responsável de Vulnerabilidades

Caso você identifique uma fragilidade, brecha de segurança ou exposição involuntária de dados no código ou na infraestrutura da PUMIP:

1. **Não abra issues públicas:** Não relate vulnerabilidades de segurança ou detalhes de exploração diretamente em issues públicas do GitHub ou fóruns abertos.
2. **Canal de Comunicação Seguro:**
   - Envie um relatório técnico detalhado para o time de segurança e governança institucional:  
     📧 **seguranca.ti@seduc.ma.gov.br** com cópia para **sudes@seduc.ma.gov.br**
   - Utilize chave PGP institucional (disponibilizada sob requisição) caso o conteúdo envolva amostras de exploração ou segredos de infraestrutura.
3. **Informações Desejáveis no Relatório:**
   - Descrição detalhada do vetor de vulnerabilidade (ex.: OWASP Top 10, quebra de RLS, injeção, falha de autenticação);
   - Rota, endpoint ou módulo afetado;
   - Passo a passo reprodutível ou prova de conceito mínima (*Proof of Concept - PoC*);
   - Avaliação de impacto potencial sobre a confidencialidade, integridade e disponibilidade dos processos da SEDUC-MA.

---

## 3. Prazos de Triagem e Resposta (SLA)

- **Confirmação de Recebimento:** Até **24 horas úteis**.
- **Avaliação Preliminar e Classificação de Severidade:** Até **3 dias úteis**.
- **Plano de Remediação e Correção Emergencial (Hotfix):**
  - **Crítica / Alta (CVSS >= 7.0):** Até **5 dias úteis**.
  - **Média / Baixa (CVSS < 7.0):** Até o próximo ciclo regular de release (**15 dias úteis**).

---

## 4. Diretrizes Éticas e Divulgação Responsável

Agradecemos a colaboração da comunidade de segurança e pesquisadores independentes. Solicitamos a observância das seguintes diretrizes:
- **Respeito à Privacidade:** Não acesse, exfiltre ou altere dados reais de servidores públicos ou processos administrativos sigilosos.
- **Não Degradação de Serviço:** Não realize ataques de negação de serviço (DoS/DDoS) contra portais e endpoints governamentais (SEI, StartGov, PNCP).
- **Período de Embargo:** Aguarde a confirmação de aplicação do patch corretivo antes de qualquer divulgação pública.
