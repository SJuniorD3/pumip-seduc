# Runbook Operacional: RB-01 - Timeout e Indisponibilidade no Conector SEI!

**Código do Procedimento:** `RB-01-TIMEOUT-SEI`  
**Severidade:** Alta (P2)  
**Equipe Responsável:** Operações SEDUC / STI e Suporte PUMIP  
**Última Revisão:** 19/10/2026 (Auditoria Técnica)

---

## 1. Descrição do Incidente
O worker de sincronização do PUMIP registra sucessivos erros do tipo `TIMEOUT` ou `SOURCE_UNAVAILABLE` ao tentar comunicar com o WebService SOAP do SEI! (`SEIWSFonte`).
Mensagens típicas nos logs JSON:
```json
{"nivel": "WARNING", "fonte": "SEI", "evento": "Falha na chamada SOAP: Read timed out", "circuito": "ABERTO"}
```

## 2. Impacto no Negócio
- Novos despachos e movimentações no SEI deixam de ingressar na Linha do Tempo em tempo real.
- As consultas ao PNCP e StartGov continuam operando normalmente devido ao isolamento do Circuit Breaker por fonte.

## 3. Diagnóstico Passo a Passo
1. Acesse o endpoint de diagnóstico do frontend:
   ```bash
   curl -s http://localhost:3000/api/saude | jq .conectores_worker.sei_ws
   ```
2. Verifique a conectividade de rede institucional com o gateway da ATI-MA:
   ```bash
   curl -vk https://sei.ma.gov.br/sei/ws/SeiWS.php
   ```
3. Inspecione se os certificados client mTLS (`SEI_CERT_PEM` e `SEI_KEY_PEM`) ainda são válidos:
   ```bash
   openssl x509 -in $SEI_CERT_PEM -noout -enddate
   ```

## 4. Ações de Contingência e Mitigação
1. **Ativação de Cooldown Manual:**
   Caso o SEI esteja sob sobrecarga ou manutenção programada, aumente o tempo de cooldown do circuit breaker para evitar pressão no gateway:
   ```bash
   export CB_COOLDOWN_SECONDS=7200 # 2 horas
   ```
2. **Execução sob Demanda de Processos Urgentes:**
   Para processos com prioridade `QUENTE` que necessitam de atualização imediata após a restauração da fonte:
   ```bash
   curl -X POST http://localhost:3000/api/sync \
     -H "Content-Type: application/json" \
     -d '{"processoId": "<UUID_DO_PROCESSO>"}'
   ```
3. **Escalonamento para a ATI-MA:**
   Se a rota da ATI persistir com erro HTTP 500/504 por mais de 30 minutos, abrir chamado prioritário no ServiceDesk da ATI informando o IP de saída do cluster PUMIP.
