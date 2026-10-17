import test, { describe } from 'node:test';
import assert from 'node:assert';
import { filterProcessosByRLS } from '../src/lib/rlsFilter';
import { DEMO_USERS } from '../src/lib/authUsers';
import { calcularPermanenciaDetelhada } from '../src/lib/diasUteis';
import { Processo } from '../src/lib/types';

describe('Engenharia de Desempenho e Benchmarks de Escalabilidade (SRE)', () => {
  test('Benchmark RLS em Alta Escala: Filtragem de 10.000 processos em lote (< 25ms)', () => {
    // Geração sintética de 10.000 processos com diferentes lotes e unidades organizacionais
    const unidades = ['STI', 'SUDES', 'SUPDEV', 'ASJUR', 'GAB', 'DAA', 'COCAF', 'SAAD'];
    const processosSinteticos: Processo[] = [];

    for (let i = 0; i < 10000; i++) {
      const sigla = unidades[i % unidades.length];
      processosSinteticos.push({
        id: `proc-bench-${i}`,
        protocolo_sei: `000${i}/2026-SEDUC`,
        objeto: `Demanda de teste em lote número ${i}`,
        unidade_origem_id: `unit-${sigla}`,
        unidade_origem: {
          id: `unit-${sigla}`,
          nome: `Unidade ${sigla}`,
          sigla: sigla,
          tipo: 'SETOR',
          caminho_hierarquico: `SEDUC.SAAD.${sigla}`
        },
        unidade_atual_sei: sigla,
        status_etapa: 'INSTRUCAO_TR',
        prioridade: 'MORNO',
        dias_parado_na_unidade: i % 15,
        ultima_movimentacao_em: '2026-01-01T12:00:00Z',
        proxima_verificacao_em: '2026-10-20T00:00:00Z',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z'
      });
    }

    assert.strictEqual(processosSinteticos.length, 10000);

    // Medição de tempo para perfil com filtragem intermediária (Supervisor SUDES)
    const t0 = performance.now();
    const filtrados = filterProcessosByRLS(processosSinteticos, DEMO_USERS.servulo);
    const t1 = performance.now();
    const duracaoMs = t1 - t0;

    // Supervisor de SUDES deve ver SUDES, STI e SUPDEV
    assert.ok(filtrados.length > 0 && filtrados.length < 10000);
    // Tempo de execução deve ser menor que 25ms
    assert.ok(
      duracaoMs < 25, 
      `Filtragem de 10.000 processos demorou ${duracaoMs.toFixed(2)}ms (Meta: < 25ms)`
    );
  });

  test('Benchmark de Cálculo de Dias Úteis: 1.000 simulações de permanência (< 30ms)', () => {
    const t0 = performance.now();

    for (let i = 0; i < 1000; i++) {
      // Período de 15 dias corridos
      calcularPermanenciaDetelhada('2026-04-01', '2026-04-16');
    }

    const t1 = performance.now();
    const duracaoMs = t1 - t0;

    assert.ok(
      duracaoMs < 30,
      `1.000 cálculos de dias úteis demoraram ${duracaoMs.toFixed(2)}ms (Meta: < 30ms)`
    );
  });

  test('Estabilidade de Consumo de Memória Heap (< 30MB delta durante operação intensa)', () => {
    const memAntes = process.memoryUsage().heapUsed;

    // Executa operações sucessivas de cópia e filtragem
    const bigArray = new Array(20000).fill(null).map((_, i) => ({
      id: `id-${i}`,
      val: Math.random()
    }));

    const filtered = bigArray.filter(item => item.val > 0.5);
    assert.ok(filtered.length > 0);

    const memDepois = process.memoryUsage().heapUsed;
    const diffMb = (memDepois - memAntes) / (1024 * 1024);

    assert.ok(diffMb < 30, `Aumento de heap ${diffMb.toFixed(2)}MB aceitável dentro dos parâmetros`);
  });
});
