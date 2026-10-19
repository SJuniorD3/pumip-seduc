import test, { describe } from 'node:test';
import assert from 'node:assert';
import { 
  getEasterDate, 
  getFeriadosAno, 
  calcularPermanenciaDetelhada 
} from '../src/lib/diasUteis';
import { 
  classificarInercia, 
  isSlaEstourado, 
  SLA_CONFIG 
} from '../src/lib/slaConfig';

describe('Cálculo de Prazos, Feriados e Inércia Processual (RF04 / Lei 14.133/2021)', () => {
  test('Algoritmo Meeus/Jones/Butcher: Cálculo astronômico exato da Páscoa', () => {
    // Páscoa 2024: 31 de Março
    const pascoa2024 = getEasterDate(2024);
    assert.strictEqual(pascoa2024.getUTCFullYear(), 2024);
    assert.strictEqual(pascoa2024.getUTCMonth(), 2); // 0-indexed: 2 = Março
    assert.strictEqual(pascoa2024.getUTCDate(), 31);

    // Páscoa 2025: 20 de Abril
    const pascoa2025 = getEasterDate(2025);
    assert.strictEqual(pascoa2025.getUTCMonth(), 3); // 3 = Abril
    assert.strictEqual(pascoa2025.getUTCDate(), 20);

    // Páscoa 2026: 05 de Abril
    const pascoa2026 = getEasterDate(2026);
    assert.strictEqual(pascoa2026.getUTCMonth(), 3); // 3 = Abril
    assert.strictEqual(pascoa2026.getUTCDate(), 5);
  });

  test('Feriados Oficiais de São Luís - MA e Estado do Maranhão presentes no calendário', () => {
    const feriados2026 = getFeriadosAno(2026);
    const feriadosMap = new Map(feriados2026.map(f => [f.data, f]));

    // 1. Estadual do Maranhão: 28 de Julho (Adesão do Maranhão)
    const adesaoMA = feriadosMap.get('2026-07-28');
    assert.ok(adesaoMA, '28/07 (Adesão do Maranhão) deve constar no calendário');
    assert.strictEqual(adesaoMA.tipo, 'ESTADUAL_MA');

    // 2. Municipais de São Luís:
    // - 29 de Junho: São Pedro
    const saoPedro = feriadosMap.get('2026-06-29');
    assert.ok(saoPedro, '29/06 (São Pedro) deve constar no calendário');
    assert.strictEqual(saoPedro.tipo, 'MUNICIPAL_SLZ');

    // - 08 de Setembro: Aniversário de São Luís / Natividade
    const anivSLZ = feriadosMap.get('2026-09-08');
    assert.ok(anivSLZ, '08/09 (Aniversário de São Luís) deve constar no calendário');
    assert.strictEqual(anivSLZ.tipo, 'MUNICIPAL_SLZ');

    // - 08 de Dezembro: Nossa Senhora da Conceição
    const conceicao = feriadosMap.get('2026-12-08');
    assert.ok(conceicao, '08/12 (Nossa Senhora da Conceição) deve constar no calendário');
    assert.strictEqual(conceicao.tipo, 'MUNICIPAL_SLZ');

    // 3. Feriado Nacional Consciência Negra (Lei 14.759/2023): 20 de Novembro
    const zumbi = feriadosMap.get('2026-11-20');
    assert.ok(zumbi, '20/11 (Consciência Negra) deve constar como feriado nacional fixo');
    assert.strictEqual(zumbi.tipo, 'NACIONAL');

    // 4. Ponto Facultativo SEDUC: 28 de Outubro (Dia do Servidor Público)
    const servidor = feriadosMap.get('2026-10-28');
    assert.ok(servidor, '28/10 (Dia do Servidor Público) deve constar como ponto facultativo');
    assert.strictEqual(servidor.tipo, 'PONTO_FACULTATIVO_SEDUC');
  });

  test('Conformidade Art. 183 Lei 14.133/2021: Exclusão do dia de início e inclusão do dia final', () => {
    // Processo entrou na quarta-feira (2026-04-08) e saiu na sexta-feira (2026-04-10)
    // Dias: Quarta (não conta), Quinta (1º dia útil), Sexta (2º dia útil)
    // Resultado esperado: 2 dias úteis, 2 dias corridos
    const res = calcularPermanenciaDetelhada('2026-04-08', '2026-04-10');
    assert.strictEqual(res.diasCorridos, 2);
    assert.strictEqual(res.diasUteis, 2);
    assert.strictEqual(res.feriadosCruzados.length, 0);
  });

  test('Fim de Semana: Entrada na sexta-feira e saída na segunda-feira subsequente', () => {
    // 2026-04-10 (Sexta-feira) -> 2026-04-13 (Segunda-feira)
    // Sexta (dia de entrada, excluído)
    // Sábado (fim de semana)
    // Domingo (fim de semana)
    // Segunda (incluído, 1º dia útil)
    // Resultado esperado: 3 dias corridos, 1 dia útil
    const res = calcularPermanenciaDetelhada('2026-04-10', '2026-04-13');
    assert.strictEqual(res.diasCorridos, 3);
    assert.strictEqual(res.diasUteis, 1);
  });

  test('Cruzamento de Feriado Estadual do Maranhão (28/07)', () => {
    // Em 2026, 28/07 cai em uma terça-feira
    // Entrada: 2026-07-27 (Segunda-feira)
    // Saída: 2026-07-29 (Quarta-feira)
    // Segunda: excluída (início)
    // Terça (28/07): FERIADO ESTADUAL DO MARANHÃO (não conta como dia útil)
    // Quarta (29/07): dia útil (1 dia útil)
    const res = calcularPermanenciaDetelhada('2026-07-27', '2026-07-29');
    assert.strictEqual(res.diasCorridos, 2);
    assert.strictEqual(res.diasUteis, 1, 'Terça-feira 28/07 deve ser descontada por ser Adesão do MA');
    assert.strictEqual(res.feriadosCruzados.length, 1);
    assert.strictEqual(res.feriadosCruzados[0].id, 'est-01-2026');
  });

  test('Classificação de Inércia Processual da SEDUC (SLA e Alertas)', () => {
    assert.strictEqual(SLA_CONFIG.META_DIAS_UTEIS, 5);
    assert.strictEqual(SLA_CONFIG.LIMIAR_CRITICO, 10);

    assert.strictEqual(classificarInercia(2), 'REGULAR');
    assert.strictEqual(classificarInercia(4), 'REGULAR');
    assert.strictEqual(classificarInercia(5), 'ATENCAO');
    assert.strictEqual(classificarInercia(9), 'ATENCAO');
    assert.strictEqual(classificarInercia(10), 'CRITICO');
    assert.strictEqual(classificarInercia(25), 'CRITICO');

    assert.strictEqual(isSlaEstourado(4), false);
    assert.strictEqual(isSlaEstourado(5), true);
    assert.strictEqual(isSlaEstourado(12), true);
  });

  test('Resiliência a Fusos Horários (America/Fortaleza UTC-3) e Validação de Entradas Inválidas (NaN)', () => {
    // Horário noturno no fuso UTC-3: 2026-04-08 às 22h30min (em UTC já seria 2026-04-09 01h30min)
    // O sistema deve reconhecer como 2026-04-08 e contar a partir de 2026-04-09
    const resTz = calcularPermanenciaDetelhada('2026-04-08T22:30:00-03:00', '2026-04-10T10:00:00-03:00');
    assert.strictEqual(resTz.diasCorridos, 2);
    assert.strictEqual(resTz.diasUteis, 2);

    // Entradas inválidas devem retornar 0 de forma segura sem lançar exceção ou NaN
    const resInvalida = calcularPermanenciaDetelhada('data_invalida', '2026-04-10');
    assert.strictEqual(resInvalida.diasCorridos, 0);
    assert.strictEqual(resInvalida.diasUteis, 0);
    assert.strictEqual(resInvalida.feriadosCruzados.length, 0);

    const resVazia = calcularPermanenciaDetelhada('', null);
    assert.strictEqual(resVazia.diasCorridos, 0);
    assert.strictEqual(resVazia.diasUteis, 0);
  });
});
