"""
PUMIP-SEDUC: Modelos de Dados Tipados do Worker (Pydantic / dataclasses)
Conforme Seção 6.1 e 6.2 do Relatório de Auditoria Técnica (@Cpacesso).
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional


class ResultadoColetaTipo(str, Enum):
    SUCCESS = "SUCCESS"
    NO_CHANGE = "NO_CHANGE"
    NOT_CONFIGURED = "NOT_CONFIGURED"
    ACCESS_DENIED = "ACCESS_DENIED"
    TIMEOUT = "TIMEOUT"
    SOURCE_UNAVAILABLE = "SOURCE_UNAVAILABLE"
    INVALID_RESPONSE = "INVALID_RESPONSE"


@dataclass
class EventoFonte:
    origem: str
    data_hora_evento: str
    unidade_setor: str
    descricao_andamento: str
    documento_anexado: Optional[str] = None
    tipo_documento: Optional[str] = None
    resumo_ia: Optional[str] = None
    hash_evento: str = ""
    metadados: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ResultadoColeta:
    tipo: ResultadoColetaTipo
    fonte: str
    evento: Optional[EventoFonte] = None
    dados_brutos: Optional[Dict[str, Any]] = None
    erro: Optional[str] = None
    duracao_ms: int = 0


@dataclass
class ContratoPNCP:
    numero_controle_pncp: str
    numero_processo: Optional[str]
    objeto_contrato: str
    data_publicacao_pncp: str
    data_vigencia_fim: Optional[str] = None
    valor_global: Optional[float] = None


@dataclass
class Processo:
    id: str
    protocolo_sei: str = ""
    protocolo_startgov: Optional[str] = None
    numero_contrato_pncp: Optional[str] = None
    objeto: str = ""
    unidade_origem_id: str = ""
    unidade_atual_sei: str = ""
    status_etapa: str = "FASE_INTERNA_SEI"
    prioridade: str = "QUENTE"
    dias_parado_na_unidade: int = 0
    dias_uteis_parado: int = 0
    hash_ultimo_estado: Optional[str] = None
    ultima_movimentacao_em: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
