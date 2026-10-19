"""
Testes Unitários: Avaliação dos 5 Gatilhos de Alerta (Seção 6.5)
Compatível com Pytest e unittest da Standard Library.
"""

import unittest
from datetime import datetime, timedelta, timezone
from pumip_worker.alertas import (
    avaliar_gatilho_inercia_sla,
    avaliar_gatilho_vencimento_contrato,
    avaliar_gatilho_publicacao_pncp,
    avaliar_gatilho_palavra_chave,
    avaliar_alerta
)
from pumip_worker.modelos import Processo, EventoFonte


class TestGatilhosAlerta(unittest.TestCase):
    def test_gatilho_inercia_sla(self):
        proc_critico = Processo(id="p1", dias_uteis_parado=15, dias_parado_na_unidade=15)
        proc_regular = Processo(id="p2", dias_uteis_parado=4, dias_parado_na_unidade=4)

        params = {"dias_limite": 10}

        self.assertTrue(avaliar_gatilho_inercia_sla(params, proc_critico))
        self.assertFalse(avaliar_gatilho_inercia_sla(params, proc_regular))

    def test_gatilho_vencimento_contrato(self):
        agora = datetime.now(timezone.utc)
        data_45_dias = (agora + timedelta(days=45)).isoformat()
        data_120_dias = (agora + timedelta(days=120)).isoformat()

        params = {"marcos_dias": [90, 60, 30]}

        # 45 dias está dentro do marco de 60 dias
        marco = avaliar_gatilho_vencimento_contrato(params, data_45_dias)
        self.assertEqual(marco, 60)

        # 120 dias não atingiu nenhum marco crítico (ainda distante)
        self.assertIsNone(avaliar_gatilho_vencimento_contrato(params, data_120_dias))

    def test_gatilho_publicacao_pncp(self):
        evento_pncp = EventoFonte(
            origem="PNCP",
            data_hora_evento="2026-10-10T14:00:00Z",
            unidade_setor="CSL",
            descricao_andamento="Edital Publicado",
            tipo_documento="EDITAL_PNCP"
        )

        evento_sei = EventoFonte(
            origem="SEI",
            data_hora_evento="2026-10-10T14:00:00Z",
            unidade_setor="SUDES",
            descricao_andamento="Despacho Interno",
            tipo_documento="DESPACHO"
        )

        params = {}
        self.assertTrue(avaliar_gatilho_publicacao_pncp(params, evento_pncp))
        self.assertFalse(avaliar_gatilho_publicacao_pncp(params, evento_sei))

    def test_gatilho_palavra_chave(self):
        evento_juridico = EventoFonte(
            origem="SEI",
            data_hora_evento="2026-10-10T14:00:00Z",
            unidade_setor="ASJUR",
            descricao_andamento="Emissão de Parecer Jurídico Conclusivo",
            documento_anexado="Parecer_045_2026.pdf"
        )

        params_parecer = {"palavra_chave": "parecer"}
        params_reforma = {"palavra_chave": "reforma"}

        self.assertTrue(avaliar_gatilho_palavra_chave(params_parecer, evento_juridico))
        self.assertFalse(avaliar_gatilho_palavra_chave(params_reforma, evento_juridico))

    def test_avaliar_alerta_unificado(self):
        proc = Processo(id="p1", dias_uteis_parado=12)
        self.assertTrue(avaliar_alerta("INERCIA_SLA", {"dias_limite": 10}, proc))
        self.assertFalse(avaliar_alerta("INERCIA_SLA", {"dias_limite": 15}, proc))


if __name__ == "__main__":
    unittest.main()
