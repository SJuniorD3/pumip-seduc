"""
Testes Unitários: Normalização e Vinculação de Protocolos (Seção 6.4)
"""

import pytest
from pumip_worker.vinculacao import normalizar_protocolo, vincular_contrato_a_processos
from pumip_worker.modelos import Processo, ContratoPNCP


def test_normalizar_protocolo_formatos_variados():
    # 1. Padrão oficial SEI
    assert normalizar_protocolo("SEI-021001/004521/2026") == "0210010045212026"
    # 2. Padrão com ponto e barra
    assert normalizar_protocolo("021001.004521/2026") == "0210010045212026"
    # 3. Padrão apenas com dígitos
    assert normalizar_protocolo("0210010045212026") == "0210010045212026"
    # 4. Padrão com espaços e traço
    assert normalizar_protocolo("SEI 021001 - 004521 / 2026") == "0210010045212026"
    # 5. Padrão minúsculo
    assert normalizar_protocolo("sei-021001/004521/2026") == "0210010045212026"
    # 6. Padrão StartGov
    assert normalizar_protocolo("STARTGOV-2026/0892") == "20260892"
    # 7. Padrão PNCP
    assert normalizar_protocolo("PNCP-12345/2026") == "123452026"
    # 8. Padrão alfanumérico
    assert normalizar_protocolo("PROC-ABC.123/2026") == "ABC1232026"
    # 9. Entrada com espaços nas pontas
    assert normalizar_protocolo("  021001/004521/2026  ") == "0210010045212026"
    # 10. Entrada vazia ou None
    assert normalizar_protocolo("") == ""
    assert normalizar_protocolo(None) == ""


def test_vincular_contrato_correspondencia_exata():
    processos = [
        Processo(
            id="proc-01",
            protocolo_sei="SEI-021001/004521/2026",
            protocolo_startgov="STARTGOV-2026/0892",
            objeto="Aquisição de Switches"
        ),
        Processo(
            id="proc-02",
            protocolo_sei="SEI-021001/007812/2026",
            objeto="Nuvem Governamental"
        )
    ]

    # Contrato com referência ao processo 01 em formato com pontos
    contrato = ContratoPNCP(
        numero_controle_pncp="06354468000130-1-000045/2026",
        numero_processo="021001.004521/2026",
        objeto_contrato="Contrato de Switches",
        data_publicacao_pncp="2026-10-10"
    )

    vinculado = vincular_contrato_a_processos(contrato, processos)
    assert vinculado is not None
    assert vinculado.id == "proc-01"


def test_vincular_contrato_sem_correspondencia():
    processos = [
        Processo(
            id="proc-01",
            protocolo_sei="SEI-021001/004521/2026"
        )
    ]

    contrato = ContratoPNCP(
        numero_controle_pncp="06354468000130-1-000099/2026",
        numero_processo="SEI-999999/999999/2026",
        objeto_contrato="Objeto Inexistente",
        data_publicacao_pncp="2026-10-10"
    )

    vinculado = vincular_contrato_a_processos(contrato, processos)
    assert vinculado is None
