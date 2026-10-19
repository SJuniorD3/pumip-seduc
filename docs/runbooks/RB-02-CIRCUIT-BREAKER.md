# Runbook Operacional: RB-02 - Restauração de Circuit Breaker Aberto

**Código do Procedimento:** `RB-02-CIRCUIT-BREAKER`  
**Severidade:** Média (P3)  
**Equipe Responsável:** Engenharia de Confiabilidade (SRE) / PUMIP  
**Última Revisão:** 19/10/2026 (Auditoria Técnica)

---

## 1. Descrição do Incidente
Após 5 falhas consecutivas em um conector externo (SEI, StartGov ou PNCP), o `GerenciadorResiliencia` do worker abre o circuito para a fonte afetada a fim de proteger o sistema contra cascata de falhas e evitar bloqueio por rate limiting nos portais de compras.

## 2. Indicadores de Alarme
- Logs de nível `WARNING` contendo `Circuito aberto para <FONTE>. Coleta suspensa temporariamente.`
- Diagnóstico `/api/saude` reportando `"circuit_breaker": "aberto"`.

## 3. Procedimento de Restauração
1. **Identificar o Motivo das Falhas Recentes:**
   Execute a consulta SQL na tabela de telemetria:
   ```sql
   SELECT execution_id, iniciada_em, duracao_ms, status, detalhes_fontes->'falhas' AS falhas
   FROM public.execucoes_coleta
   ORDER BY iniciada_em DESC
   LIMIT 5;
   ```
2. **Testar a Fonte Manualmente via Playground:**
   Acesse a interface administrativa `/admin/integracoes` na aba "Playground" e execute um teste manual com um protocolo conhecido.
3. **Resetar o Estado do Circuito:**
   Para forçar a transição de volta para o estado `FECHADO` sem reiniciar o processo do worker:
   - Reinicie o pod/worker ou force uma rodada com sucesso:
   ```bash
   PYTHONPATH=worker python -c "
   from pumip_worker.resiliencia import resiliencia_global
   resiliencia_global.registrar_resultado('<FONTE>', sucesso=True)
   print('Circuito resetado com sucesso.')
   "
   ```
4. **Validar Próxima Rodada:**
   Verifique se a rodada seguinte processa os itens pendentes da fila sem erros.
