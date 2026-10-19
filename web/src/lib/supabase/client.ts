/**
 * PUMIP-SEDUC: Cliente Supabase para Componentes de Cliente (Browser)
 * Em conformidade com o padrão oficial @supabase/ssr.
 */
import { createBrowserClient } from '@supabase/ssr';

export function criarClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  );
}
