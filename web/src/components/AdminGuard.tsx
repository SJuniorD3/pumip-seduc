'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/authContext';
import { isDemoMode } from '../lib/appMode';
import { Breadcrumb } from './Breadcrumb';
import { ShieldAlert, ArrowLeft, KeyRound, Lock, UserCheck } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
  moduloNome: string;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children, moduloNome }) => {
  const { user, isAuthenticated, loginAs } = useAuth();

  if (isAuthenticated && user?.isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <Breadcrumb
        items={[
          { label: 'Administração', href: '#' },
          { label: moduloNome, isCurrent: true }
        ]}
      />

      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-red-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs bg-red-100 text-red-800 font-bold px-3 py-1 rounded-full border border-red-200 uppercase tracking-wider">
            Acesso Restrito: ADMIN Requerido
          </span>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-3">
            Permissões Administrativas Insuficientes
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mt-2 leading-relaxed">
            O módulo <strong>{moduloNome}</strong> é exclusivo para administradores de segurança e governança de TI da SEDUC-MA.
          </p>
        </div>

        {/* Detalhes da Sessão Atual */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-semibold text-slate-700">
            <span>Sua Sessão Atual:</span>
            <span className="text-slate-500 font-mono text-xs">ID: {user.id}</span>
          </div>
          <div className="space-y-1 text-slate-600">
            <p><strong>Nome:</strong> {user.nome}</p>
            <p><strong>Cargo:</strong> {user.cargo_titulo}</p>
            <p><strong>Lotação:</strong> {user.unidade_sigla} ({user.unidade_nome})</p>
            <p><strong>Perfil no Sistema:</strong> <span className="text-red-700 font-bold">{user.role}</span> (Requer: ADMIN)</p>
          </div>
        </div>

        {/* Ações: Voltar ou Alternar Perfil em Modo Demonstração */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel Executivo</span>
          </Link>

          {isDemoMode() && (
            <button
              type="button"
              onClick={() => loginAs('admin')}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <KeyRound className="w-4 h-4" />
              <span>Alternar para Perfil ADMIN (Modo de Demonstração)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
