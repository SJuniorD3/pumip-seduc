import React from 'react';
import { redirect } from 'next/navigation';
import { obterPerfil } from '../../lib/auth/perfil';
import { isDemoMode } from '../../lib/appMode';

/**
 * PUMIP-SEDUC: Layout de Proteção Server-Side para Rotas Administrativas (SEG-02 / ASVS Nível 2)
 * Valida a sessão e o papel do usuário no servidor antes de renderizar qualquer sub-rota /admin/*.
 * Elimina a vulnerabilidade de bypass de privilégios via edição de localStorage no navegador.
 */
interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const perfil = await obterPerfil();

  // Em produção, se o usuário não for ADMIN no banco de dados, redireciona imediatamente
  if (!isDemoMode()) {
    if (!perfil || perfil.role !== 'ADMIN') {
      redirect('/');
    }
  }

  return (
    <div className="w-full">
      {children}
    </div>
  );
}
