/**
 * PUMIP-SEDUC: Controle de Modo de Operação (Demo vs Produção)
 * Demo: permite perfis de teste, dados mock, banner visível
 * Produção: exige Supabase Auth real, bloqueia DEMO_USERS
 */

export type AppMode = 'demo' | 'production';

export function getAppMode(): AppMode {
  const mode = process.env.NEXT_PUBLIC_PUMIP_MODE;
  if (mode === 'production') return 'production';
  return 'demo'; // Padrão seguro para desenvolvimento
}

export function isDemoMode(): boolean {
  return getAppMode() === 'demo';
}

export function isProductionMode(): boolean {
  return getAppMode() === 'production';
}
