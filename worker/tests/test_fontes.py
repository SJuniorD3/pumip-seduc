"""
Testes de Contrato e Coleta das Fontes de Dados (Seção 6.3 e 6.7)
Compatível com Pytest e unittest da Standard Library.
"""

import json
import os
import unittest
from unittest.mock import MagicMock

try:
    import httpx
except ImportError:
    httpx = None

from pumip_worker.fontes.pncp import PNCPFonte
from pumip_worker.fontes.sei_ws import SEIWSFonte
from pumip_worker.fontes.startgov import StartGovFonte
from pumip_worker.modelos import Processo, ResultadoColetaTipo


class TestFontesContrato(unittest.TestCase):
    def test_sei_ws_retorna_not_configured(self):
        fonte = SEIWSFonte(wsdl_url=None)
        proc = Processo(id="p1", protocolo_sei="SEI-021001/004521/2026")
        res = fonte.coletar(proc)

        self.assertEqual(res.tipo, ResultadoColetaTipo.NOT_CONFIGURED)
        self.assertIn("aguardando", (res.erro or "").lower())

    def test_startgov_retorna_not_configured(self):
        fonte = StartGovFonte(base_url=None)
        proc = Processo(id="p1", protocolo_sei="SEI-021001/004521/2026")
        res = fonte.coletar(proc)

        self.assertEqual(res.tipo, ResultadoColetaTipo.NOT_CONFIGURED)
        self.assertTrue("documentada" in (res.erro or "").lower() or "aguardando" in (res.erro or "").lower())

    def test_pncp_coleta_com_fixture_mock(self):
        # Carrega fixture oficial
        fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "pncp_contratos.json")
        with open(fixture_path, "r", encoding="utf-8") as f:
            fixture_data = json.load(f)

        # Simula resposta HTTP 200 via mock
        mock_client = MagicMock()
        mock_resp = MagicMock()
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

        self.assertEqual(res.tipo, ResultadoColetaTipo.SUCCESS)
        self.assertIsNotNone(res.evento)
        self.assertEqual(res.evento.origem, "PNCP")
        self.assertIn("06354468000130-1-000045/2026", res.evento.documento_anexado)
        self.assertIsNotNone(res.evento.resumo_ia)
        self.assertNotEqual(res.evento.hash_evento, "")

    def test_pncp_erros_de_rede(self):
        mock_client = MagicMock()

        # Simula 404
        mock_resp_404 = MagicMock()
        mock_resp_404.status_code = 404
        mock_client.get.return_value = mock_resp_404
        fonte = PNCPFonte(client=mock_client)
        proc = Processo(id="p1")
        self.assertEqual(fonte.coletar(proc).tipo, ResultadoColetaTipo.NO_CHANGE)

        # Simula 403 (Acesso Negado)
        mock_resp_403 = MagicMock()
        mock_resp_403.status_code = 403
        mock_client.get.return_value = mock_resp_403
        self.assertEqual(fonte.coletar(proc).tipo, ResultadoColetaTipo.ACCESS_DENIED)

        # Simula 500 (Fonte Indisponível)
        mock_resp_500 = MagicMock()
        mock_resp_500.status_code = 500
        mock_resp_500.text = "Internal Server Error"
        mock_client.get.return_value = mock_resp_500
        self.assertEqual(fonte.coletar(proc).tipo, ResultadoColetaTipo.SOURCE_UNAVAILABLE)

        # Simula Timeout quando httpx está disponível ou Exception padrão
        if httpx is not None:
            mock_client.get.side_effect = httpx.TimeoutException("Timeout")
            self.assertEqual(fonte.coletar(proc).tipo, ResultadoColetaTipo.TIMEOUT)


if __name__ == "__main__":
    unittest.main()
