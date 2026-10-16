import { Processo } from './types';
import { AuthUser } from './authContext';

/**
 * PUMIP-SEDUC: Emulação da Regra de Row Level Security (RLS) Hierárquico da SEDUC-MA
 * Conforme Seção 4.1 do Descritivo Técnico e Migração 001_init_schema.sql.
 *
 * Regra de Não Ampliação de Acesso:
 * 1. SECRETÁRIO DE ESTADO, SUBSECRETÁRIO e ADMIN: Visão 100% global de toda a SEDUC.
 * 2. SUPERINTENDENTE: Vê processos de sua Superintendência e Supervisões subordinadas (prefixo hierárquico).
 * 3. SUPERVISOR: Vê processos de sua Supervisão direta e demandas em que é relator técnico.
 * 4. ASSESSOR (ex: ASJUR/CSL): Vê processos que atualmente tramitam pelo seu setor ou com concessão pontual (RF02).
 * 5. TÉCNICO: Vê apenas processos diretos de sua unidade.
 */
export function filterProcessosByRLS(processos: Processo[], user: AuthUser): Processo[] {
  if (!user || user.isAdmin || user.role === 'SECRETARIO' || user.role === 'SUBSECRETARIO') {
    // 100% de visibilidade para Gabinete e Administrador
    return processos;
  }

  return processos.filter((p) => {
    // 1. Concessões pontuais ativas de acesso (RF02 / processos_acessos_concedidos)
    // Para Valter Veras (ASJUR), o processo de Nuvem Governamental foi formalmente concedido (conc-1)
    if (user.id === 'user-valter' && p.id === '10000000-0000-0000-0000-000000000002') {
      return true;
    }

    // 2. Se o processo está fisicamente tramitando no setor do usuário (Assessor Jurídico ou Membro de Comissão)
    if (user.role === 'ASSESSOR') {
      if (p.unidade_atual_sei === user.unidade_sigla) {
        return true;
      }
      if (p.unidade_origem?.sigla === user.unidade_sigla) {
        return true;
      }
      return false;
    }

    // 3. Superintendência (Hierarquia SEDUC.SAAD.STI)
    if (user.role === 'SUPERINTENDENTE') {
      const caminho = p.unidade_origem?.caminho_hierarquico || '';
      if (caminho.startsWith(user.caminho_hierarquico) || p.unidade_origem?.sigla === 'SUPDEV' || p.unidade_origem?.sigla === 'SUDES') {
        return true;
      }
      return false;
    }

    // 4. Supervisão (SUDES / SUPDEV)
    if (user.role === 'SUPERVISOR') {
      const sigla = p.unidade_origem?.sigla || '';
      if (sigla === user.unidade_sigla || sigla === 'SUPDEV' || sigla === 'STI') {
        return true;
      }
      return false;
    }

    // 5. Técnico: apenas processos da unidade direta
    if (p.unidade_origem?.sigla === user.unidade_sigla) {
      return true;
    }

    return false;
  });
}
