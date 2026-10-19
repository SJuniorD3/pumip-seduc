"""
Testes de Integração e Orquestração da Rodada (Seção 6.2 e 10.1)
Compatível com Pytest e unittest da Standard Library.
"""

import unittest
from unittest.mock import MagicMock
from pumip_worker.main import executar_rodada_coleta
from pumip_worker.log import mascarar_email
from pumip_worker.modelos import (
    Processo,
    ResultadoColeta,
    ResultadoColetaTipo,
    EventoFonte
)
from pumip_worker.fontes.base import FonteDados
from pumip_worker.repositorio import WorkerRepositorio


class TestOrquestracaoWorker(unittest.TestCase):
    def test_mascarar_email_lgpd(self):
        self.assertEqual(mascarar_email("servulo.junior@seduc.ma.gov.br"), "s***@seduc.ma.gov.br")
        self.assertEqual(mascarar_email("gabinete@seduc.ma.gov.br"), "g***@seduc.ma.gov.br")
        self.assertEqual(mascarar_email("a@seduc.ma.gov.br"), "a***@seduc.ma.gov.br")
        self.assertEqual(mascarar_email(""), "***")
        self.assertEqual(mascarar_email(None), "***")

    def test_executar_rodada_com_fontes_mock(self):
        # Fonte simulada com sucesso
        mock_fonte = MagicMock(spec=FonteDados)
        mock_fonte.nome = "PNCP"
        mock_fonte.coletar.return_value = ResultadoColeta(
            tipo=ResultadoColetaTipo.SUCCESS,
            fonte="PNCP",
            evento=EventoFonte(
                origem="PNCP",
                data_hora_evento="2026-10-10T14:00:00Z",
                unidade_setor="CSL",
                descricao_andamento="Edital Publicado",
                hash_evento="hash_teste_123"
            )
        )

        # Repositório simulado
        mock_repo = MagicMock(spec=WorkerRepositorio)
        mock_repo.obter_processos_candidatos.return_value = [
            Processo(
                id="p1",
                protocolo_sei="SEI-021001/004521/2026",
                hash_ultimo_estado="hash_antigo"
            )
        ]
        mock_repo.registrar_andamento_rpc.return_value = True
        mock_repo.listar_regras_alertas.return_value = []

        res = executar_rodada_coleta(fontes=[mock_fonte], repositorio=mock_repo)

        self.assertEqual(res["processos_analisados"], 1)
        self.assertEqual(res["novos_andamentos"], 1)
        self.assertNotEqual(res["execucao_id"], "")
        self.assertEqual(res["sucessos_por_fonte"]["PNCP"], 1)
        self.assertTrue(mock_repo.registrar_andamento_rpc.called)

    def test_usuario_pode_ver_processo_falha_fechada(self):
        # Achado N-07: Falha em RPC deve retornar False (Fail-Closed) e suprimir alerta
        mock_supabase = MagicMock()
        mock_supabase.rpc.side_effect = Exception("Conexão com PostgreSQL recusada")

        repo = WorkerRepositorio(supabase_client=mock_supabase)
        pode_ver = repo.usuario_pode_ver_processo("u1", "p1")

        self.assertFalse(pode_ver)


if __name__ == "__main__":
    unittest.main()
