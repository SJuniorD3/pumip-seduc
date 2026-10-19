"""
Testes Unitários: Resiliência e Circuit Breaker (Seção 6.6)
Compatível com Pytest e unittest da Standard Library.
"""

import unittest
from pumip_worker.resiliencia import CircuitBreakerStatus, GerenciadorResiliencia


class TestResilienciaCircuitBreaker(unittest.TestCase):
    def test_circuit_breaker_transicoes(self):
        cb = CircuitBreakerStatus(fonte="TESTE")

        # Circuito inicialmente fechado
        self.assertFalse(cb.is_aberto())
        self.assertEqual(cb.falhas_consecutivas, 0)

        # 4 falhas consecutivas: limite é 5, continua fechado
        for i in range(4):
            cb.registrar_falha(f"Erro {i+1}")
            self.assertFalse(cb.is_aberto())

        # 5ª falha consecutiva: abre o circuito
        cb.registrar_falha("Erro 5")
        self.assertTrue(cb.is_aberto())
        self.assertEqual(cb.ultimo_motivo, "Erro 5")

        # Sucesso reseta o contador e fecha o circuito
        cb.registrar_sucesso()
        self.assertFalse(cb.is_aberto())
        self.assertEqual(cb.falhas_consecutivas, 0)

    def test_gerenciador_resiliencia(self):
        gerenciador = GerenciadorResiliencia()

        self.assertTrue(gerenciador.pode_executar("SEI"))
        self.assertTrue(gerenciador.pode_executar("STARTGOV"))
        self.assertTrue(gerenciador.pode_executar("PNCP"))

        # Simula 5 falhas no StartGov
        for _ in range(5):
            gerenciador.registrar_resultado("STARTGOV", sucesso=False, motivo="503 Service Unavailable")

        self.assertFalse(gerenciador.pode_executar("STARTGOV"))
        # As outras fontes continuam operacionais
        self.assertTrue(gerenciador.pode_executar("PNCP"))
        self.assertTrue(gerenciador.pode_executar("SEI"))


if __name__ == "__main__":
    unittest.main()
