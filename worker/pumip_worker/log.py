"""
PUMIP-SEDUC: Logging Estruturado em JSON com Mascaramento LGPD
Conforme Seção 6.1 e 10.1 do Relatório de Auditoria Técnica (@Cpacesso).
"""

import sys
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any


def mascarar_email(email: Optional[str]) -> str:
    """
    Mascaramento em conformidade com LGPD / ASVS Nível 2.
    Exemplo: 'servulo.junior@seduc.ma.gov.br' -> 's***@seduc.ma.gov.br'
    """
    if not email or "@" not in email:
        return "***"
    partes = email.split("@")
    usuario = partes[0]
    dominio = partes[1]
    if len(usuario) <= 1:
        return f"{usuario}***@{dominio}"
    return f"{usuario[0]}***@{dominio}"


class JSONLogFormatter(logging.Formatter):
    def __init__(self, execucao_id: str = "") -> None:
        super().__init__()
        self.execucao_id = execucao_id

    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "momento": datetime.now(timezone.utc).isoformat(),
            "nivel": record.levelname,
            "execucao_id": getattr(record, "execucao_id", self.execucao_id),
            "fonte": getattr(record, "fonte", "SISTEMA"),
            "processo_id": getattr(record, "processo_id", None),
            "evento": record.getMessage(),
            "duracao_ms": getattr(record, "duracao_ms", 0)
        }
        return json.dumps(log_obj, ensure_ascii=False)


def configurar_logger(execucao_id: str = "") -> logging.Logger:
    logger = logging.getLogger("pumip.worker")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONLogFormatter(execucao_id=execucao_id))
    logger.addHandler(handler)
    return logger


logger = configurar_logger()
