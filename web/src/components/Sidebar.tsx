'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  GitCommit, 
  KanbanSquare, 
  BellRing, 
  FileSearch,
  Server,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Visão Geral', href: '/', icon: LayoutDashboard },
    { label: 'Processos Monitorados', href: '/processos', icon: FileSearch },
    { label: 'Kanban Setorial', href: '/kanban', icon: KanbanSquare },
    { label: 'Alertas & SLAs', href: '/alertas', icon: BellRing },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-800">
      <div className="p-4 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-3 mb-2">
            Navegação Principal
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
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

        <div className="pt-4 border-t border-slate-800">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-3 mb-2">
            Fontes Integradas
          </p>
          <div className="space-y-2 px-3 text-xs">
            <div className="flex items-center justify-between text-slate-400 bg-slate-800/60 p-2 rounded">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>SEI GOVMA</span>
              </span>
              <span className="text-[10px] bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded">Consulta</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 bg-slate-800/60 p-2 rounded">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>StartGov</span>
              </span>
              <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded">Scraper</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 bg-slate-800/60 p-2 rounded">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>PNCP (Art. 94)</span>
              </span>
              <span className="text-[10px] bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded">API Pública</span>
            </div>
          </div>
        </div>
      </div>

      {/* Informações da Infraestrutura Gratuita */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs">
        <div className="flex items-center space-x-2 text-slate-400 mb-1">
          <Server className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-slate-300">Stack 100% Gratuita</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Vercel + Supabase (RLS) + GitHub Actions Cron + Resend API.
        </p>
      </div>
    </aside>
  );
};
