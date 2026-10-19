# Estimativa de Custos e Dimensionamento de Infraestrutura
## PUMIP-SEDUC: Secretaria de Estado da Educação do Maranhão

**Data de Elaboração:** 19/10/2026  
**Finalidade:** Projeção orçamentária e comparativo de cenários para sustentação do ecossistema PUMIP em escala de 10.000 a 50.000 processos ativos.

---

## 1. Cenário 1: Infraestrutura On-Premise Governamental (Datacenter ATI-MA) - **Recomendado**

Utiliza os recursos de virtualização já contratados pelo Governo do Estado do Maranhão junto à Agência Estadual de Tecnologia da Informação (ATI-MA):

| Componente | Especificação Mínima | Custo Incremental Mensal |
| :--- | :--- | :--- |
| **Banco de Dados (PostgreSQL 16)** | VM 4 vCPUs, 16 GB RAM, 200 GB SSD NVMe | R$ 0,00 (Capacidade interna ATI) |
| **Aplicação Web (Next.js Node 20)** | 2 Instâncias 2 vCPUs, 4 GB RAM (Cluster HA) | R$ 0,00 (Capacidade interna ATI) |
| **Worker Engine (Python 3.12)** | 1 Instância 2 vCPUs, 4 GB RAM | R$ 0,00 (Capacidade interna ATI) |
| **Certificados ICP-Brasil mTLS** | Certificado Digital A1 emitido pela ATI-MA | R$ 0,00 (Emissão institucional) |
| **Disparo de E-mails Transacionais** | Gateway SMTP Institucional `@seduc.ma.gov.br` | R$ 0,00 (Serviço de correio do Estado) |
| **Total Estimado Cenário On-Premise** | — | **R$ 0,00 / mês** |

---

## 2. Cenário 2: Nuvem Pública Governamental (Cloud Híbrida / GovCloud)

Caso a SEDUC opte por manter o PUMIP em nuvem de alta disponibilidade (AWS São Paulo ou Google Cloud São Paulo) com instâncias reservadas de 1 ano:

| Serviço de Nuvem | Especificação Técnica | Custo Mensal Estimado (BRL) |
| :--- | :--- | :--- |
| **Banco Gerenciado (Supabase / RDS)** | Instância db.t4g.xlarge (4 vCPU, 16GB, HA Multi-AZ) | R$ 1.150,00 |
| **Execução Serverless Web & Worker** | 2M execuções/mês (ECS Fargate / Cloud Run) | R$ 420,00 |
| **Armazenamento de Backups e Trilha** | 500 GB S3 Standard + Glacier Deep Archive | R$ 65,00 |
| **WAF e Proteção DDoS Governamental** | AWS WAF / Cloudflare Enterprise Gov | R$ 380,00 |
| **Total Estimado Cenário Nuvem** | — | **~ R$ 2.015,00 / mês** |

---

## 3. Dimensionamento e Volumetria de Dados

- **Taxa de Crescimento Anual:** ~5.000 novos processos de contratação e manutenção escolar/ano.
- **Volume por Processo com Linha do Tempo:** Média de 15 KB por processo e histórico de tramitações.
- **Projeção de Armazenamento para 5 anos:** Menos de 15 GB de dados relacionais e índices.
- **Consumo de Rede:** ~50 GB de tráfego de saída mensal em horários comerciais de expediente.
