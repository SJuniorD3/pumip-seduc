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
from typing import Dict, List, Optional, Any, Tuple
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
# CRIPTOGRAFIA DE SESSÃO (FERNET)
# ==============================================================================
def get_fernet_cipher() -> Fernet:
    secret_key = os.getenv("APP_SECRET_ENCRYPTION_KEY")
    if not secret_key:
        # Chave determinística de fallback baseada na Service Role para ambientes de desenvolvimento
        base_seed = hashlib.sha256(SUPABASE_SERVICE_ROLE_KEY.encode() if SUPABASE_SERVICE_ROLE_KEY else b"pumip_dev_fallback_key").digest()
        # Para estabilidade, gera uma chave baseada em base64 da seed
        import base64
        secret_key = base64.urlsafe_b64encode(base_seed)
    elif isinstance(secret_key, str):
        secret_key = secret_key.encode()
    return Fernet(secret_key)


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
        self.cipher = get_fernet_cipher()

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
        """Atualiza o status da integração no banco após tentativa de coleta."""
        if not self.supabase:
            return
        try:
            payload = {
                "sistema": sistema,
                "status": status,
                "atualizado_em": datetime.now(timezone.utc).isoformat()
            }
            if status == "FALHA" and error_msg:
                # Incrementa tentativas de falha
                self.supabase.table("sessoes_coletor").update({
                    "status": status,
                    "tentativas_falha": self.supabase.table("sessoes_coletor")
                        .select("tentativas_falha")
                        .eq("sistema", sistema)
                        .execute().data[0].get("tentativas_falha", 0) + 1 if True else 0,
                    "atualizado_em": datetime.now(timezone.utc).isoformat()
                }).eq("sistema", sistema).execute()
            logger.info(f"[{sistema}] Status de integração atualizado: {status}")
        except Exception as e:
            logger.error(f"[{sistema}] Erro ao atualizar status de integração: {e}")


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
            logger.warning(f"[SEI] Credenciais ausentes (SEI_USER/SEI_PASSWORD). Coleta não realizada.")
            return FetchResult(FetchResultType.NOT_CONFIGURED, error="Credenciais SEI_USER/SEI_PASSWORD não configuradas")

        try:
            headers = self.get_headers()
            session_data = self.manager.get_valid_session("SEI")
            cookies = session_data.get("cookies") if session_data else {}

            with httpx.Client(timeout=20.0, follow_redirects=True, headers=headers, cookies=cookies) as client:
                url = f"{SEI_BASE_URL}/sei/controlador.php?acao=procedimento_consultar&protocolo={protocolo_sei}"
                resp = client.get(url)

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
                url = f"{STARTGOV_BASE_URL}/api/v2/licitacoes/buscar?referencia={search_param}"
                resp = client.get(url)

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
                    "resumo_ia": None
                }
            }
        except Exception as e:
            logger.error(f"[StartGov] Erro ao parsear resposta: {e}")
            return None


# ==============================================================================
# MOTOR DE PROCESSAMENTO E DISPARO DE ALERTAS
# ==============================================================================
def calculate_state_hash(evento: Dict[str, Any]) -> str:
    """
    Calcula hash SHA-256 estável para garantir idempotência e detecção de delta.
    REMEDIAÇÃO P1-1: Usa apenas campos estáveis da fonte (não timestamp de coleta).
    O campo data_hora deve conter o timestamp ORIGINAL da fonte, não datetime.now().
    """
    raw_str = (
        f"{evento.get('unidade_setor', '')}|"
        f"{evento.get('descricao', '')}|"
        f"{evento.get('documento', '')}|"
        f"{evento.get('tipo_documento', '')}"
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


def process_delta_and_alerts(
    manager: PUMIPSyncManager,
    processo: Dict[str, Any],
    novo_evento: Dict[str, Any],
    origem: str
) -> bool:
    """
    Verifica se o evento é novo (Delta), grava na linha do tempo e dispara alertas se necessário.
    REMEDIAÇÃO P0-2: Só aceita eventos com dados reais da fonte.
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

        # Próxima verificação de acordo com a prioridade
        prio = processo.get("prioridade", "QUENTE")
        hours_interval = 1 if prio == "QUENTE" else (12 if prio == "MORNO" else 72)
        prox_verificacao = (agora + timedelta(hours=hours_interval)).isoformat()

        manager.supabase.table("processos").update({
            "dias_parado_na_unidade": dias_parado,
            "ultima_verificacao_em": agora.isoformat(),
            "proxima_verificacao_em": prox_verificacao
        }).eq("id", processo["id"]).execute()
        return False

    # HOUVE MUDANÇA (DELTA POSITIVO): Gravar na linha do tempo e gerar alerta
    logger.info(f"[Processo {processo.get('protocolo_sei')}] NOVO ANDAMENTO DETECTADO! Hash: {novo_hash[:12]}...")

    agora = datetime.now(timezone.utc)

    # 1. Inserir em historico_tramitacoes
    # REMEDIAÇÃO P1-1: Separa ocorrido_em (da fonte) de coletado_em (agora)
    data_hora_fonte = novo_evento.get("data_hora")
    if not data_hora_fonte:
        data_hora_fonte = agora.isoformat()
        logger.warning(f"[Processo {processo.get('protocolo_sei')}] Evento sem data_hora da fonte. Usando timestamp de coleta.")

    payload_evento = {
        "processo_id": processo["id"],
        "origem_sistema": origem,
        "data_hora_evento": data_hora_fonte,
        "unidade_setor": novo_evento.get("unidade_setor", "NÃO INFORMADO"),
        "descricao_andamento": descricao,
        "documento_anexado": novo_evento.get("documento"),
        "tipo_documento": novo_evento.get("tipo_documento"),
        "resumo_ia": novo_evento.get("resumo_ia"),
        "hash_evento": novo_hash,
        "metadados": json.dumps({"coletado_em": agora.isoformat(), "origem_adapter": origem})
    }

    try:
        manager.supabase.table("historico_tramitacoes").insert(payload_evento).execute()
    except Exception as e:
        logger.warning(f"Possível idempotência acionada na gravação do histórico: {e}")

    # 2. Atualizar processo
    prio = processo.get("prioridade", "QUENTE")
    hours_interval = 1 if prio == "QUENTE" else (12 if prio == "MORNO" else 72)
    prox_verificacao = (agora + timedelta(hours=hours_interval)).isoformat()

    # REMEDIAÇÃO P0-2: Só atualiza unidade_atual_sei se o evento veio do SEI
    update_payload: Dict[str, Any] = {
        "hash_ultimo_estado": novo_hash,
        "dias_parado_na_unidade": 0,
        "ultima_movimentacao_em": agora.isoformat(),
        "ultima_verificacao_em": agora.isoformat(),
        "proxima_verificacao_em": prox_verificacao
    }

    if origem == "SEI" and novo_evento.get("unidade_setor"):
        update_payload["unidade_atual_sei"] = novo_evento["unidade_setor"]

    manager.supabase.table("processos").update(update_payload).eq("id", processo["id"]).execute()

    # 3. Avaliar regras de alertas configurados para este processo
    check_and_trigger_alerts(manager, processo, novo_evento, origem)
    return True


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
            # 1. Coleta dados no SEI
            sei_result = sei_adapter.fetch_process_data(prot_sei)
            if sei_result.is_success and sei_result.data and "ultimo_evento" in sei_result.data:
                process_delta_and_alerts(manager, processo, sei_result.data["ultimo_evento"], origem="SEI")
            elif sei_result.result_type != FetchResultType.NOT_CONFIGURED:
                logger.warning(f"[SEI] Coleta de {prot_sei}: {sei_result}")
                manager.update_integration_status("SEI", sei_result.result_type.value, sei_result.error)

            # 2. Coleta dados no StartGov
            startgov_result = startgov_adapter.fetch_contract_data(prot_startgov, prot_sei)
            if startgov_result.is_success and startgov_result.data:
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

            processados_com_sucesso += 1
        except Exception as e:
            logger.error(f"Erro ao processar {prot_sei}: {e}", exc_info=True)
            falhas += 1

    logger.info(f"=== CICLO CONCLUÍDO: {processados_com_sucesso}/{len(candidatos)} PROCESSOS OK, {falhas} FALHAS ===")


if __name__ == "__main__":
    main()
