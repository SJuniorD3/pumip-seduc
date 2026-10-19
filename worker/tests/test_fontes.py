"""
Testes de Contrato e Coleta das Fontes de Dados (Seção 6.3 e 6.7)
"""

import json
import os
from unittest.mock import MagicMock
import pytest
import httpx

from pumip_worker.fontes.pncp import PNCPFonte
from pumip_worker.fontes.sei_ws import SEIWSFonte
from pumip_worker.fontes.startgov import StartGovFonte
from pumip_worker.modelos import Processo, ResultadoColetaTipo


def test_sei_ws_retorna_not_configured():
    fonte = SEIWSFonte(wsdl_url=None)
    proc = Processo(id="p1", protocolo_sei="SEI-021001/004521/2026")
    res = fonte.coletar(proc)

    assert res.tipo == ResultadoColetaTipo.NOT_CONFIGURED
    assert "aguardando" in (res.erro or "").lower()


def test_startgov_retorna_not_configured():
    fonte = StartGovFonte(base_url=None)
    proc = Processo(id="p1", protocolo_sei="SEI-021001/004521/2026")
    res = fonte.coletar(proc)

    assert res.tipo == ResultadoColetaTipo.NOT_CONFIGURED
    assert "documentada" in (res.erro or "").lower() or "aguardando" in (res.erro or "").lower()


def test_pncp_coleta_com_fixture_mock():
    # Carrega fixture oficial
    fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "pncp_contratos.json")
    with open(fixture_path, "r", encoding="utf-8") as f:
        fixture_data = json.load(f)

    # Simula resposta HTTP 200 via mock de httpx.Client
    mock_client = MagicMock(spec=httpx.Client)
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = fixture_data
    mock_client.get.return_value = mock_resp

    fonte = PNCPFonte(client=mock_client)
    proc = Processo(
        id="p1",
        protocolo_sei="SEI-021001/004521/2026",
        objeto="Aquisição de Switches"
    )

    res = fonte.coletar(proc)

    assert res.tipo == ResultadoColetaTipo.SUCCESS
    assert res.evento is not None
    assert res.evento.origem == "PNCP"
    assert "06354468000130-1-000045/2026" in res.evento.documento_anexado
    assert res.evento.resumo_ia is not None
    assert res.evento.hash_evento != ""


def test_pncp_erros_de_rede():
    mock_client = MagicMock(spec=httpx.Client)

    # Simula 404
    mock_resp_404 = MagicMock(spec=httpx.Response)
    mock_resp_404.status_code = 404
    mock_client.get.return_value = mock_resp_404
    fonte = PNCPFonte(client=mock_client)
    proc = Processo(id="p1")
    assert fonte.coletar(proc).tipo == ResultadoColetaTipo.NO_CHANGE

    # Simula 403 (Acesso Negado)
    mock_resp_403 = MagicMock(spec=httpx.Response)
    mock_resp_403.status_code = 403
    mock_client.get.return_value = mock_resp_403
    assert fonte.coletar(proc).tipo == ResultadoColetaTipo.ACCESS_DENIED

    # Simula 500 (Fonte Indisponível)
    mock_resp_500 = MagicMock(spec=httpx.Response)
    mock_resp_500.status_code = 500
    mock_resp_500.text = "Internal Server Error"
    mock_client.get.return_value = mock_resp_500
    assert fonte.coletar(proc).tipo == ResultadoColetaTipo.SOURCE_UNAVAILABLE

    # Simula Timeout
    mock_client.get.side_effect = httpx.TimeoutException("Timeout")
    assert fonte.coletar(proc).tipo == ResultadoColetaTipo.TIMEOUT
