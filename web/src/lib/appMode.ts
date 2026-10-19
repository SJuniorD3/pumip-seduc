/**
 * PUMIP-SEDUC: Controle de Modo de Operação (Demo vs Produção)
 * Demo: permite perfis de teste, dados mock, banner visível
 * Produção: exige Supabase Auth real, bloqueia DEMO_USERS
 */

export type AppMode = 'demo' | 'production';

export function getAppMode(): AppMode {
  // REMEDIAÇÃO N-06: Produção é o padrão estrito. Modo demo exige valor explícito.
  return process.env.NEXT_PUBLIC_PUMIP_MODE === 'demo' ? 'demo' : 'production';
}

export function isDemoMode(): boolean {
  return getAppMode() === 'demo';
}

export function isProductionMode(): boolean {
  return getAppMode() === 'production';
}
