# Relatório de Impacto à Proteção de Dados Pessoais (RIPD / LGPD)
## PUMIP-SEDUC: Plataforma Unificada de Monitoramento e Inteligência Processual

**Controlador:** Secretaria de Estado da Educação do Maranhão (SEDUC-MA)  
**Operador:** Superintendência de Tecnologia da Informação (STI / SEDUC-MA)  
**Encarregado de Dados (DPO):** Ouvidoria e Governança SEDUC-MA (`dpo@seduc.ma.gov.br`)  
**Data do Relatório:** 19 de Outubro de 2026  
**Versão do Sistema:** 2.0.0 (Auditoria Técnica Especializada)  
**Conformidade Legal:** Lei Federal nº 13.709/2018 (LGPD) e Lei Federal nº 14.133/2021 (NLLC)

---

## 1. Identificação dos Dados Tratados no Ecossistema

O PUMIP trata dados estritamente necessários para o exercício de competências legais e cumprimento de atribuições do serviço público de educação:

| Categoria de Dado | Exemplos Concretos | Finalidade Primária | Sensibilidade |
| :--- | :--- | :--- | :--- |
| **Dados Funcionais de Servidores** | Nome completo, cargo/título, e-mail institucional (@seduc.ma.gov.br), unidade de lotação | Controle de acesso via RLS, autenticação e atribuição de responsabilidades processuais | Dado Pessoal Comum |
| **Identificadores Processuais** | Número de protocolo SEI, identificador StartGov, chave de contrato PNCP | Rastreamento do ciclo de compras e obras escolares | Dado Público Institucional |
| **Anotações Internas de Instrução** | Comentários e despachos operacionais registrados por servidores | Comunicação interna intersetorial entre unidades instruidoras | Dado Funcional Interno |
| **Metadados de Auditoria** | Endereço IP institucional, carimbo de data/hora UTC, ID do usuário autenticado | Trilha de auditoria imutável contra acessos indevidos | Dado de Segurança |

> **Nota de Conformidade:** O PUMIP **NÃO** coleta nem processa dados pessoais sensíveis (origem racial, convicção religiosa, dados de saúde, biométricos ou genéticos), em observância ao Art. 11 da LGPD.

---

## 2. Bases Legais e Hipóteses de Tratamento (Art. 7º da LGPD)

O tratamento de dados no âmbito do PUMIP fundamenta-se nas seguintes hipóteses legais:
1. **Art. 7º, Inciso II:** Cumprimento de obrigação legal ou regulatória pelo controlador (Lei Federal nº 14.133/2021, Lei de Acesso à Informação nº 12.527/2011 e Lei Estadual nº 8.959/2009).
2. **Art. 7º, Inciso III:** Pela administração pública, para o tratamento e uso compartilhado de dados necessários à execução de políticas públicas previstas em leis e regulamentos.

---

## 3. Medidas Técnicas e Organizacionais de Segurança Implementadas

Em atendimento ao Art. 46 da LGPD e às recomendações da auditoria técnica `@Cpacesso`:

1. **Mascaramento e Minimização nos Registros de Log:**
   - E-mails institucionais enviados em notificações são obrigatoriamente mascarados nos logs JSON do worker (`servulo.junior@seduc.ma.gov.br` -> `s***@seduc.ma.gov.br`).
   - Dados de seed para testes utilizam exclusivamente personas fictícias padronizadas ("Servidor Exemplo 01").
2. **Isolamento de Acesso e Row Level Security (RLS):**
   - Políticas RLS no PostgreSQL garantem que servidores vejam apenas os processos pertinentes à sua hierarquia administrativa.
   - Proteção estrita server-side com layout blindado impedindo manipulação de privilégios no navegador.
3. **Criptografia e Chaves Criptográficas:**
   - Tráfego HTTPS obrigatório com HSTS (`max-age=63072000; includeSubDomains; preload`).
   - Content Security Policy (CSP) estrito bloqueando injeção de scripts maliciosos (XSS) e clickjacking.
   - Segredos governamentais gerenciados via variáveis de ambiente com criptografia em repouso.
4. **Trilha de Auditoria Imutável (Art. 50 da LGPD):**
   - Gatilho `trg_auditar_processos` com privilégios `SECURITY DEFINER` e `search_path = ''` registrando todas as alterações e concessões de acesso na tabela `auditoria_modificacoes`.

---

## 4. Ciclo de Vida e Retenção dos Dados

- **Período de Retenção de Processos:** Mantidos em conformidade com a Tabela de Temporalidade Documental do Estado do Maranhão (guarda permanente para processos de contratação e prestação de contas aos órgãos de controle externo TCE/TCU).
- **Expiração de Permissões Pontuais:** Concessões temporárias de visualização na tabela `processos_acessos_concedidos` possuem campo `expira_em` com revogação automática após o decurso do prazo fixado.

---

## 5. Direitos dos Titulares (Art. 18 da LGPD)

Os servidores e cidadãos podem exercer seus direitos de confirmação de existência de tratamento, acesso aos dados e correção de informações incompletas através do canal oficial da Ouvidoria da SEDUC-MA (`ouvidoria@seduc.ma.gov.br`) ou diretamente pelo módulo administrativo institucional.
