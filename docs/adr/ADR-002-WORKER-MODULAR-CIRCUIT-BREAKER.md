# ADR 002: Pacote Modular pumip_worker e Resiliência por Circuit Breaker

**Status:** Aprovado e Implementado  
**Data:** 19/10/2026  
**Decisores:** Arquiteto de Software, Especialista em Confiabilidade (SRE), Time de Dados SEDUC  

---

## 1. Contexto e Problema
O worker de sincronização anterior concentrava mais de 1.100 linhas em um único arquivo monolítico (`sync_engine.py`), misturando scraping sintético de emergência, lógica de parsing, hash temporal volátil (`data_hora` alterando hash desnecessariamente) e conectividade direta com o banco.
Quando um serviço externo ficava indisponível, o worker insistia indefinidamente em requisições, degradando o tempo de ciclo da rodada e correndo risco de bloqueio de IP nos gateways estaduais.

## 2. Decisão Arquitetural
1. **Modularização em Pacote Python:** Criação do pacote formal `pumip_worker/` gerenciado por `pyproject.toml`, separando responsabilidades:
   - `modelos.py`: Estruturas de dados tipadas com dataclasses e Enums (`Processo`, `EventoFonte`, `ResultadoColetaTipo`).
   - `fontes/`: Adaptadores independentes implementando protocolo base (`PNCPFonte`, `SEIWSFonte`, `StartGovFonte`).
   - `vinculacao.py`: Lógica pura de normalização de protocolos administrativos e vinculação com tolerância a formatação.
   - `resiliencia.py`: Padrão Circuit Breaker com limiar de 5 falhas consecutivas e tempo de cooldown configurável por fonte.
   - `repositorio.py`: Camada de persistência isolada com chamadas às RPCs atômicas e gravação de telemetria.
   - `main.py`: Orquestrador com injeção de dependência para execução desacoplada de rede.
2. **Eliminação de Mocks em Produção:** Remoção definitiva de retornos fictícios nos conectores. Fontes aguardando homologação retornam explicitamente `ResultadoColetaTipo.NOT_CONFIGURED` com log informativo.
3. **Estabilidade de Hash:** Exclusão do carimbo temporal `data_hora` do cálculo do hash SHA-256 de detecção de deltas, evitando falsos andamentos quando o conteúdo substantivo do processo não foi alterado.

## 3. Consequências e Benefícios
- **Tolerância a Falhas:** Falhas no SEI ou StartGov não paralisam a coleta de contratos públicos no PNCP.
- **Testabilidade Total:** 100% da lógica de vinculação e avaliação de alertas pode ser testada em 2 milissegundos sem necessidade de mockar soquetes de rede.
- **Auditoria Transparente:** Registro de cada rodada com `execution_id` único correlacionado nos logs estruturados em JSON.
