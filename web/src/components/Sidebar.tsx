'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/authContext';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  BellRing, 
  FileSearch,
  Server,
  Network,
  Users,
  GitMerge,
  ClipboardList,
  BarChart3,
  Calendar,
  X,
  LogOut,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Visão Geral', href: '/', icon: LayoutDashboard },
    { label: 'Processos Monitorados', href: '/processos', icon: FileSearch },
    { label: 'Quadro Kanban', href: '/kanban', icon: KanbanSquare },
    { label: 'Vínculos SEI/StartGov', href: '/vinculos', icon: GitMerge },
    { label: 'Plano Anual (PCA)', href: '/pca', icon: ClipboardList },
    { label: 'Relatórios & Prazos', href: '/relatorios', icon: BarChart3 },
    { label: 'Central de Alertas', href: '/alertas', icon: BellRing },
  ];

  const adminItems = [
    { label: 'Organograma Setorial', href: '/admin/organograma', icon: Network },
    { label: 'Perfis & Acessos', href: '/admin/usuarios', icon: Users },
    { label: 'Feriados & Prazos', href: '/admin/feriados', icon: Calendar },
  ];

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      <div className="p-3.5 space-y-4 overflow-y-auto">
        {/* Cabeçalho do Drawer no Mobile com Botão Fechar */}
        <div className="flex items-center justify-between lg:hidden pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              P
            </div>
            <span className="font-bold text-white text-sm">Menu de Navegação</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card do Usuário Logado na Sidebar */}
        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user.avatar_iniciais || 'SJ'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {user.nome}
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {user.unidade_sigla} &bull; {user.role}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleLinkClick();
              logout();
            }}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/60 rounded-lg transition shrink-0"
            title="Sair da conta"
            aria-label="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Navegação Operacional */}
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-2">
            Operação & Inteligência
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md font-semibold'
                      : 'hover:bg-slate-800 hover:text-white text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Gestão Administrativa Restrita */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              Administração
            </p>
            <span className={`text-[9px] px-1 py-0.2 rounded font-bold border ${
              user.isAdmin 
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-red-950 text-red-300 border border-red-800'
            }`}>
              {user.isAdmin ? 'ADMIN ATIVO' : 'ADMIN'}
            </span>
          </div>
          <nav className="space-y-1">
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? 'bg-slate-800 text-blue-400 font-bold border-l-2 border-blue-500 pl-2.5'
                      : 'hover:bg-slate-800 hover:text-white text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Status das Fontes Integradas */}
        <div className="pt-2 border-t border-slate-800/80">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-2">
            Fontes Integradas
          </p>
          <div className="space-y-1 px-3 text-xs">
            <div className="flex items-center justify-between text-slate-300 bg-slate-800/60 p-1.5 rounded">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span className="text-[11px]">SEI! GOVMA</span>
              </span>
              <span className="text-[9px] bg-blue-900/60 text-blue-200 px-1.5 py-0.2 rounded font-medium">Consulta</span>
            </div>
            <div className="flex items-center justify-between text-slate-300 bg-slate-800/60 p-1.5 rounded">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[11px]">StartGov</span>
              </span>
              <span className="text-[9px] bg-emerald-900/60 text-emerald-200 px-1.5 py-0.2 rounded font-medium">Scraper</span>
            </div>
            <div className="flex items-center justify-between text-slate-300 bg-slate-800/60 p-1.5 rounded">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span className="text-[11px]">PNCP Federal</span>
              </span>
              <span className="text-[9px] bg-amber-900/60 text-amber-200 px-1.5 py-0.2 rounded font-medium">API Art. 94</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé da Sidebar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-xs shrink-0">
        <div className="flex items-center space-x-2 text-slate-300 mb-0.5">
          <Server className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-slate-200 text-[11px]">Zero-Cost Stack</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Next.js 14 + Supabase + GitHub Actions + Resend.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Versão Desktop (Fixa na lateral para telas grandes >= lg) */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-slate-300 flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-800 shrink-0">
        {sidebarContent}
      </aside>

      {/* 2. Versão Mobile/Tablet (Off-canvas Drawer deslizante com Backdrop) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          <aside className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-300 shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200 border-r border-slate-800">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
