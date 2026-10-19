"""
PUMIP-SEDUC: Orquestrador Principal da Rodada de Coleta (Worker Engine)
Conforme Seção 6.1 e 6.2 do Relatório de Auditoria Técnica (@Cpacesso).
"""

import sys
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from pumip_worker.config import config
from pumip_worker.log import configurar_logger, logger
from pumip_worker.modelos import (
    Processo,
    ResultadoColetaTipo,
    ResultadoColeta
)
from pumip_worker.fontes.base import FonteDados
from pumip_worker.fontes.pncp import PNCPFonte
from pumip_worker.fontes.sei_ws import SEIWSFonte
from pumip_worker.fontes.startgov import StartGovFonte
from pumip_worker.repositorio import WorkerRepositorio
from pumip_worker.resiliencia import resiliencia_global
from pumip_worker.alertas import avaliar_alerta
from pumip_worker.notificacao import disparar_notificacao_email


def executar_rodada_coleta(
    fontes: Optional[List[FonteDados]] = None,
    repositorio: Optional[WorkerRepositorio] = None,
    limite_processos: int = 50
) -> Dict[str, Any]:
    """
    Executa uma rodada completa de sincronização em camadas.
    Recebe fontes por injeção de dependência para viabilizar testes sem rede.
    """
    execucao_id = str(uuid.uuid4())
    configurar_logger(execucao_id=execucao_id)

    logger.info(f"Iniciando rodada de sincronização de processos (Execução ID: {execucao_id})")

    repo = repositorio or WorkerRepositorio()
    lista_fontes = fontes if fontes is not None else [
        PNCPFonte(),
        SEIWSFonte(),
        StartGovFonte()
    ]

    candidatos = repo.obter_processos_candidatos(limite=limite_processos)
    logger.info(f"Identificados {len(candidatos)} processos candidatos para verificação de andamentos")

    total_analisados = 0
    novos_andamentos = 0
    falhas_por_fonte: Dict[str, int] = {f.nome: 0 for f in lista_fontes}
    sucessos_por_fonte: Dict[str, int] = {f.nome: 0 for f in lista_fontes}

    for proc in candidatos:
        total_analisados += 1

        for fonte in lista_fontes:
            # Resiliência: Verifica se o circuito para esta fonte está fechado
            if not resiliencia_global.pode_executar(fonte.nome):
                logger.warning(f"Circuito aberto para {fonte.nome}. Coleta suspensa temporariamente.")
                continue

            resultado: ResultadoColeta = fonte.coletar(proc)

            if resultado.tipo == ResultadoColetaTipo.SUCCESS and resultado.evento:
                resiliencia_global.registrar_resultado(fonte.nome, sucesso=True)
                sucessos_por_fonte[fonte.nome] += 1

                # Se o hash do evento for diferente do último registrado no processo
                if resultado.evento.hash_evento != proc.hash_ultimo_estado:
                    gravou_novo = repo.registrar_andamento_rpc(
                        processo_id=proc.id,
                        evento=resultado.evento,
                        nova_unidade_sei=resultado.evento.unidade_setor if fonte.nome == "SEI" else None
                    )

                    if gravou_novo:
                        novos_andamentos += 1
                        logger.info(f"Novo andamento registrado atomicamente para {proc.protocolo_sei} ({fonte.nome})")

                        # Avaliação de alertas configurados
                        regras = repo.listar_regras_alertas(proc.id, proc.unidade_origem_id)
                        for regra in regras:
                            tipo_alerta = regra.get("tipo", "")
                            parametros = regra.get("parametros", {})
                            disparou = avaliar_alerta(
                                tipo_alerta=tipo_alerta,
                                parametros=parametros,
                                processo=proc,
                                evento=resultado.evento
                            )

                            if disparou:
                                usuario = regra.get("usuario") or {}
                                usuario_id = usuario.get("id")
                                email_dest = usuario.get("email")
                                nome_dest = usuario.get("nome", "Servidor")

                                if usuario_id and email_dest:
                                    # Valida autorização do destinatário via RLS unificada
                                    if repo.usuario_pode_ver_processo(usuario_id, proc.id):
                                        disparar_notificacao_email(
                                          destinatario_email=email_dest,
                                          destinatario_nome=nome_dest,
                                          processo=proc,
                                          evento=resultado.evento,
                                          titulo_alerta=f"Alerta: {tipo_alerta}"
                                        )

            elif resultado.tipo in (ResultadoColetaTipo.NO_CHANGE, ResultadoColetaTipo.NOT_CONFIGURED):
                resiliencia_global.registrar_resultado(fonte.nome, sucesso=True)
            else:
                falhas_por_fonte[fonte.nome] += 1
                resiliencia_global.registrar_resultado(fonte.nome, sucesso=False, motivo=resultado.erro)

    logger.info(f"Rodada concluída. Processos analisados: {total_analisados}, novos andamentos: {novos_andamentos}")

    return {
        "execucao_id": execucao_id,
        "processos_analisados": total_analisados,
        "novos_andamentos": novos_andamentos,
        "sucessos_por_fonte": sucessos_por_fonte,
        "falhas_por_fonte": falhas_por_fonte
    }


if __name__ == "__main__":
    res = executar_rodada_coleta()
    sys.exit(0)
