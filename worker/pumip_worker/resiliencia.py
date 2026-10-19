"""
PUMIP-SEDUC: Políticas de Resiliência e Circuit Breaker por Fonte
Conforme Seção 6.6 do Relatório de Auditoria Técnica (@Cpacesso).
"""

import time
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from pumip_worker.config import config


class CircuitBreakerStatus:
    def __init__(self, fonte: str) -> None:
        self.fonte = fonte
        self.falhas_consecutivas = 0
        self.aberto_ate: Optional[float] = None
        self.ultimo_motivo: Optional[str] = None

    def is_aberto(self) -> bool:
        """Retorna True se o circuito estiver aberto (fonte suspensa)."""
        if self.aberto_ate is None:
            return False
        if time.time() > self.aberto_ate:
            # Cooldown expirado: passa para semi-aberto
            self.aberto_ate = None
            return False
        return True

    def registrar_sucesso(self) -> None:
        self.falhas_consecutivas = 0
        self.aberto_ate = None
        self.ultimo_motivo = None

    def registrar_falha(self, motivo: str) -> None:
        self.falhas_consecutivas += 1
        self.ultimo_motivo = motivo

        if self.falhas_consecutivas >= config.circuit_breaker_max_failures:
            self.aberto_ate = time.time() + config.circuit_breaker_cooldown_seconds


class GerenciadorResiliencia:
    def __init__(self) -> None:
        self.circuitos: Dict[str, CircuitBreakerStatus] = {
            "SEI": CircuitBreakerStatus("SEI"),
            "STARTGOV": CircuitBreakerStatus("STARTGOV"),
            "PNCP": CircuitBreakerStatus("PNCP"),
        }

    def pode_executar(self, fonte: str) -> bool:
        cb = self.circuitos.get(fonte)
        if not cb:
            return True
        return not cb.is_aberto()

    def registrar_resultado(self, fonte: str, sucesso: bool, motivo: Optional[str] = None) -> None:
        cb = self.circuitos.get(fonte)
        if not cb:
            cb = CircuitBreakerStatus(fonte)
            self.circuitos[fonte] = cb

        if sucesso:
            cb.registrar_sucesso()
        else:
            cb.registrar_falha(motivo or "Falha de comunicação")


resiliencia_global = GerenciadorResiliencia()
