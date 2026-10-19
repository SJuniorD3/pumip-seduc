"""
PUMIP-SEDUC: Adaptador Oficial da API Pública do PNCP (Lei 14.133/2021)
Conforme Especificação Oficial OpenAPI (https://pncp.gov.br/api/consulta/v3/api-docs)
e Reauditoria Técnica (@Cpacesso).
"""

import hashlib
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

try:
    import httpx
except ImportError:
    httpx = None

from pumip_worker.config import config
from pumip_worker.modelos import (
    EventoFonte,
    Processo,
    ResultadoColeta,
    ResultadoColetaTipo,
)
from pumip_worker.vinculacao import normalizar_protocolo


class PNCPFonte:
    nome = "PNCP"

    def __init__(self, client: Optional[Any] = None) -> None:
        self.client = client

    def coletar(self, processo: Processo) -> ResultadoColeta:
        inicio = time.time()
        url = f"{config.pncp_base_url}/v1/contratacoes/publicacao"
        ano_atual = datetime.now(timezone.utc).year

        proc_sei_norm = normalizar_protocolo(processo.protocolo_sei)
        proc_sg_norm = normalizar_protocolo(processo.protocolo_startgov)

        headers = {
            "User-Agent": config.user_agent,
            "Accept": "application/json",
        }

        pagina_atual = 1
        item_correspondente: Optional[Dict[str, Any]] = None

        try:
            while pagina_atual <= 5 and item_correspondente is None:
                params = {
                    "dataInicial": f"{ano_atual}0101",
                    "dataFinal": f"{ano_atual}1231",
                    "codigoModalidadeContratacao": "6",
                    "pagina": str(pagina_atual),
                    "tamanhoPagina": "50",
                    "cnpj": config.seduc_cnpj,
                }

                if self.client:
                    resp = self.client.get(url, params=params, headers=headers)
                else:
                    if httpx is None:
                        duracao_ms = int((time.time() - inicio) * 1000)
                        return ResultadoColeta(
                            tipo=ResultadoColetaTipo.SOURCE_UNAVAILABLE,
                            fonte=self.nome,
                            erro="httpx não instalado",
                            duracao_ms=duracao_ms,
                        )
                    with httpx.Client(timeout=15.0) as cli:
                        resp = cli.get(url, params=params, headers=headers)

                duracao_ms = int((time.time() - inicio) * 1000)

                if resp.status_code == 404:
                    return ResultadoColeta(
                        tipo=ResultadoColetaTipo.NO_CHANGE,
                        fonte=self.nome,
                        duracao_ms=duracao_ms,
                    )

                if resp.status_code in (401, 403):
                    return ResultadoColeta(
                        tipo=ResultadoColetaTipo.ACCESS_DENIED,
                        fonte=self.nome,
                        erro=f"HTTP {resp.status_code}",
                        duracao_ms=duracao_ms,
                    )

                if resp.status_code != 200:
                    return ResultadoColeta(
                        tipo=ResultadoColetaTipo.SOURCE_UNAVAILABLE,
                        fonte=self.nome,
                        erro=f"HTTP {resp.status_code}: {resp.text[:120]}",
                        duracao_ms=duracao_ms,
                    )

                dados = resp.json()
                items: List[Dict[str, Any]] = dados.get("data", [])

                if not items:
                    break

                for it in items:
                    proc_ref = normalizar_protocolo(str(it.get("processo") or ""))
                    if proc_ref and (
                        proc_ref == proc_sei_norm
                        or (proc_sg_norm and proc_ref == proc_sg_norm)
                    ):
                        item_correspondente = it
                        break

                paginas_restantes = dados.get("paginasRestantes", 0)
                if paginas_restantes is None or paginas_restantes <= 0:
                    break
                pagina_atual += 1

            duracao_ms = int((time.time() - inicio) * 1000)

            # Sem correspondência estrita e normalizada, retorna NO_CHANGE (nunca usa fallback)
            if not item_correspondente:
                return ResultadoColeta(
                    tipo=ResultadoColetaTipo.NO_CHANGE,
                    fonte=self.nome,
                    duracao_ms=duracao_ms,
                )

            num_controle = str(item_correspondente.get("numeroControlePNCP") or "")
            objeto = str(item_correspondente.get("objetoCompra") or "")
            modalidade_padrao = "Pregão Eletrônico (Lei 14.133/2021)"
            modalidade = str(item_correspondente.get("modalidadeNome") or modalidade_padrao)
            data_pub_padrao = datetime.now(timezone.utc).isoformat()
            data_pub = str(item_correspondente.get("dataPublicacaoPncp") or data_pub_padrao)

            hash_input = f"PNCP|{num_controle}|{data_pub}|{objeto[:80]}"
            hash_evento = hashlib.sha256(hash_input.encode()).hexdigest()

            desc = f"Publicação de Edital no PNCP: {modalidade} - {objeto[:120]}".strip()
            evento = EventoFonte(
                origem=self.nome,
                data_hora_evento=data_pub,
                unidade_setor="PNCP / CSL",
                descricao_andamento=desc,
                documento_anexado=f"Controle PNCP {num_controle}",
                tipo_documento="EDITAL_PNCP",
                resumo_ia=None,
                hash_evento=hash_evento,
                metadados={
                    "numero_controle_pncp": num_controle,
                    "modalidade": modalidade,
                    "cnpj_orgao": config.seduc_cnpj,
                },
            )

            return ResultadoColeta(
                tipo=ResultadoColetaTipo.SUCCESS,
                fonte=self.nome,
                evento=evento,
                dados_brutos=item_correspondente,
                duracao_ms=duracao_ms,
            )

        except (httpx.TimeoutException if httpx else Exception) as exc:
            if httpx and isinstance(exc, httpx.TimeoutException):
                return ResultadoColeta(
                    tipo=ResultadoColetaTipo.TIMEOUT,
                    fonte=self.nome,
                    erro="Tempo limite de conexão esgotado (timeout)",
                    duracao_ms=int((time.time() - inicio) * 1000),
                )
            return ResultadoColeta(
                tipo=ResultadoColetaTipo.INVALID_RESPONSE,
                fonte=self.nome,
                erro=str(exc),
                duracao_ms=int((time.time() - inicio) * 1000),
            )
        except Exception as e:
            return ResultadoColeta(
                tipo=ResultadoColetaTipo.INVALID_RESPONSE,
                fonte=self.nome,
                erro=str(e),
                duracao_ms=int((time.time() - inicio) * 1000),
            )
