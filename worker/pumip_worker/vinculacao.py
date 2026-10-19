"""
PUMIP-SEDUC: Normalização e Vinculação de Protocolos Administrativos
Conforme Seção 6.4 do Relatório de Auditoria Técnica (@Cpacesso).
"""

import re
from typing import Optional, List
from pumip_worker.modelos import Processo, ContratoPNCP


def normalizar_protocolo(texto: Optional[str]) -> str:
    """
    Normaliza identificadores processuais:
    Remove o prefixo 'SEI-', pontos, barras, traços, espaços e converte em maiúsculas.
    Exemplo: 'SEI-021001/004521/2026' -> '0210010045212026'
    """
    if not texto:
        return ""
    limpo = re.sub(r"^(SEI|STARTGOV|PNCP)[\s\-_:]*", "", texto.strip(), flags=re.IGNORECASE)
    return re.sub(r"[^A-Za-z0-9]", "", limpo).upper()


def vincular_contrato_a_processos(
    contrato: ContratoPNCP,
    processos: List[Processo]
) -> Optional[Processo]:
    """
    Vincula um contrato publicado no PNCP ao processo interno correspondente.
    Exige correspondência estrita e normalizada. Se não houver correspondência exata,
    retorna None para que o item seja encaminhado à fila de confirmação manual.
    """
    if not contrato.numero_processo:
        return None

    contrato_proc_norm = normalizar_protocolo(contrato.numero_processo)
    if not contrato_proc_norm:
        return None

    for proc in processos:
        proc_sei_norm = normalizar_protocolo(proc.protocolo_sei)
        proc_sg_norm = normalizar_protocolo(proc.protocolo_startgov)

        if contrato_proc_norm == proc_sei_norm or (proc_sg_norm and contrato_proc_norm == proc_sg_norm):
            return proc

    return None
