/**
 * PUMIP-SEDUC: Obtenção de Perfil Institucional no Servidor (SEG-02 / FE-01)
 * Consulta a sessão no Supabase Auth e carrega os dados oficiais de perfis_usuarios
 * e unidades_organizacionais diretamente no servidor, impedindo manipulações via localStorage.
 */
import { criarClienteServidor } from '../supabase/server';
import { AuthUser, DEMO_USERS } from '../authUsers';
import { isDemoMode } from '../appMode';

export async function obterPerfil(): Promise<AuthUser | null> {
  const supabase = criarClienteServidor();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (user && !authError) {
      // Busca perfil no banco de dados com a respectiva unidade organizacional
      const { data: perfil, error: dbError } = await supabase
        .from('perfis_usuarios')
        .select(`
          id,
          nome,
          email,
          role,
          cargo_titulo,
          unidade_id,
          unidades_organizacionais (
            nome,
            sigla,
            caminho_hierarquico
          )
        `)
        .eq('id', user.id)
        .single();

      if (perfil && !dbError) {
        const rawUOrg = perfil.unidades_organizacionais;
        const uOrg = Array.isArray(rawUOrg) ? rawUOrg[0] : rawUOrg;

        const nome = perfil.nome || user.email?.split('@')[0] || 'Servidor';
        const iniciais = nome
          .split(' ')
          .map((n: string) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();

        return {
          id: perfil.id,
          nome,
          email: perfil.email || user.email || '',
          role: perfil.role,
          cargo_titulo: perfil.cargo_titulo || 'Servidor Público',
          unidade_sigla: uOrg?.sigla || 'SEDUC',
          unidade_nome: uOrg?.nome || 'Secretaria de Estado da Educação',
          caminho_hierarquico: uOrg?.caminho_hierarquico || 'SEDUC',
          isAdmin: perfil.role === 'ADMIN',
          avatar_iniciais: iniciais
        };
      }
    }
  } catch (err) {
    console.warn('Erro ao consultar sessão/perfil no servidor:', err);
  }

  // Em modo demonstração, permite fallback para homologação
  if (isDemoMode()) {
    return DEMO_USERS.servulo;
  }

  return null;
}
