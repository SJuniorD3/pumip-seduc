/**
 * PUMIP-SEDUC: Cliente Supabase para Server Components e Server Actions
 * Em conformidade com o padrão oficial @supabase/ssr utilizando cookies de next/headers.
 */
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function criarClienteServidor() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(lista) {
          try {
            lista.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Em Server Components a escrita falha intencionalmente; a renovação ocorre no middleware
          }
        },
      },
    }
  );
}
