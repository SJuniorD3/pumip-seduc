# Runbook Operacional: RB-03 - Ciclo de Vida e Renovação de Certificados mTLS

**Código do Procedimento:** `RB-03-MTLS-CERTIFICADOS`  
**Severidade:** Crítica (P1) quando expirado  
**Equipe Responsável:** Segurança da Informação (STI) & Operações PUMIP  
**Última Revisão:** 19/10/2026 (Auditoria Técnica)

---

## 1. Descrição do Incidente
A comunicação segura entre o conector do SEI! / StartGov e a infraestrutura do Governo do Maranhão exige autenticação mútua (mTLS) via certificado digital ICP-Brasil emitido pela ATI-MA. Se o certificado expirar ou for revogado, as requisições SOAP/REST serão rejeitadas com erro `SSL: CERTIFICATE_VERIFY_FAILED` ou `HTTP 403 Forbidden`.

## 2. Monitoramento Preventivo (SLA de Alerta)
- O PUMIP avalia a validade dos certificados no banner `/admin/integracoes`.
- Quando faltarem menos de 30 dias para o vencimento, o banner exibe alerta âmbar.
- Com menos de 7 dias, o alerta torna-se vermelho e dispara e-mail para `admin@seduc.ma.gov.br`.

## 3. Procedimento de Renovação Passo a Passo
1. **Emissão de Novo Certificado:**
   Solicitar à ATI-MA novo certificado ICP-Brasil do tipo A1 (formato `.pfx` ou `.p12`) emitido para a SEDUC.
2. **Extração da Chave e Certificado PEM:**
   Converta o arquivo PKCS#12 recebido:
   ```bash
   # Extrair certificado público
   openssl pkcs12 -in seduc_pumip_2026.pfx -clcerts -nokeys -out sei_client.crt
   # Extrair chave privada RSA (sem senha para o worker)
   openssl pkcs12 -in seduc_pumip_2026.pfx -nocerts -nodes -out sei_client.key
   ```
3. **Atualização Segura de Segredos no Ambiente:**
   NUNCA armazene os arquivos no git ou no banco.
   No cluster Kubernetes / Supabase Vault / Secrets Manager:
   ```bash
   kubectl create secret generic pumip-mtls-certs \
     --from-file=client.crt=sei_client.crt \
     --from-file=client.key=sei_client.key \
     --dry-run=client -o yaml | kubectl apply -f -
   ```
4. **Verificação Pós-Implantação:**
   Reinicie o worker e valide se a chamada de teste retorna `SUCCESS` ou `NO_CHANGE`:
   ```bash
   curl -s http://localhost:3000/api/saude | jq .conectores_worker
   ```
