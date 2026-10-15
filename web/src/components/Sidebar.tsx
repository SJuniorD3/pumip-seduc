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
  SlidersHorizontal
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Visão Geral', href: '/', icon: LayoutDashboard },
    { label: 'Processos Monitorados', href: '/processos', icon: FileSearch },
    { label: 'Kanban Setorial', href: '/kanban', icon: KanbanSquare },
    { label: 'Alertas & SLAs', href: '/alertas', icon: BellRing },
  ];

  const adminItems = [
    { label: 'Organograma Setorial', href: '/admin/organograma', icon: Network },
    { label: 'Perfis & Acessos', href: '/admin/usuarios', icon: Users },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-800 shrink-0">
      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Navegação Operacional */}
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-3 mb-2">
            Operação & Monitoramento
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Gestão Administrativa Restrita */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
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
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-800 text-blue-400 font-bold border-l-2 border-blue-500 pl-2.5'
                      : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Status das Fontes Integradas */}
        <div className="pt-2 border-t border-slate-800">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-3 mb-2">
            Fontes Integradas
          </p>
          <div className="space-y-1.5 px-3 text-xs">
            <div className="flex items-center justify-between text-slate-400 bg-slate-800/60 p-2 rounded">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-xs">SEI! GOVMA</span>
              </span>
              <span className="text-[10px] bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded">Consulta</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 bg-slate-800/60 p-2 rounded">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs">StartGov</span>
              </span>
              <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded">Scraper</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 bg-slate-800/60 p-2 rounded">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-xs">PNCP</span>
              </span>
              <span className="text-[10px] bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded">API Pública</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé da Sidebar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-xs shrink-0">
        <div className="flex items-center space-x-2 text-slate-400 mb-1">
          <Server className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-slate-300 text-[11px]">Infraestrutura Gratuita</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Next.js 14 + Supabase RLS + GitHub Actions + Resend API.
        </p>
      </div>
    </aside>
  );
};
