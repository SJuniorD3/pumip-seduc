'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  BellRing, 
  FileSearch,
  Server,
  Network,
  Users,
  ShieldAlert,
  GitMerge,
  ClipboardList,
  BarChart3,
  Calendar,
  Layers
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

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

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-800 shrink-0">
      <div className="p-3.5 space-y-5 overflow-y-auto">
        {/* Navegação Operacional */}
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-3 mb-2">
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
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md font-semibold'
                      : 'hover:bg-slate-800 hover:text-white text-slate-400'
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
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Administração
            </p>
            <span className="text-[9px] bg-red-950 text-red-400 border border-red-800 px-1 py-0.2 rounded font-bold">
              ADMIN
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
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-slate-800 text-blue-400 font-bold border-l-2 border-blue-500 pl-2.5'
                      : 'hover:bg-slate-800 hover:text-white text-slate-400'
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
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-3 mb-2">
            Fontes Integradas
          </p>
          <div className="space-y-1 px-3 text-xs">
            <div className="flex items-center justify-between text-slate-400 bg-slate-800/60 p-1.5 rounded">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span className="text-[11px]">SEI! GOVMA</span>
              </span>
              <span className="text-[9px] bg-blue-900/60 text-blue-300 px-1 py-0.2 rounded">Consulta</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 bg-slate-800/60 p-1.5 rounded">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[11px]">StartGov</span>
              </span>
              <span className="text-[9px] bg-emerald-900/60 text-emerald-300 px-1 py-0.2 rounded">Scraper</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 bg-slate-800/60 p-1.5 rounded">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span className="text-[11px]">PNCP Federal</span>
              </span>
              <span className="text-[9px] bg-amber-900/60 text-amber-300 px-1 py-0.2 rounded">API Art. 94</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé da Sidebar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-xs shrink-0">
        <div className="flex items-center space-x-2 text-slate-400 mb-0.5">
          <Server className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-slate-300 text-[11px]">Zero-Cost Stack</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Next.js 14 + Supabase + GitHub Actions + Resend.
        </p>
      </div>
    </aside>
  );
};
