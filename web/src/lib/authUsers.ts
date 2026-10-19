export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: 'SECRETARIO' | 'SUBSECRETARIO' | 'SECRETARIO_ADJUNTO' | 'SUPERINTENDENTE' | 'SUPERVISOR' | 'ASSESSOR' | 'TECNICO' | 'ADMIN' | 'AUDITOR';
  cargo_titulo: string;
  unidade_sigla: string;
  unidade_nome: string;
  caminho_hierarquico: string;
  isAdmin: boolean;
  avatar_iniciais: string;
}

export const DEMO_USERS: Record<string, AuthUser> = {
  servulo: {
    id: 'user-servulo',
    nome: 'Supervisor(a) de Sistemas',
    email: 'supervisor.sudes@seduc.ma.gov.br',
    role: 'SUPERVISOR',
    cargo_titulo: 'Supervisor de Desenvolvimento de Sistemas (SUDES)',
    unidade_sigla: 'SUDES',
    unidade_nome: 'Supervisão de Desenvolvimento de Sistemas',
    caminho_hierarquico: 'SEDUC.SAAD.STI.SUDES',
    isAdmin: false,
    avatar_iniciais: 'SS'
  },
  natalia: {
    id: 'user-natalia',
    nome: 'Superintendente de TI',
    email: 'superintendente.sti@seduc.ma.gov.br',
    role: 'SUPERINTENDENTE',
    cargo_titulo: 'Superintendente de Tecnologia da Informação (STI)',
    unidade_sigla: 'STI',
    unidade_nome: 'Superintendência de Tecnologia da Informação',
    caminho_hierarquico: 'SEDUC.SAAD.STI',
    isAdmin: false,
    avatar_iniciais: 'ST'
  },
  valter: {
    id: 'user-valter',
    nome: 'Assessor(a) Jurídico(a) Chefe',
    email: 'assessor.asjur@seduc.ma.gov.br',
    role: 'ASSESSOR',
    cargo_titulo: 'Assessor Chefe da Assessoria Jurídica (ASJUR)',
    unidade_sigla: 'ASJUR',
    unidade_nome: 'Assessoria Jurídica da SEDUC',
    caminho_hierarquico: 'SEDUC.ASJUR',
    isAdmin: false,
    avatar_iniciais: 'AJ'
  },
  secretario: {
    id: 'user-secretario',
    nome: 'Secretário(a) de Estado da Educação',
    email: 'gabinete@seduc.ma.gov.br',
    role: 'SECRETARIO',
    cargo_titulo: 'Secretário de Estado da Educação do Maranhão',
    unidade_sigla: 'GAB',
    unidade_nome: 'Gabinete do Secretário de Estado da Educação',
    caminho_hierarquico: 'SEDUC.GAB',
    isAdmin: false,
    avatar_iniciais: 'SE'
  },
  admin: {
    id: 'user-admin',
    nome: 'Administrador de Governança e TI',
    email: 'admin.pumip@seduc.ma.gov.br',
    role: 'ADMIN',
    cargo_titulo: 'Administrador de Segurança & Governança (STI)',
    unidade_sigla: 'STI',
    unidade_nome: 'Superintendência de Tecnologia da Informação',
    caminho_hierarquico: 'SEDUC.SAAD.STI',
    isAdmin: true,
    avatar_iniciais: 'AD'
  }
};
