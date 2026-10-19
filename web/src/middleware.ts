import { NextResponse, type NextRequest } from 'next/server';

/**
 * PUMIP-SEDUC: Middleware de Proteção de Rotas e Isolamento de Sessão (SEG-02 / FE-01)
 * Em modo de produção, assegura que requisições para rotas restritas possuam
 * cookie de sessão institucional válido, redirecionando usuários não autenticados para /login.
 */
export function middleware(request: NextRequest) {
  const mode = process.env.NEXT_PUBLIC_PUMIP_MODE;
  const isProduction = mode === 'production';

  const { pathname } = request.nextUrl;

  // Em modo demonstração, permite navegação livre para testes de usabilidade e RLS
  if (!isProduction) {
    return NextResponse.next();
  }

  // Rotas e assets públicos que não exigem sessão prévia
  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.');

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Em produção: verifica se há cookie de sessão Supabase
  const allCookies = request.cookies.getAll();
  const hasSupabaseSession = allCookies.some(
    (c) =>
      c.name.startsWith('sb-') ||
      c.name.includes('supabase') ||
      c.name.includes('auth-token')
  );

  if (!hasSupabaseSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
