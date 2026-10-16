/**
 * PUMIP-SEDUC: Cálculo de Dias Úteis e Feriados Oficiais (RF04)
 * Inclui:
 * - Feriados Nacionais (Lei 10.607/2002 e Lei 14.759/2023)
 * - Feriados Estaduais do Maranhão (Adesão do MA - 28 de Julho)
 * - Feriados Municipais de São Luís - MA (São Pedro, Aniversário de São Luís, N. Sra. da Conceição)
 * - Pontos Facultativos e Suspensões de Expediente da SEDUC-MA
 */

export interface Feriado {
  id: string;
  data: string; // Formato YYYY-MM-DD
  nome: string;
  tipo: 'NACIONAL' | 'ESTADUAL_MA' | 'MUNICIPAL_SLZ' | 'PONTO_FACULTATIVO_SEDUC';
  fixo: boolean;
}

/**
 * Retorna a data da Páscoa para um determinado ano (Algoritmo de Meeus/Jones/Butcher).
 */
export function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month, day));
}

/**
 * Gera a lista completa de feriados para um ano específico.
 */
export function getFeriadosAno(year: number): Feriado[] {
  const feriados: Feriado[] = [
    // 1. NACIONAIS FIXOS
    { id: `nac-01-${year}`, data: `${year}-01-01`, nome: 'Confraternização Universal', tipo: 'NACIONAL', fixo: true },
    { id: `nac-02-${year}`, data: `${year}-04-21`, nome: 'Tiradentes', tipo: 'NACIONAL', fixo: true },
    { id: `nac-03-${year}`, data: `${year}-05-01`, nome: 'Dia do Trabalhador', tipo: 'NACIONAL', fixo: true },
    { id: `nac-04-${year}`, data: `${year}-09-07`, nome: 'Independência do Brasil', tipo: 'NACIONAL', fixo: true },
    { id: `nac-05-${year}`, data: `${year}-10-12`, nome: 'Nossa Senhora Aparecida', tipo: 'NACIONAL', fixo: true },
    { id: `nac-06-${year}`, data: `${year}-11-02`, nome: 'Finados', tipo: 'NACIONAL', fixo: true },
    { id: `nac-07-${year}`, data: `${year}-11-15`, nome: 'Proclamação da República', tipo: 'NACIONAL', fixo: true },
    { id: `nac-08-${year}`, data: `${year}-11-20`, nome: 'Dia Nacional de Zumbi e da Consciência Negra', tipo: 'NACIONAL', fixo: true },
    { id: `nac-09-${year}`, data: `${year}-12-25`, nome: 'Natal', tipo: 'NACIONAL', fixo: true },

    // 2. ESTADUAL DO MARANHÃO (Lei Estadual 2.457/1964)
    { id: `est-01-${year}`, data: `${year}-07-28`, nome: 'Adesão do Maranhão à Independência', tipo: 'ESTADUAL_MA', fixo: true },

    // 3. MUNICIPAIS DE SÃO LUÍS - MA (Lei Municipal 3.432/1996)
    { id: `mun-01-${year}`, data: `${year}-06-29`, nome: 'Dia de São Pedro', tipo: 'MUNICIPAL_SLZ', fixo: true },
    { id: `mun-02-${year}`, data: `${year}-09-08`, nome: 'Aniversário de São Luís / Natividade de N. Sra.', tipo: 'MUNICIPAL_SLZ', fixo: true },
    { id: `mun-03-${year}`, data: `${year}-12-08`, nome: 'Nossa Senhora da Conceição', tipo: 'MUNICIPAL_SLZ', fixo: true },
  ];

  // 4. DATAS MÓVEIS (Baseadas na Páscoa)
  const pascoa = getEasterDate(year);

  // Sexta-feira Santa (2 dias antes da Páscoa)
  const sextaSanta = new Date(pascoa);
  sextaSanta.setUTCDate(pascoa.getUTCDate() - 2);
  feriados.push({
    id: `mov-sextasanta-${year}`,
    data: formatDateUtc(sextaSanta),
    nome: 'Sexta-Feira Santa (Paixão de Cristo)',
    tipo: 'NACIONAL',
    fixo: false
  });

  // Carnaval (Terça-feira, 47 dias antes da Páscoa)
  const carnavalTerca = new Date(pascoa);
  carnavalTerca.setUTCDate(pascoa.getUTCDate() - 47);
  feriados.push({
    id: `mov-carnaval-${year}`,
    data: formatDateUtc(carnavalTerca),
    nome: 'Carnaval (Ponto Facultativo Estadual)',
    tipo: 'PONTO_FACULTATIVO_SEDUC',
    fixo: false
  });

  // Corpus Christi (60 dias após a Páscoa)
  const corpusChristi = new Date(pascoa);
  corpusChristi.setUTCDate(pascoa.getUTCDate() + 60);
  feriados.push({
    id: `mov-corpus-${year}`,
    data: formatDateUtc(corpusChristi),
    nome: 'Corpus Christi (Feriado Municipal/Estadual)',
    tipo: 'MUNICIPAL_SLZ',
    fixo: false
  });

  // Dia do Servidor Público (28 de Outubro)
  feriados.push({
    id: `fac-servidor-${year}`,
    data: `${year}-10-28`,
    nome: 'Dia do Servidor Público (Ponto Facultativo SEDUC)',
    tipo: 'PONTO_FACULTATIVO_SEDUC',
    fixo: true
  });

  return feriados;
}

function formatDateUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Recupera feriados e suspensões personalizadas da SEDUC salvas localmente.
 */
export function getFeriadosPersonalizados(): Feriado[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('pumip_feriados_custom');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFeriadosPersonalizados(feriados: Feriado[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pumip_feriados_custom', JSON.stringify(feriados));
}

/**
 * Calcula com precisão a permanência em Dias Corridos e Dias Úteis (RF04).
 * Exclui sábados, domingos e todos os feriados aplicáveis.
 */
export function calcularPermanenciaDetelhada(
  dataEntradaIso: string,
  dataSaidaIso?: string | null
): {
  diasCorridos: number;
  diasUteis: number;
  feriadosCruzados: Feriado[];
} {
  const start = new Date(dataEntradaIso);
  const end = dataSaidaIso ? new Date(dataSaidaIso) : new Date();

  // Zera horários para contagem pura de calendário (Fuso America/Fortaleza / UTC)
  const dStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const dEnd = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

  if (dEnd < dStart) {
    return { diasCorridos: 0, diasUteis: 0, feriadosCruzados: [] };
  }

  const diffTime = dEnd.getTime() - dStart.getTime();
  const diasCorridos = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  // Obter mapa de feriados para os anos cobertos
  const anoInicio = dStart.getUTCFullYear();
  const anoFim = dEnd.getUTCFullYear();
  let todosFeriados: Feriado[] = [];
  for (let y = anoInicio; y <= anoFim; y++) {
    todosFeriados = todosFeriados.concat(getFeriadosAno(y));
  }
  todosFeriados = todosFeriados.concat(getFeriadosPersonalizados());

  const feriadosMap = new Map<string, Feriado>();
  todosFeriados.forEach((f) => feriadosMap.set(f.data, f));

  let diasUteis = 0;
  const feriadosCruzados: Feriado[] = [];

  const current = new Date(dStart);
  // Conta a partir do dia seguinte ao da entrada até o dia de destino
  current.setUTCDate(current.getUTCDate() + 1);

  while (current <= dEnd) {
    const dayOfWeek = current.getUTCDay(); // 0 = Domingo, 6 = Sábado
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = formatDateUtc(current);
    const feriado = feriadosMap.get(dateStr);

    if (feriado && !isWeekend) {
      feriadosCruzados.push(feriado);
    }

    if (!isWeekend && !feriado) {
      diasUteis++;
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return { diasCorridos, diasUteis, feriadosCruzados };
}
