"""
PUMIP-SEDUC: Interface Comum das Fontes de Dados (Protocol)
Conforme Seção 6.2 do Relatório de Auditoria Técnica (@Cpacesso).
"""

from typing import Protocol
from pumip_worker.modelos import Processo, ResultadoColeta


class FonteDados(Protocol):
    nome: str

    def coletar(self, processo: Processo) -> ResultadoColeta:
        """Executa a coleta para o processo fornecido e retorna ResultadoColeta tipado."""
        ...
