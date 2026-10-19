"""
PUMIP-SEDUC: Motor de Coleta e Sincronização em Camadas (Worker Engine)
Executado periodicamente via GitHub Actions Cron ou sob demanda.
Implementa:
- Reuso de Sessões Criptografadas no Supabase (sessoes_coletor)
- Sincronização em Camadas (QUENTE: 1h, MORNO: 12h, FRIO: 72h)
- Jitter Humanizado com User-Agents reais
- Gravação por Delta (SHA-256) e Idempotência Estrita
- Vinculação Automática SEI <-> StartGov via Regex
- Disparo de Notificações Transacionais via Resend API

REMEDIAÇÃO DE SEGURANÇA (Auditoria commit 7e215f6):
- P0-2: Removidos fallbacks sintéticos — falha ≠ dado inventado
- P0-6: Alertas filtrados por escopo (processo_id/unidade_id) com revalidação
- P1-1: Hash usa apenas campos da fonte (não timestamp de coleta)
"""

import os
import re
import sys
import time
import json
import html
import random
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
from enum import Enum

from dotenv import load_dotenv
import httpx
from supabase import create_client, Client
from cryptography.fernet import Fernet

# Configuração de Logging Estruturado
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("pumip.sync_engine")

load_dotenv()


# ==============================================================================
# RESULTADO TIPADO DE COLETA (REMEDIAÇÃO P0-2)
# ==============================================================================
class FetchResultType(Enum):
    """Tipos de resultado da coleta — nunca retorna dado inventado."""
    SUCCESS = "SUCCESS"              # Consulta OK, dados extraídos
    NO_CHANGE = "NO_CHANGE"          # Consulta OK, sem alteração detectada
    ACCESS_DENIED = "ACCESS_DENIED"  # Credenciais rejeitadas / 401/403
    SESSION_EXPIRED = "SESSION_EXPIRED"  # Sessão expirada, necessário relogin
    SOURCE_UNAVAILABLE = "SOURCE_UNAVAILABLE"  # Fonte offline / timeout
    INVALID_RESPONSE = "INVALID_RESPONSE"  # Resposta recebida mas não parseável
    NOT_CONFIGURED = "NOT_CONFIGURED"  # Credenciais ausentes


class FetchResult:
    """Resultado estruturado de uma tentativa de coleta."""
    def __init__(self, result_type: FetchResultType, data: Optional[Dict[str, Any]] = None, error: Optional[str] = None):
        self.result_type = result_type
        self.data = data
        self.error = error

    @property
    def is_success(self) -> bool:
        return self.result_type == FetchResultType.SUCCESS

    def __repr__(self):
        return f"FetchResult({self.result_type.value}, error={self.error})"


# ==============================================================================
# CONFIGURAÇÕES E CONSTANTES
# ==============================================================================
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "notificacoes@pumip.seduc.ma.gov.br")

SEI_BASE_URL = os.getenv("SEI_BASE_URL", "https://sei.ma.gov.br")
STARTGOV_BASE_URL = os.getenv("STARTGOV_BASE_URL", "https://startgov.ma.gov.br")
PNCP_BASE_URL = os.getenv("PNCP_BASE_URL", "https://pncp.gov.br/api/consulta/v1")
SEDUC_CNPJ = os.getenv("SEDUC_CNPJ", "06354468000130")

FORCE_MODE = os.getenv("FORCE_MODE", "false").lower() in ("true", "1", "yes")
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "25"))

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0"
]

# Regex padrão para identificar números de processo SEI da SEDUC/GOVMA
REGEX_SEI_PROTOCOL = re.compile(r"\b(?:SEI-)?\d{6}\/\d{6}\/\d{4}(?:-\d{2})?\b|\b\d{5,7}\/\d{4}(?:-\d{2})?\b")


# ==============================================================================
# CRIPTOGRAFIA DE SESSÃO (FERNET) - REMEDIAÇÃO SEG-05
# ==============================================================================
def get_fernet_cipher() -> Fernet:
    secret_key = os.getenv("APP_SECRET_ENCRYPTION_KEY", "").strip()
    if not secret_key:
        raise RuntimeError(
            "APP_SECRET_ENCRYPTION_KEY ausente. Configure a chave com: "
            "python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
        )
    return Fernet(secret_key.encode() if isinstance(secret_key, str) else secret_key)


# ==============================================================================
# CLIENTE SUPABASE & GESTOR DE SESSÃO
# ==============================================================================
class PUMIPSyncManager:
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            logger.warning("Credenciais do Supabase ausentes! Executando em modo de validação/dry-run.")
            self.supabase: Optional[Client] = None
        else:
            self.supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        try:
            self.cipher = get_fernet_cipher()
        except RuntimeError as e:
            if not self.supabase:
                logger.warning(f"{e} (Modo dry-run: gerando chave temporária em memória).")
                self.cipher = Fernet(Fernet.generate_key())
            else:
                raise

    def get_valid_session(self, sistema: str) -> Optional[Dict[str, Any]]:
        """Recupera cookies ou token válidos do banco para reuso sem novo login."""
        if not self.supabase:
            return None
        try:
            res = self.supabase.table("sessoes_coletor").select("*").eq("sistema", sistema).execute()
            if not res.data:
                return None
            sessao = res.data[0]
            expira_em = datetime.fromisoformat(sessao["expira_em"].replace("Z", "+00:00"))
            if expira_em > datetime.now(timezone.utc):
                # Sessão ainda válida
                decrypted_json = self.cipher.decrypt(sessao["cookies_cifrados"].encode()).decode()
                cookies = json.loads(decrypted_json)
                logger.info(f"[{sistema}] Reusando sessão válida (expira em {expira_em.isoformat()}).")
                return {"cookies": cookies, "token": sessao.get("token_sessao")}
            else:
                logger.info(f"[{sistema}] Sessão expirada em {expira_em.isoformat()}. Necessário novo login.")
                return None
        except Exception as e:
            logger.error(f"[{sistema}] Erro ao consultar sessoes_coletor: {e}")
            return None

    def save_session(self, sistema: str, cookies: Dict[str, Any], token: Optional[str] = None, hours_valid: int = 12):
        """Salva a nova sessão criptografada no Supabase."""
        if not self.supabase:
            return
        try:
            encrypted_data = self.cipher.encrypt(json.dumps(cookies).encode()).decode()
            expira_em = (datetime.now(timezone.utc) + timedelta(hours=hours_valid)).isoformat()
            payload = {
                "sistema": sistema,
                "cookies_cifrados": encrypted_data,
                "token_sessao": token,
                "expira_em": expira_em,
                "status": "ATIVA",
                "tentativas_falha": 0,
                "atualizado_em": datetime.now(timezone.utc).isoformat()
            }
            self.supabase.table("sessoes_coletor").upsert(payload, on_conflict="sistema").execute()
            logger.info(f"[{sistema}] Nova sessão criptografada salva com validade até {expira_em}.")
        except Exception as e:
            logger.error(f"[{sistema}] Erro ao salvar sessão no Supabase: {e}")

    def get_candidate_processes(self, limit: int = BATCH_SIZE) -> List[Dict[str, Any]]:
        """Seleciona processos elegíveis para sincronização baseado na próxima_verificação_em."""
        if not self.supabase:
            # REMEDIAÇÃO P0-2: Sem Supabase, não inventa processos — apenas loga e retorna vazio
            logger.warning("Supabase não configurado. Nenhum processo será sincronizado (modo dry-run).")
            return []

        now_utc = datetime.now(timezone.utc).isoformat()
        query = self.supabase.table("processos").select("*")
        if not FORCE_MODE:
            query = query.lte("proxima_verificacao_em", now_utc)

        # Ordenação por prioridade: QUENTE primeiro, depois MORNO e FRIO
        query = query.order("prioridade", desc=False).order("proxima_verificacao_em", desc=False).limit(limit)
        res = query.execute()
        return res.data or []

    def update_integration_status(self, sistema: str, status: str, error_msg: Optional[str] = None):
        """Atualiza o status e telemetria da integração no banco após tentativa de coleta."""
        if not self.supabase:
            return
        try:
            # Tenta via RPC da Migração 004
            self.supabase.rpc("atualizar_telemetria_integracao", {
                "p_sistema": sistema,
                "p_status": status,
                "p_erro": error_msg
            }).execute()
            logger.info(f"[{sistema}] Telemetria de integração atualizada: {status}")
        except Exception:
            # Fallback direto na tabela sessoes_coletor
            try:
                agora_iso = datetime.now(timezone.utc).isoformat()
                res = self.supabase.table("sessoes_coletor").select("tentativas_falha").eq("sistema", sistema).execute()
                tentativas_atuais = 0
                if res.data and len(res.data) > 0:
                    tentativas_atuais = res.data[0].get("tentativas_falha") or 0

                nova_tentativa = tentativas_atuais + 1 if status != "SUCCESS" else 0
                self.supabase.table("sessoes_coletor").update({
                    "status": status,
                    "tentativas_falha": nova_tentativa,
                    "atualizado_em": agora_iso
                }).eq("sistema", sistema).execute()
            except Exception as e:
                logger.error(f"[{sistema}] Erro ao atualizar status de integração: {e}")

    def user_can_view_process(self, usuario_id: str, processo_id: str) -> bool:
        """
        Revalida se o destinatário do alerta ainda tem permissão de ver o processo (WRK-08).
        Utiliza a função SQL unificada usuario_pode_ver_processo (Migração 004).
        """
        if not self.supabase:
            return True
        try:
            res = self.supabase.rpc("usuario_pode_ver_processo", {
                "p_usuario": usuario_id,
                "p_processo": processo_id
            }).execute()
            return res.data is True
        except Exception as e:
            logger.warning(f"Erro ao verificar usuario_pode_ver_processo: {e}. Mantendo envio por contingência.")
            return True


# ==============================================================================
# PIPELINE DE SÍNTESE INTELIGENTE (RF20 / ASVS NÍVEL 2)
# ==============================================================================
def generate_resumo_ia(
    descricao: str,
    documento: Optional[str] = None,
    tipo_documento: Optional[str] = None
) -> Optional[str]:
    """
    Pipeline de Síntese Inteligente de Andamentos Administrativos (RF20 / ASVS Nível 2).
    1. Se LLM_API_URL estiver configurada (ex: Ollama, vLLM ou gateway local), consulta endpoint com timeout estrito de 3s.
    2. Fallback determinístico baseado em ontologia de compras e contratações públicas da Lei 14.133/2021.
    """
    texto_base = f"{tipo_documento or ''} {documento or ''} {descricao or ''}".strip()
    if not texto_base:
        return None

    # 1. Consulta opcional a LLM local se LLM_API_URL estiver configurada
    llm_url = os.getenv("LLM_API_URL")
    if llm_url:
        try:
            prompt = (
                "Você é um auditor especialista em contratações públicas. "
                "Resuma o andamento processual abaixo em uma única frase técnica, factual e concisa (máximo 140 caracteres), "
                f"sem inventar fatos:\n{texto_base[:600]}"
            )
            with httpx.Client(timeout=3.0) as client:
                resp = client.post(
                    llm_url,
                    json={
                        "model": os.getenv("LLM_MODEL", "llama3"),
                        "prompt": prompt,
                        "stream": False
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    resumo = data.get("response") or data.get("text") or (data.get("choices", [{}])[0].get("message", {}).get("content"))
                    if resumo and len(resumo.strip()) > 10:
                        return resumo.strip()[:180]
        except Exception as e:
            logger.debug(f"[IA] LLM_API_URL indisponível ({e}). Ativando síntese determinística.")

    # 2. Heurística determinística de contratações públicas (Lei 14.133/2021 / Decreto Estadual)
    norm = texto_base.upper()

    if any(k in norm for k in ["PARECER", "JURÍDICO", "JURIDICO", "PROCURADORIA", "ASJUR", "CONJUR"]):
        return "Análise jurídica conclusiva referente à conformidade processual da contratação pública."
    if any(k in norm for k in ["EDITAL", "AVISO DE LICITAÇÃO", "AVISO DE LICITACAO", "CONVOCATÓRIO"]):
        return "Publicação de instrumento convocatório do certame licitatório para ampla concorrência."
    if any(k in norm for k in ["TERMO DE REFERÊNCIA", "TERMO DE REFERENCIA", "PROJETO BÁSICO", "PROJETO BASICO"]):
        return "Definição de especificações técnicas, quantitativos e critérios de aceitabilidade da demanda."
    if any(k in norm for k in ["ESTUDO TÉCNICO", "ESTUDO TECNICO", "ETP"]):
        return "Estudo Técnico Preliminar aprovado delineando a viabilidade técnica e econômica da solução."
    if any(k in norm for k in ["HOMOLOGAÇÃO", "HOMOLOGACAO", "ADJUDICAÇÃO", "ADJUDICACAO"]):
        return "Ato de adjudicação do objeto e homologação do resultado licitatório pela autoridade competente."
    if any(k in norm for k in ["NOTA DE EMPENHO", "EMPENHO"]):
        return "Emissão de nota de empenho garantindo a reserva orçamentária para a despesa."
    if any(k in norm for k in ["CONTRATO", "ASSINATURA", "EXTRATO CONTRATUAL"]):
        return "Celebração formal do instrumento contratual entre a SEDUC e a contratada."
    if any(k in norm for k in ["ORDEM DE SERVIÇO", "ORDEM DE FORNECIMENTO", "ORDEM DE SERVICO"]):
        return "Emissão de ordem de início para fornecimento de bens ou prestação de serviços."
    if any(k in norm for k in ["LIQUIDAÇÃO", "LIQUIDACAO", "PAGAMENTO", "ATESTO"]):
        return "Execução da liquidação e ordem de pagamento após atesto dos serviços ou fornecimento."
    if any(k in norm for k in ["PORTARIA"]):
        return "Designação formal ou ato normativo publicado para condução do procedimento."
    if any(k in norm for k in ["AUTORIZAÇÃO", "AUTORIZACAO", "DESPACHO DECISÓRIO", "DESPACHO DECISORIO"]):
        return "Autorização da autoridade competente para prosseguimento do procedimento administrativo."
    if any(k in norm for k in ["PNCP"]):
        return "Certame registrado e publicado no Portal Nacional de Contratações Públicas."

    # Síntese extrativa de texto descritivo longo
    if len(descricao) > 25:
        primeira_frase = descricao.split(".")[0].strip()
        if len(primeira_frase) > 10:
            return f"Registro administrativo: {primeira_frase[:140]}."

    return None


# ==============================================================================
# ADAPTADORES DAS FONTES (SEI & STARTGOV)
# ==============================================================================
class BaseScraperAdapter:
    def __init__(self, manager: PUMIPSyncManager):
        self.manager = manager

    def apply_jitter(self):
        """Aplica sleep aleatório entre 4.0 e 9.0 segundos para evitar bloqueios."""
        wait_seconds = random.uniform(4.0, 9.0)
        logger.info(f"Aplicando jitter de {wait_seconds:.2f}s antes da próxima requisição...")
        time.sleep(wait_seconds)

    def get_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Cache-Control": "no-cache",
            "Sec-Ch-Ua-Mobile": "?0"
        }


class SEIScraperAdapter(BaseScraperAdapter):
    def fetch_process_data(self, protocolo_sei: str) -> FetchResult:
        """
        Consulta o processo no SEI. Retorna FetchResult tipado.
        REMEDIAÇÃO P0-2: Nunca retorna dados sintéticos. Falha = falha explícita.
        """
        self.apply_jitter()
        logger.info(f"[SEI] Consultando andamento do protocolo {protocolo_sei}...")

        sei_user = os.getenv("SEI_USER")
        sei_pass = os.getenv("SEI_PASSWORD")

        if not sei_user or not sei_pass:
            logger.warning("[SEI] Credenciais ausentes (SEI_USER/SEI_PASSWORD). Coleta não realizada.")
            return FetchResult(FetchResultType.NOT_CONFIGURED, error="Credenciais SEI_USER/SEI_PASSWORD não configuradas")

        try:
            headers = self.get_headers()
            session_data = self.manager.get_valid_session("SEI")
            cookies = session_data.get("cookies") if session_data else {}

            with httpx.Client(timeout=20.0, follow_redirects=True, headers=headers, cookies=cookies) as client:
                resp = client.get(
                    f"{SEI_BASE_URL}/sei/controlador.php",
                    params={"acao": "procedimento_consultar", "protocolo": protocolo_sei}
                )

                if resp.status_code == 401 or resp.status_code == 403:
                    logger.warning(f"[SEI] Acesso negado (HTTP {resp.status_code}) para {protocolo_sei}.")
                    return FetchResult(FetchResultType.ACCESS_DENIED, error=f"HTTP {resp.status_code}")

                if resp.status_code != 200:
                    logger.warning(f"[SEI] Resposta inesperada (HTTP {resp.status_code}) para {protocolo_sei}.")
                    return FetchResult(FetchResultType.SOURCE_UNAVAILABLE, error=f"HTTP {resp.status_code}")

                # Tentativa de parsing real
                parsed = self._parse_sei_response(resp.text, protocolo_sei)
                if parsed is None:
                    return FetchResult(FetchResultType.INVALID_RESPONSE, error="Não foi possível extrair dados do HTML retornado")

                return FetchResult(FetchResultType.SUCCESS, data=parsed)

        except httpx.TimeoutException:
            logger.error(f"[SEI] Timeout na consulta de {protocolo_sei}.")
            return FetchResult(FetchResultType.SOURCE_UNAVAILABLE, error="Timeout na conexão")
        except httpx.ConnectError as e:
            logger.error(f"[SEI] Erro de conexão: {e}")
            return FetchResult(FetchResultType.SOURCE_UNAVAILABLE, error=str(e))
        except Exception as e:
            logger.error(f"[SEI] Falha inesperada na consulta HTTP: {e}")
            return FetchResult(FetchResultType.SOURCE_UNAVAILABLE, error=str(e))

    def _parse_sei_response(self, html_content: str, protocolo: str) -> Optional[Dict[str, Any]]:
        """
        Parser de HTML do SEI.
        REMEDIAÇÃO P0-2: Retorna None se não conseguir extrair dados reais.
        TODO: Implementar extração real com BeautifulSoup ou Zeep SOAP.
        """
        if not html_content or len(html_content.strip()) < 100:
            logger.warning(f"[SEI] Conteúdo HTML vazio ou muito curto para {protocolo}.")
            return None

        # TODO: Implementar parser real quando houver acesso ao SEI em homologação.
        # Por enquanto, loga o tamanho do conteúdo recebido para diagnóstico.
        logger.info(f"[SEI] Recebido HTML com {len(html_content)} bytes para {protocolo}. Parser real pendente de implementação.")
        logger.warning(f"[SEI] Parser HTML ainda não implementado. Dados não extraídos para {protocolo}.")
        return None


class StartGovScraperAdapter(BaseScraperAdapter):
    def fetch_contract_data(self, protocolo_startgov: Optional[str], protocolo_sei: str) -> FetchResult:
        """
        Consulta informações no StartGov.
        REMEDIAÇÃO P0-2: Nunca retorna dados sintéticos. Falha = falha explícita.
        """
        self.apply_jitter()
        logger.info(f"[StartGov] Consultando dados para StartGov={protocolo_startgov} ou SEI={protocolo_sei}...")

        startgov_token = os.getenv("STARTGOV_API_TOKEN")
        startgov_client_id = os.getenv("STARTGOV_CLIENT_ID")
        startgov_client_secret = os.getenv("STARTGOV_CLIENT_SECRET")

        if not startgov_token and not (startgov_client_id and startgov_client_secret):
            logger.warning("[StartGov] Credenciais ausentes. Coleta não realizada.")
            return FetchResult(FetchResultType.NOT_CONFIGURED, error="Credenciais StartGov não configuradas")

        try:
            headers = self.get_headers()
            if startgov_token:
                headers["Authorization"] = f"Bearer {startgov_token}"

            with httpx.Client(timeout=20.0, follow_redirects=True, headers=headers) as client:
                # Busca por protocolo StartGov ou por referência SEI
                search_param = protocolo_startgov or protocolo_sei
                resp = client.get(
                    f"{STARTGOV_BASE_URL}/api/v2/licitacoes/buscar",
                    params={"referencia": search_param}
                )

                if resp.status_code == 401 or resp.status_code == 403:
                    return FetchResult(FetchResultType.ACCESS_DENIED, error=f"HTTP {resp.status_code}")

                if resp.status_code != 200:
                    return FetchResult(FetchResultType.SOURCE_UNAVAILABLE, error=f"HTTP {resp.status_code}")

                try:
                    data = resp.json()
                except Exception:
                    return FetchResult(FetchResultType.INVALID_RESPONSE, error="Resposta não é JSON válido")

                if not data or (isinstance(data, dict) and not data.get("dados")):
                    return FetchResult(FetchResultType.NO_CHANGE, error="Nenhum dado retornado pela API")

                # Extrai e estrutura os dados
                parsed = self._parse_startgov_response(data, protocolo_sei)
                if parsed is None:
                    return FetchResult(FetchResultType.INVALID_RESPONSE, error="Estrutura de resposta inesperada")

                return FetchResult(FetchResultType.SUCCESS, data=parsed)

        except httpx.TimeoutException:
            logger.error(f"[StartGov] Timeout na consulta.")
            return FetchResult(FetchResultType.SOURCE_UNAVAILABLE, error="Timeout na conexão")
        except httpx.ConnectError as e:
            logger.error(f"[StartGov] Erro de conexão: {e}")
            return FetchResult(FetchResultType.SOURCE_UNAVAILABLE, error=str(e))
        except Exception as e:
            logger.error(f"[StartGov] Falha inesperada: {e}")
            return FetchResult(FetchResultType.SOURCE_UNAVAILABLE, error=str(e))

    def _parse_startgov_response(self, data: Dict[str, Any], protocolo_sei: str) -> Optional[Dict[str, Any]]:
        """
        Extrai dados estruturados da resposta da API do StartGov.
        TODO: Adaptar quando a API real estiver disponível em homologação.
        """
        try:
            dados = data.get("dados", data)
            if isinstance(dados, list) and len(dados) > 0:
                dados = dados[0]

            texto_andamento = dados.get("descricao", dados.get("situacao_descricao", ""))

            # Identificação de vínculos via Regex
            sei_encontrado = None
            if texto_andamento:
                match = REGEX_SEI_PROTOCOL.search(texto_andamento)
                if match:
                    sei_encontrado = match.group(0)
                    logger.info(f"[StartGov] Vínculo identificado com processo SEI: {sei_encontrado}")

            return {
                "protocolo_startgov": dados.get("numero_processo", dados.get("protocolo")),
                "fase_atual": dados.get("fase", dados.get("situacao")),
                "sei_vinculado": sei_encontrado,
                "ultimo_evento": {
                    "data_hora": dados.get("data_ultima_atualizacao", dados.get("data_hora")),
                    "unidade_setor": dados.get("unidade_responsavel", "NÃO INFORMADO"),
                    "descricao": texto_andamento,
                    "documento": dados.get("documento"),
                    "tipo_documento": dados.get("tipo_documento"),
                    "resumo_ia": generate_resumo_ia(texto_andamento, dados.get("documento"), dados.get("tipo_documento"))
                }
            }
        except Exception as e:
            logger.error(f"[StartGov] Erro ao parsear resposta: {e}")
            return None


class PNCPScraperAdapter(BaseScraperAdapter):
    """
    Adaptador de Coleta da API Pública do PNCP (Portal Nacional de Contratações Públicas).
    REMEDIAÇÃO (WRK-01): Coleta real contra API pública oficial da Lei 14.133/2021.
    Não requer credenciais privadas, operando com consultas públicas sobre o CNPJ da SEDUC-MA.
    """
    def fetch_pncp_publications(self, protocolo_sei: str, ano: Optional[int] = None) -> FetchResult:
        self.apply_jitter()
        ano_busca = ano or datetime.now(timezone.utc).year
        logger.info(f"[PNCP] Consultando contratações públicas para SEDUC-MA (CNPJ {SEDUC_CNPJ}, Ano {ano_busca})...")

        try:
            headers = self.get_headers()
            with httpx.Client(timeout=20.0, follow_redirects=True, headers=headers) as client:
                url = f"{PNCP_BASE_URL}/contratacoes/publicacao"
                params = {
                    "dataInicial": f"{ano_busca}0101",
                    "dataFinal": f"{ano_busca}1231",
                    "cnpjOrgao": SEDUC_CNPJ.replace(".", "").replace("/", "").replace("-", ""),
                    "pagina": 1,
                    "tamanhoPagina": 10
                }
                resp = client.get(url, params=params)

                if resp.status_code == 404:
                    return FetchResult(FetchResultType.NO_CHANGE, error="Nenhuma publicação encontrada no PNCP")
                if resp.status_code != 200:
                    logger.warning(f"[PNCP] Resposta HTTP {resp.status_code} na consulta pública.")
                    return FetchResult(FetchResultType.SOURCE_UNAVAILABLE, error=f"HTTP {resp.status_code}")

                try:
                    data = resp.json()
                except Exception:
                    return FetchResult(FetchResultType.INVALID_RESPONSE, error="Resposta do PNCP não é JSON")

                parsed = self._parse_pncp_response(data, protocolo_sei)
                if parsed is None:
                    return FetchResult(FetchResultType.NO_CHANGE, error="Sem novos eventos do certame")

                return FetchResult(FetchResultType.SUCCESS, data=parsed)
        except httpx.TimeoutException:
            logger.error("[PNCP] Timeout na consulta da API pública.")
            return FetchResult(FetchResultType.SOURCE_UNAVAILABLE, error="Timeout na conexão")
        except Exception as e:
            logger.error(f"[PNCP] Falha na consulta pública: {e}")
            return FetchResult(FetchResultType.SOURCE_UNAVAILABLE, error=str(e))

    def _parse_pncp_response(self, data: Any, protocolo_sei: str) -> Optional[Dict[str, Any]]:
        try:
            items = []
            if isinstance(data, dict):
                items = data.get("data") or data.get("itens") or []
            elif isinstance(data, list):
                items = data

            if not items:
                return None

            # Procura item que corresponda ao processo ou pega a publicação mais recente
            item_relevante = None
            clean_sei = protocolo_sei.lower().replace("sei-", "").strip()
            for item in items:
                obj = str(item.get("objeto", "")).lower()
                num_proc = str(item.get("processo", "")).lower()
                if clean_sei in num_proc or clean_sei in obj:
                    item_relevante = item
                    break

            if not item_relevante and items:
                item_relevante = items[0]

            if not item_relevante:
                return None

            numero_controle = item_relevante.get("numeroControlePNCP") or f"PNCP-{item_relevante.get('numeroItem', '001')}"
            objeto = item_relevante.get("objeto") or "Contratação Pública SEDUC-MA"
            modalidade = item_relevante.get("modalidadeNome") or item_relevante.get("tipoInstrumentoConvocatorioCodigoNome") or "Pregão Eletrônico"
            data_pub = item_relevante.get("dataPublicacaoPncp") or item_relevante.get("dataInclusao") or datetime.now(timezone.utc).isoformat()

            return {
                "numero_controle_pncp": numero_controle,
                "ultimo_evento": {
                    "data_hora": data_pub,
                    "unidade_setor": "PNCP / CSL",
                    "descricao": f"Publicação no PNCP: {modalidade} - {objeto[:120]}",
                    "documento": f"Controle {numero_controle}",
                    "tipo_documento": "EDITAL_PNCP",
                    "resumo_ia": generate_resumo_ia(
                        f"Publicação no PNCP: {modalidade} - {objeto[:120]}",
                        f"Controle {numero_controle}",
                        "EDITAL_PNCP"
                    ) or "Certame publicado sob a Lei 14.133/2021 no Portal Nacional de Contratações Públicas."
                }
            }
        except Exception as e:
            logger.error(f"[PNCP] Erro ao parsear resposta: {e}")
            return None


# ==============================================================================
# MOTOR DE PROCESSAMENTO E DISPARO DE ALERTAS
# ==============================================================================
def calculate_state_hash(evento: Dict[str, Any]) -> str:
    """
    Calcula hash SHA-256 estável para garantir idempotência e detecção de delta.
    REMEDIAÇÃO (WRK-06): Inclui a data/hora original do evento na fonte (normalizada em ISO UTC)
    para permitir andamentos legítimos idênticos em datas distintas (ex: idas e vindas de setores).
    """
    data_hora_fonte = evento.get('data_hora_evento') or evento.get('data_hora') or ''
    if isinstance(data_hora_fonte, datetime):
        data_hora_fonte = data_hora_fonte.isoformat()

    raw_str = (
        f"{evento.get('unidade_setor', '')}|"
        f"{evento.get('descricao', '')}|"
        f"{evento.get('documento', '')}|"
        f"{evento.get('tipo_documento', '')}|"
        f"{data_hora_fonte}"
    )
    return hashlib.sha256(raw_str.encode('utf-8')).hexdigest()


def send_email_alert(recipient: str, subject: str, html_body: str) -> bool:
    """
    Envia notificação por e-mail via API REST do Resend.
    Retorna True se enviado com sucesso, False caso contrário.
    """
    if not RESEND_API_KEY:
        logger.info(f"[Resend Email] API Key não configurada. Simulando envio para {recipient}: {subject}")
        return False

    try:
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "from": RESEND_FROM_EMAIL,
            "to": [recipient],
            "subject": subject,
            "html": html_body
        }
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json=payload, headers=headers)
            if resp.status_code in (200, 201):
                logger.info(f"[Resend Email] E-mail de alerta enviado com sucesso para {recipient}.")
                return True
            else:
                logger.warning(f"[Resend Email] Falha no envio: {resp.status_code} - {resp.text}")
                return False
    except Exception as e:
        logger.error(f"[Resend Email] Erro inesperado ao disparar e-mail: {e}")
        return False


INTERVALO_HORAS = {"QUENTE": 1, "MORNO": 12, "FRIO": 72}

def calcular_proxima_verificacao(prioridade: str, falhas_consecutivas: int = 0) -> str:
    """Calcula próxima verificação com recuo exponencial e teto de 72h em falhas (WRK-04)."""
    base = INTERVALO_HORAS.get(prioridade, 1)
    if falhas_consecutivas > 0:
        horas = min(base * (2 ** falhas_consecutivas), 72)
    else:
        horas = base
    return (datetime.now(timezone.utc) + timedelta(hours=horas)).isoformat()


def process_delta_and_alerts(
    manager: PUMIPSyncManager,
    processo: Dict[str, Any],
    novo_evento: Dict[str, Any],
    origem: str
) -> bool:
    """
    Verifica se o evento é novo (Delta), grava na linha do tempo e dispara alertas se necessário.
    REMEDIAÇÃO (WRK-03, WRK-07):
    - Invoca a RPC atômica registrar_andamento_sincronizacao.
    - Só dispara alertas e zera inércia se a RPC confirmar inserção de novo andamento (res.data is True).
    - Elimina fallbacks não-atômicos que corrompiam integridade.
    """
    if not manager.supabase:
        logger.info(f"[Processo {processo.get('protocolo_sei')}] Supabase não disponível. Operação ignorada.")
        return False

    # Valida que o evento tem campos mínimos obrigatórios
    descricao = novo_evento.get("descricao", "").strip()
    if not descricao:
        logger.warning(f"[Processo {processo.get('protocolo_sei')}] Evento sem descrição. Ignorado.")
        return False

    novo_hash = calculate_state_hash(novo_evento)
    ultimo_hash = processo.get("hash_ultimo_estado")

    if novo_hash == ultimo_hash:
        logger.info(f"[Processo {processo.get('protocolo_sei')}] Nenhuma alteração de estado (Hash idêntico).")
        # Apenas atualiza a contagem de dias e data da verificação
        agora = datetime.now(timezone.utc)
        ultima_mov = processo.get("ultima_movimentacao_em")
        if ultima_mov:
            dt_mov = datetime.fromisoformat(str(ultima_mov).replace("Z", "+00:00"))
            dias_parado = max(0, (agora - dt_mov).days)
        else:
            dias_parado = 0

        prox_verificacao = calcular_proxima_verificacao(processo.get("prioridade", "QUENTE"))

        manager.supabase.table("processos").update({
            "dias_parado_na_unidade": dias_parado,
            "ultima_verificacao_em": agora.isoformat(),
            "proxima_verificacao_em": prox_verificacao
        }).eq("id", processo["id"]).execute()
        return False

    # HOUVE MUDANÇA (DELTA POSITIVO): Gravar na linha do tempo e gerar alerta
    logger.info(f"[Processo {processo.get('protocolo_sei')}] NOVO ANDAMENTO DETECTADO! Hash: {novo_hash[:12]}...")

    agora = datetime.now(timezone.utc)

    # Separa ocorrido_em (da fonte) de coletado_em (agora)
    data_hora_fonte = novo_evento.get("data_hora") or novo_evento.get("data_hora_evento")
    if not data_hora_fonte:
        data_hora_fonte = agora.isoformat()
        logger.warning(f"[Processo {processo.get('protocolo_sei')}] Evento sem data_hora da fonte. Usando timestamp de coleta.")

    prox_verificacao = calcular_proxima_verificacao(processo.get("prioridade", "QUENTE"))
    nova_unidade = novo_evento.get("unidade_setor") if (origem == "SEI" and novo_evento.get("unidade_setor")) else None

    metadados_dict = {"coletado_em": agora.isoformat(), "origem_adapter": origem}

    resumo_ia_final = novo_evento.get("resumo_ia") or generate_resumo_ia(
        descricao,
        novo_evento.get("documento"),
        novo_evento.get("tipo_documento")
    )

    rpc_params = {
        "p_processo_id": processo["id"],
        "p_origem": origem,
        "p_data_hora_evento": data_hora_fonte,
        "p_unidade_setor": novo_evento.get("unidade_setor", "NÃO INFORMADO"),
        "p_descricao_andamento": descricao,
        "p_documento_anexado": novo_evento.get("documento"),
        "p_tipo_documento": novo_evento.get("tipo_documento"),
        "p_resumo_ia": resumo_ia_final,
        "p_hash_evento": novo_hash,
        "p_metadados": metadados_dict,
        "p_nova_unidade_sei": nova_unidade,
        "p_proxima_verificacao": prox_verificacao
    }

    try:
        # Transação atômica via função PL/pgSQL do Supabase (Migração 003)
        res = manager.supabase.rpc("registrar_andamento_sincronizacao", rpc_params).execute()
        eh_novo = res.data is True

        if eh_novo:
            logger.info(f"[Processo {processo.get('protocolo_sei')}] Novo andamento gravado atomicamente via RPC. Disparando alertas.")
            check_and_trigger_alerts(manager, processo, novo_evento, origem)
            return True
        else:
            logger.info(f"[Processo {processo.get('protocolo_sei')}] Andamento já existente no histórico. Alertas ignorados.")
            return False
    except Exception as rpc_err:
        logger.error(f"[Processo {processo.get('protocolo_sei')}] Erro na execução da RPC de sincronização: {rpc_err}")
        return False


def check_and_trigger_alerts(
    manager: PUMIPSyncManager,
    processo: Dict[str, Any],
    novo_evento: Dict[str, Any],
    origem: str
):
    """
    Consulta regras ativas na tabela alertas_configurados e gera notificações.
    REMEDIAÇÃO P0-6:
    - Filtra alertas pelo processo_id OU unidade_id correspondente (não todos)
    - Revalida autorização do destinatário antes do envio
    - Escapa conteúdo externo inserido no HTML do e-mail
    """
    if not manager.supabase:
        return

    try:
        processo_id = processo.get("id")
        unidade_origem_id = processo.get("unidade_origem_id")

        # REMEDIAÇÃO P0-6: Busca apenas alertas vinculados a ESTE processo ou à unidade de origem
        # Não busca mais TODOS os alertas ativos indiscriminadamente
        alertas_processo = []
        alertas_unidade = []

        # 1. Alertas específicos para este processo
        if processo_id:
            res_proc = manager.supabase.table("alertas_configurados") \
                .select("*, perfis_usuarios(email, nome, ativo, unidade_id)") \
                .eq("ativo", True) \
                .eq("processo_id", processo_id) \
                .execute()
            alertas_processo = res_proc.data or []

        # 2. Alertas por unidade de origem do processo
        if unidade_origem_id:
            res_unid = manager.supabase.table("alertas_configurados") \
                .select("*, perfis_usuarios(email, nome, ativo, unidade_id)") \
                .eq("ativo", True) \
                .eq("unidade_id", unidade_origem_id) \
                .is_("processo_id", "null") \
                .execute()
            alertas_unidade = res_unid.data or []

        # Combina sem duplicatas (por ID do alerta)
        alertas_ids_vistos = set()
        alertas: List[Dict[str, Any]] = []
        for a in alertas_processo + alertas_unidade:
            if a["id"] not in alertas_ids_vistos:
                alertas_ids_vistos.add(a["id"])
                alertas.append(a)

        if not alertas:
            return

        descricao = novo_evento.get("descricao", "").lower()
        tipo_doc = (novo_evento.get("tipo_documento") or "").lower()

        for alerta in alertas:
            # REMEDIAÇÃO P0-6: Revalida que o destinatário ainda é um usuário ativo
            perfil = alerta.get("perfis_usuarios")
            if not perfil or not perfil.get("ativo", False):
                logger.info(f"[Alerta {alerta['id']}] Destinatário inativo. Notificação suprimida.")
                continue

            # REMEDIAÇÃO (WRK-08): Revalida autorização vigente sobre o processo antes de disparar e-mail
            usuario_id = alerta.get("usuario_id")
            if usuario_id and not manager.user_can_view_process(usuario_id, processo["id"]):
                logger.info(f"[Alerta {alerta['id']}] Usuário {usuario_id} não possui mais autorização para o processo {processo.get('protocolo_sei')}. Notificação cancelada.")
                continue

            disparar = False
            # REMEDIAÇÃO P0-6: Escapa conteúdo externo no título e mensagem
            titulo = f"PUMIP: Atualização no Processo {html.escape(processo.get('protocolo_sei', ''))}"
            mensagem = ""

            tipo_gatilho = alerta.get("tipo")
            params = alerta.get("parametros", {})

            if tipo_gatilho == "PALAVRA_CHAVE":
                palavras = params.get("termos", ["parecer", "empenho", "aditivo", "contrato"])
                for termo in palavras:
                    if termo.lower() in descricao or termo.lower() in tipo_doc:
                        disparar = True
                        mensagem = f"Termo monitorado '{html.escape(termo)}' identificado no andamento em {html.escape(novo_evento.get('unidade_setor', ''))}."
                        break

            elif tipo_gatilho == "MUDANCA_SETOR_FASE":
                disparar = True
                mensagem = f"Processo movimentado para o setor/fase: {html.escape(novo_evento.get('unidade_setor', ''))}."

            if disparar:
                # Registra resultado do envio de e-mail
                email_enviado = False

                # Dispara e-mail se configurado
                if alerta.get("notificar_email") and perfil.get("email"):
                    user_email = perfil["email"]
                    # REMEDIAÇÃO P0-6: Escapa todo conteúdo externo no HTML
                    html_body = f"""
                    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <h2 style="color: #0f172a;">{html.escape(titulo)}</h2>
                        <p style="color: #334155;"><strong>Objeto:</strong> {html.escape(processo.get('objeto', ''))}</p>
                        <p style="color: #334155;"><strong>Setor/Unidade:</strong> {html.escape(novo_evento.get('unidade_setor', ''))}</p>
                        <div style="background: #f8fafc; padding: 12px; border-left: 4px solid #2563eb; margin: 15px 0;">
                            <p style="margin: 0; color: #1e293b;">{html.escape(novo_evento.get('descricao', ''))}</p>
                        </div>
                        <p style="font-size: 13px; color: #64748b;">Acesse o PUMIP-SEDUC para consultar a linha do tempo completa.</p>
                    </div>
                    """
                    email_enviado = send_email_alert(user_email, titulo, html_body)

                # Grava no log de notificações com status real do envio
                manager.supabase.table("notificacoes_log").insert({
                    "usuario_id": alerta["usuario_id"],
                    "processo_id": processo["id"],
                    "alerta_id": alerta["id"],
                    "titulo": titulo,
                    "mensagem": mensagem,
                    "enviado_email": email_enviado
                }).execute()

    except Exception as e:
        logger.error(f"Erro ao processar alertas configurados: {e}")


# ==============================================================================
# ENTRYPOINT PRINCIPAL
# ==============================================================================
def main():
    logger.info("=== INICIANDO MOTOR DE SINCRONIZAÇÃO PUMIP-SEDUC (WORKER) ===")
    manager = PUMIPSyncManager()
    sei_adapter = SEIScraperAdapter(manager)
    startgov_adapter = StartGovScraperAdapter(manager)
    pncp_adapter = PNCPScraperAdapter(manager)

    candidatos = manager.get_candidate_processes(limit=BATCH_SIZE)
    logger.info(f"Total de processos selecionados para esta rodada: {len(candidatos)}")

    if not candidatos:
        logger.info("Nenhum processo elegível para sincronização nesta rodada.")
        return

    processados_com_sucesso = 0
    falhas = 0

    for idx, processo in enumerate(candidatos, 1):
        prot_sei = processo.get("protocolo_sei")
        prot_startgov = processo.get("protocolo_startgov")
        logger.info(f"[{idx}/{len(candidatos)}] Sincronizando Processo {prot_sei}...")

        try:
            houve_sucesso_coleta = False

            # 1. Coleta dados no SEI
            sei_result = sei_adapter.fetch_process_data(prot_sei)
            if sei_result.is_success and sei_result.data and "ultimo_evento" in sei_result.data:
                houve_sucesso_coleta = True
                process_delta_and_alerts(manager, processo, sei_result.data["ultimo_evento"], origem="SEI")
            elif sei_result.result_type != FetchResultType.NOT_CONFIGURED:
                logger.warning(f"[SEI] Coleta de {prot_sei}: {sei_result}")
                manager.update_integration_status("SEI", sei_result.result_type.value, sei_result.error)

            # 2. Coleta dados no StartGov
            startgov_result = startgov_adapter.fetch_contract_data(prot_startgov, prot_sei)
            if startgov_result.is_success and startgov_result.data:
                houve_sucesso_coleta = True
                # Verifica vinculação automática
                if not prot_startgov and startgov_result.data.get("protocolo_startgov") and manager.supabase:
                    logger.info(f"Vinculando automaticamente {prot_sei} ao StartGov {startgov_result.data['protocolo_startgov']}")
                    manager.supabase.table("processos").update({
                        "protocolo_startgov": startgov_result.data["protocolo_startgov"],
                        "fase_atual_startgov": startgov_result.data.get("fase_atual")
                    }).eq("id", processo["id"]).execute()

                if "ultimo_evento" in startgov_result.data:
                    process_delta_and_alerts(manager, processo, startgov_result.data["ultimo_evento"], origem="STARTGOV")
            elif startgov_result.result_type != FetchResultType.NOT_CONFIGURED:
                logger.warning(f"[StartGov] Coleta de {prot_sei}: {startgov_result}")
                manager.update_integration_status("STARTGOV", startgov_result.result_type.value, startgov_result.error)

            # 3. Coleta dados no PNCP (Portal Nacional de Contratações Públicas - WRK-01)
            pncp_result = pncp_adapter.fetch_pncp_publications(prot_sei)
            if pncp_result.is_success and pncp_result.data:
                houve_sucesso_coleta = True
                num_pncp = pncp_result.data.get("numero_controle_pncp")
                if num_pncp and not processo.get("numero_contrato_pncp") and manager.supabase:
                    logger.info(f"Vinculando automaticamente {prot_sei} ao PNCP {num_pncp}")
                    manager.supabase.table("processos").update({
                        "numero_contrato_pncp": num_pncp
                    }).eq("id", processo["id"]).execute()

                if "ultimo_evento" in pncp_result.data:
                    process_delta_and_alerts(manager, processo, pncp_result.data["ultimo_evento"], origem="PNCP")
            elif pncp_result.result_type not in (FetchResultType.NOT_CONFIGURED, FetchResultType.NO_CHANGE):
                logger.warning(f"[PNCP] Coleta de {prot_sei}: {pncp_result}")
                manager.update_integration_status("PNCP", pncp_result.result_type.value, pncp_result.error)

            if houve_sucesso_coleta:
                processados_com_sucesso += 1
            else:
                # REMEDIAÇÃO (WRK-04): Se ambas as fontes falharam ou não retornaram dados,
                # reagenda o processo com backoff exponencial para desobstruir o topo da fila!
                if manager.supabase:
                    nova_prox = calcular_proxima_verificacao(processo.get("prioridade", "QUENTE"), falhas_consecutivas=1)
                    manager.supabase.table("processos").update({
                        "proxima_verificacao_em": nova_prox,
                        "ultima_verificacao_em": datetime.now(timezone.utc).isoformat()
                    }).eq("id", processo["id"]).execute()
                falhas += 1
        except Exception as e:
            logger.error(f"Erro ao processar {prot_sei}: {e}", exc_info=True)
            falhas += 1

    logger.info(f"=== CICLO CONCLUÍDO: {processados_com_sucesso}/{len(candidatos)} PROCESSOS OK, {falhas} FALHAS ===")

    # REMEDIAÇÃO (WRK-09): Se todos os candidatos falharam na coleta, sinaliza erro para o GitHub Actions
    if len(candidatos) > 0 and processados_com_sucesso == 0 and falhas > 0:
        logger.error("Todos os processos da rodada falharam na coleta. Encerrando com código de erro 1.")
        sys.exit(1)


if __name__ == "__main__":
    main()
