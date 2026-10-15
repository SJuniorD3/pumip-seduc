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
  Network,
  ShieldCheck,
  Building2
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
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-800 shrink-0">
      <div className="p-4 space-y-5 overflow-y-auto">
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

        {/* Níveis do Organograma SEDUC-MA */}
        <div className="pt-3 border-t border-slate-800">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-3 mb-2 flex items-center justify-between">
            <span>Escala Hierárquica</span>
            <Network className="w-3.5 h-3.5 text-blue-400" />
          </p>
          <div className="space-y-1.5 px-3 text-[11px]">
            <div className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800/60">
              <span className="font-semibold text-white">1. Secretário(a)</span>
              <span className="text-[10px] bg-blue-950 text-blue-300 px-1.5 py-0.2 rounded border border-blue-800">Gabinete</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 py-1 border-b border-slate-800/60">
              <span>2. Subsecretário</span>
              <span className="text-[10px] text-slate-400">Coordenação</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 py-1 border-b border-slate-800/60">
              <span>3. Sec. Adjuntos</span>
              <span className="text-[10px] text-slate-400">7 Adjuntas</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 py-1 border-b border-slate-800/60">
              <span>4. Superintendentes</span>
              <span className="text-[10px] text-slate-400">14 Áreas</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 py-1 border-b border-slate-800/60">
              <span>5. Supervisores</span>
              <span className="text-[10px] text-blue-400 font-semibold">40+ Setores</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 py-1">
              <span>6. Assessores / Técnicos</span>
              <span className="text-[10px] text-slate-500">Operacional</span>
            </div>
          </div>
        </div>

        {/* Status das Fontes */}
        <div className="pt-3 border-t border-slate-800">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-3 mb-2">
            Fontes Integradas
          </p>
          <div className="space-y-1.5 px-3 text-xs">
            <div className="flex items-center justify-between text-slate-400 bg-slate-800/60 p-1.5 rounded">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span className="text-[11px]">SEI GOVMA</span>
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
              <span className="text-[9px] bg-amber-900/60 text-amber-300 px-1 py-0.2 rounded">API Pública</span>
            </div>
          </div>
        </div>
      </div>

      {/* Informações da Infraestrutura Gratuita */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-xs shrink-0">
        <div className="flex items-center space-x-2 text-slate-400 mb-1">
          <Server className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-slate-300 text-[11px]">Zero-Cost Stack</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Next.js 14 + Supabase RLS + GitHub Actions + Resend API.
        </p>
      </div>
    </aside>
  );
};
