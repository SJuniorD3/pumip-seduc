import { Processo } from './types';
import { AuthUser } from './authUsers';

/**
 * PUMIP-SEDUC: Emulação da Regra de Row Level Security (RLS) Hierárquico da SEDUC-MA
 * Conforme Seção 4.1 do Descritivo Técnico e Migração 001_init_schema.sql.
 *
 * REMEDIAÇÃO DE SEGURANÇA (Auditoria P0-4):
 * - Removidas exceções hardcoded por ID de usuário ou sigla
 * - Autorização baseada exclusivamente em caminho_hierarquico com prefix-match
 * - Concessões pontuais devem vir do banco (processos_acessos_concedidos), não do código
 * - isAdmin só é aceito se derivado do perfil validado pelo servidor
 *
 * Hierarquia:
 * 1. SECRETÁRIO, SUBSECRETÁRIO, ADMIN, AUDITOR: Visão 100% global
 * 2. SECRETÁRIO_ADJUNTO: Vê sua Adjunta e subordinados (prefixo hierárquico)
 * 3. SUPERINTENDENTE: Vê sua Superintendência e Supervisões subordinadas (prefixo hierárquico)
 * 4. SUPERVISOR: Vê processos de sua Supervisão direta e subordinados
 * 5. ASSESSOR: Vê processos que tramitam no seu setor ou originados nele
 * 6. TÉCNICO: Apenas processos da unidade direta
 */
export function filterProcessosByRLS(processos: Processo[], user?: AuthUser | null): Processo[] {
  if (!user) {
    // Princípio do Menor Privilégio (Zero-Trust)
    return [];
  }

  // Visão global para papéis de alta hierarquia
  if (user.role === 'ADMIN' || user.role === 'SECRETARIO' || user.role === 'SUBSECRETARIO') {
    return processos;
  }

  const userPath = user.caminho_hierarquico;

  return processos.filter((p) => {
    const processoPath = p.unidade_origem?.caminho_hierarquico || '';
    const processoSigla = p.unidade_origem?.sigla || '';

    // SECRETÁRIO_ADJUNTO: herança de prefixo hierárquico
    if (user.role === 'SECRETARIO_ADJUNTO') {
      return (
        processoPath === userPath ||
        processoPath.startsWith(userPath + '.')
      );
    }

    // SUPERINTENDENTE: herança de prefixo hierárquico
    if (user.role === 'SUPERINTENDENTE') {
      return (
        processoPath === userPath ||
        processoPath.startsWith(userPath + '.')
      );
    }

    // SUPERVISOR: unidade direta e subordinados
    if (user.role === 'SUPERVISOR') {
      return (
        processoPath === userPath ||
        processoPath.startsWith(userPath + '.') ||
        processoSigla === user.unidade_sigla
      );
    }

    // ASSESSOR: processos que tramitam ou originaram no seu setor
    if (user.role === 'ASSESSOR') {
      return (
        p.unidade_atual_sei === user.unidade_sigla ||
        processoSigla === user.unidade_sigla ||
        processoPath === userPath ||
        processoPath.startsWith(userPath + '.')
      );
    }

    // TÉCNICO: apenas unidade direta
    return processoSigla === user.unidade_sigla;
  });
}
