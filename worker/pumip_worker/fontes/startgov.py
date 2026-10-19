"""
PUMIP-SEDUC: Adaptador Oficial StartGov Licitações
Conforme Seção 6.3 do Relatório de Auditoria Técnica (@Cpacesso).
Elimina endpoints presumidos e retorna NOT_CONFIGURED até fornecimento de documentação oficial.
"""

from typing import Optional

from pumip_worker.config import config
from pumip_worker.modelos import Processo, ResultadoColeta, ResultadoColetaTipo


class StartGovFonte:
    nome = "STARTGOV"

    def __init__(self, base_url: Optional[str] = None) -> None:
        self.base_url = base_url or config.startgov_base_url

    def coletar(self, processo: Processo) -> ResultadoColeta:
        if not self.base_url:
            return ResultadoColeta(
                tipo=ResultadoColetaTipo.NOT_CONFIGURED,
                fonte=self.nome,
                erro=(
                    "Integração StartGov aguardando documentação oficial de API "
                    "e credenciais contratuais."
                )
            )

        return ResultadoColeta(
            tipo=ResultadoColetaTipo.NOT_CONFIGURED,
            fonte=self.nome,
            erro="API StartGov não documentada oficialmente."
        )
