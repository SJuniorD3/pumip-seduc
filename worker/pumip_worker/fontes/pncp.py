"""
PUMIP-SEDUC: Adaptador Oficial da API Pública do PNCP (Lei 14.133/2021)
Conforme Seção 6.3 do Relatório de Auditoria Técnica (@Cpacesso).
"""

import time
import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
try:
    import httpx
except ImportError:
    httpx = None

from pumip_worker.config import config
from pumip_worker.modelos import (
    Processo,
    ResultadoColeta,
    ResultadoColetaTipo,
    EventoFonte,
    ContratoPNCP
)


class PNCPFonte:
    nome = "PNCP"

    def __init__(self, client: Optional[Any] = None) -> None:
        self.client = client

    def coletar(self, processo: Processo) -> ResultadoColeta:
        inicio = time.time()
        url = f"{config.pncp_base_url}/v1/contratacoes/publicacao"
        ano_atual = datetime.now(timezone.utc).year

        params = {
            "dataInicial": f"{ano_atual}0101",
            "dataFinal": f"{ano_atual}1231",
            "codigoModalidadeContratacao": "6",
            "pagina": "1",
            "tamanhoPagina": "10",
            "cnpjOrgao": config.seduc_cnpj
        }

        headers = {
            "User-Agent": config.user_agent,
            "Accept": "application/json"
        }

        try:
            if self.client:
                resp = self.client.get(url, params=params, headers=headers)
            else:
                with httpx.Client(timeout=15.0) as cli:
                    resp = cli.get(url, params=params, headers=headers)

            duracao_ms = int((time.time() - inicio) * 1000)

            if resp.status_code == 404:
                return ResultadoColeta(
                    tipo=ResultadoColetaTipo.NO_CHANGE,
                    fonte=self.nome,
                    duracao_ms=duracao_ms
                )

            if resp.status_code in (401, 403):
                return ResultadoColeta(
                    tipo=ResultadoColetaTipo.ACCESS_DENIED,
                    fonte=self.nome,
                    erro=f"HTTP {resp.status_code}",
                    duracao_ms=duracao_ms
                )

            if resp.status_code != 200:
                return ResultadoColeta(
                    tipo=ResultadoColetaTipo.SOURCE_UNAVAILABLE,
                    fonte=self.nome,
                    erro=f"HTTP {resp.status_code}: {resp.text[:120]}",
                    duracao_ms=duracao_ms
                )

            dados = resp.json()
            items: List[Dict[str, Any]] = dados.get("data", [])

            if not items:
                return ResultadoColeta(
                    tipo=ResultadoColetaTipo.NO_CHANGE,
                    fonte=self.nome,
                    duracao_ms=duracao_ms
                )

            # Localiza publicação correspondente ao processo
            sei_norm = processo.protocolo_sei.replace("SEI-", "").replace("/", "").replace(".", "")
            item_correspondente = None

            for it in items:
                proc_ref = str(it.get("numeroProcesso", "")).replace("/", "").replace(".", "")
                obj_text = str(it.get("objeto", "")).upper()
                if sei_norm and (sei_norm in proc_ref or (processo.objeto and processo.objeto[:20].upper() in obj_text)):
                    item_correspondente = it
                    break

            if not item_correspondente:
                item_correspondente = items[0]

            num_controle = str(item_correspondente.get("numeroControlePNCP") or f"PNCP-{item_correspondente.get('numeroItem', '001')}")
            objeto = str(item_correspondente.get("objeto") or "Contratação Pública SEDUC-MA")
            modalidade = str(item_correspondente.get("modalidadeNome") or "Pregão Eletrônico (Lei 14.133/2021)")
            data_pub = str(item_correspondente.get("dataPublicacaoPncp") or datetime.now(timezone.utc).isoformat())

            # Hash determinístico baseado nos dados da fonte
            hash_input = f"PNCP|{num_controle}|{data_pub}|{objeto[:80]}"
            hash_evento = hashlib.sha256(hash_input.encode()).hexdigest()

            evento = EventoFonte(
                origem=self.nome,
                data_hora_evento=data_pub,
                unidade_setor="PNCP / CSL",
                descricao_andamento=f"Publicação de Edital no PNCP: {modalidade} - {objeto[:120]}",
                documento_anexado=f"Controle PNCP {num_controle}",
                tipo_documento="EDITAL_PNCP",
                resumo_ia="Certame registrado e publicado no Portal Nacional de Contratações Públicas sob a Lei 14.133/2021.",
                hash_evento=hash_evento,
                metadados={
                    "numero_controle_pncp": num_controle,
                    "modalidade": modalidade,
                    "cnpj_orgao": config.seduc_cnpj
                }
            )

            return ResultadoColeta(
                tipo=ResultadoColetaTipo.SUCCESS,
                fonte=self.nome,
                evento=evento,
                dados_brutos=item_correspondente,
                duracao_ms=duracao_ms
            )

        except httpx.TimeoutException:
            return ResultadoColeta(
                tipo=ResultadoColetaTipo.TIMEOUT,
                fonte=self.nome,
                erro="Tempo limite de conexão esgotado (timeout)",
                duracao_ms=int((time.time() - inicio) * 1000)
            )
        except Exception as e:
            return ResultadoColeta(
                tipo=ResultadoColetaTipo.INVALID_RESPONSE,
                fonte=self.nome,
                erro=str(e),
                duracao_ms=int((time.time() - inicio) * 1000)
            )
