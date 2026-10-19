/**
 * PUMIP-SEDUC: Configuração Centralizada de SLA e Inércia Processual (RF04 / Lei 14.133/2021)
 *
 * REMEDIAÇÃO (P2-2):
 * Unifica os critérios de SLA e semáforo de inércia em um único ponto da aplicação.
 * Elimina discrepâncias entre KPI Cards, Tabela de Processos, Kanban, Detalhes e Testes.
 *
 * Padrão Institucional SEDUC-MA:
 * - Meta de Permanência por Unidade: máx. 5 dias úteis.
 * - REGULAR: 0 a 4 dias úteis (verde - dentro da meta)
 * - ATENÇÃO: 5 a 9 dias úteis (amarelo - meta de SLA excedida)
 * - CRÍTICO: 10 ou mais dias úteis (vermelho - processo travado / gargalo)
 */

export type NivelInercia = 'REGULAR' | 'ATENCAO' | 'CRITICO';

export interface SemaforoInfo {
  nivel: NivelInercia;
  label: string;
  dotClass: string;
  badgeClass: string;
  textClass: string;
  bgClass: string;
}

export const SLA_CONFIG = {
  META_DIAS_UTEIS: 5,
  LIMIAR_ATENCAO: 5,
  LIMIAR_CRITICO: 10
} as const;

/**
 * Classifica o nível de inércia do processo com base nos dias corridos/úteis na unidade.
 */
export function classificarInercia(diasParado: number): NivelInercia {
  if (diasParado >= SLA_CONFIG.LIMIAR_CRITICO) return 'CRITICO';
  if (diasParado >= SLA_CONFIG.LIMIAR_ATENCAO) return 'ATENCAO';
  return 'REGULAR';
}

/**
 * Retorna se o processo extrapolou a meta padrão de SLA da SEDUC (>= 5 dias úteis).
 */
export function isSlaEstourado(diasParado: number): boolean {
  return diasParado >= SLA_CONFIG.META_DIAS_UTEIS;
}

/**
 * Retorna as classes visuais de estilo (Tailwind) e rótulo semântico do semáforo de inércia.
 */
export function getSemaforoInercia(diasParado: number): SemaforoInfo {
  const nivel = classificarInercia(diasParado);
  switch (nivel) {
    case 'CRITICO':
      return {
        nivel: 'CRITICO',
        label: `Gargalo Crítico (${diasParado} dias - Travado)`,
        dotClass: 'bg-red-500 animate-pulse',
        badgeClass: 'bg-red-50 text-red-700 border-red-200 font-bold',
        textClass: 'text-red-700',
        bgClass: 'bg-red-50 border-red-200'
      };
    case 'ATENCAO':
      return {
        nivel: 'ATENCAO',
        label: `Atenção (${diasParado} dias - SLA excedido)`,
        dotClass: 'bg-amber-500',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
        textClass: 'text-amber-700',
        bgClass: 'bg-amber-50 border-amber-200'
      };
    case 'REGULAR':
    default:
      return {
        nivel: 'REGULAR',
        label: `Regular (${diasParado} dias na unidade)`,
        dotClass: 'bg-emerald-500',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
        textClass: 'text-emerald-700',
        bgClass: 'bg-emerald-50 border-emerald-200'
      };
  }
}
