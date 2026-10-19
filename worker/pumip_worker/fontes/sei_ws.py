"""
PUMIP-SEDUC: Adaptador WebService SOAP Oficial do SEI! (Maranhão / ATI-MA)
Conforme Seção 6.3 do Relatório de Auditoria Técnica (@Cpacesso).
Elimina a raspagem HTML de controlador.php e User-Agents aleatórios.
Retorna NOT_CONFIGURED até fornecimento das credenciais e WSDL oficiais pela ATI-MA.
"""

from typing import Optional

from pumip_worker.config import config
from pumip_worker.modelos import Processo, ResultadoColeta, ResultadoColetaTipo


class SEIWSFonte:
    nome = "SEI"

    def __init__(self, wsdl_url: Optional[str] = None) -> None:
        self.wsdl_url = wsdl_url or config.sei_ws_url

    def coletar(self, processo: Processo) -> ResultadoColeta:
        # Se as credenciais de webservice ou WSDL oficial não estiverem cadastradas no ambiente
        if not self.wsdl_url:
            return ResultadoColeta(
                tipo=ResultadoColetaTipo.NOT_CONFIGURED,
                fonte=self.nome,
                erro=(
                    "WebService SOAP do SEI! aguardando fornecimento formal "
                    "de WSDL e credenciais pela ATI-MA."
                )
            )

        # TODO: Quando o cadastro de sistema integrador for liberado pela ATI-MA,
        # instanciar zeep.Client(self.wsdl_url) e invocar consultarProcedimento(protocolo_sei)
        return ResultadoColeta(
            tipo=ResultadoColetaTipo.NOT_CONFIGURED,
            fonte=self.nome,
            erro="Conexão SOAP em aguardo de credenciais de produção."
        )
