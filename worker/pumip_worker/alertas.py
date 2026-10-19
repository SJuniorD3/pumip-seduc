"""
PUMIP-SEDUC: Motor de Avaliação dos Cinco Gatilhos de Alerta
Conforme Seção 6.5 do Relatório de Auditoria Técnica (@Cpacesso).
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from pumip_worker.modelos import EventoFonte, Processo


def avaliar_gatilho_inercia_sla(
    alerta_parametros: Dict[str, Any],
    processo: Processo
) -> bool:
    """
    Gatilho 1: Inércia de SLA.
    Dispara quando os dias úteis parado (calculados no banco) atingem ou superam o limite.
    """
    limite_padrao = alerta_parametros.get("limite_dias", 10)
    limite_dias = int(alerta_parametros.get("dias_limite", limite_padrao))
    # Utiliza dias_uteis_parado conforme cálculo oficial da visão processos_com_inercia
    if processo.dias_uteis_parado > 0:
        dias_parado = processo.dias_uteis_parado
    else:
        dias_parado = processo.dias_parado_na_unidade
    return dias_parado >= limite_dias


def avaliar_gatilho_vencimento_contrato(
    alerta_parametros: Dict[str, Any],
    data_vigencia_fim: Optional[str]
) -> Optional[int]:
    """
    Gatilho 2: Vencimento de Contrato (Lei 14.133/2021).
    Dispara nos marcos críticos de 90, 60 e 30 dias antes do fim da vigência.
    Retorna o marco disparado (90, 60 ou 30) ou None.
    """
    if not data_vigencia_fim:
        return None

    try:
        dt_fim = datetime.fromisoformat(data_vigencia_fim.replace("Z", "+00:00"))
        agora = datetime.now(timezone.utc)
        dias_restantes = (dt_fim - agora).days

        marcos = alerta_parametros.get("marcos_dias", [90, 60, 30])
        for marco in sorted(marcos):
            if dias_restantes <= marco:
                return int(marco)
        return None
    except Exception:
        return None


def avaliar_gatilho_publicacao_pncp(
    alerta_parametros: Dict[str, Any],
    evento: EventoFonte
) -> bool:
    """
    Gatilho 3: Publicação de Certame ou Contrato no PNCP.
    Dispara quando um evento tem origem no PNCP ou tipo EDITAL_PNCP.
    """
    if evento.origem == "PNCP" or evento.tipo_documento == "EDITAL_PNCP":
        return True
    return False


def avaliar_gatilho_palavra_chave(
    alerta_parametros: Dict[str, Any],
    evento: EventoFonte
) -> bool:
    """
    Gatilho 4: Palavra-chave no andamento ou documento anexado.
    """
    termo_bruto = alerta_parametros.get(
        "palavra_chave", alerta_parametros.get("termo", "")
    )
    termo = str(termo_bruto).strip().lower()
    if not termo:
        return False

    conteudo = (
        f"{evento.descricao_andamento} "
        f"{evento.documento_anexado or ''} "
        f"{evento.tipo_documento or ''}"
    ).lower()
    return termo in conteudo


def avaliar_alerta(
    tipo_alerta: str,
    parametros: Dict[str, Any],
    processo: Processo,
    evento: Optional[EventoFonte] = None,
    data_vigencia_fim: Optional[str] = None
) -> bool:
    """Avaliador unificado de gatilhos."""
    if tipo_alerta == "INERCIA_SLA":
        return avaliar_gatilho_inercia_sla(parametros, processo)

    if tipo_alerta == "VENCIMENTO_CONTRATO":
        return avaliar_gatilho_vencimento_contrato(parametros, data_vigencia_fim) is not None

    if tipo_alerta == "PUBLICACAO_PNCP" and evento:
        return avaliar_gatilho_publicacao_pncp(parametros, evento)

    if tipo_alerta == "PALAVRA_CHAVE" and evento:
        return avaliar_gatilho_palavra_chave(parametros, evento)

    return False
