"""
Testes Unitários: Resiliência e Circuit Breaker (Seção 6.6)
"""

import time
import pytest
from pumip_worker.resiliencia import CircuitBreakerStatus, GerenciadorResiliencia


def test_circuit_breaker_transicoes():
    cb = CircuitBreakerStatus(fonte="TESTE")

    # Circuito inicialmente fechado
    assert cb.is_aberto() is False
    assert cb.falhas_consecutivas == 0

    # 4 falhas consecutivas: limite é 5, continua fechado
    for i in range(4):
        cb.registrar_falha(f"Erro {i+1}")
        assert cb.is_aberto() is False

    # 5ª falha consecutiva: abre o circuito
    cb.registrar_falha("Erro 5")
    assert cb.is_aberto() is True
    assert cb.ultimo_motivo == "Erro 5"

    # Sucesso reseta o contador e fecha o circuito
    cb.registrar_sucesso()
    assert cb.is_aberto() is False
    assert cb.falhas_consecutivas == 0


def test_gerenciador_resiliencia():
    gerenciador = GerenciadorResiliencia()

    assert gerenciador.pode_executar("SEI") is True
    assert gerenciador.pode_executar("STARTGOV") is True
    assert gerenciador.pode_executar("PNCP") is True

    # Simula 5 falhas no StartGov
    for _ in range(5):
        gerenciador.registrar_resultado("STARTGOV", sucesso=False, motivo="503 Service Unavailable")

    assert gerenciador.pode_executar("STARTGOV") is False
    # As outras fontes continuam operacionais
    assert gerenciador.pode_executar("PNCP") is True
    assert gerenciador.pode_executar("SEI") is True
