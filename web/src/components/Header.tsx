'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, ShieldCheck, UserCheck, Search, Command } from 'lucide-react';
import { CommandPalette } from './CommandPalette';

interface HeaderProps {
  lastSyncSEI?: string;
  lastSyncStartGov?: string;
  lastSyncPNCP?: string;
}

export const Header: React.FC<HeaderProps> = ({
  lastSyncSEI = 'Hoje às 14:00',
  lastSyncStartGov = 'Hoje às 13:45',
  lastSyncPNCP = 'Hoje às 12:30',
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Listener global de teclado para Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo e Identidade Visual SEDUC-MA */}
            <Link href="/" className="flex items-center space-x-3 group shrink-0">
              <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:bg-blue-800 transition">
                P
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-slate-900 tracking-tight">PUMIP</span>
                  <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                    SEDUC-MA
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Plataforma Unificada de Monitoramento e Inteligência Processual
                </p>
              </div>
            </Link>

            {/* Botão de Busca Global Universal (Cmd + K) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs text-slate-500 transition shadow-inner w-64 lg:w-80 justify-between group"
              title="Buscar qualquer processo (Atalho: Cmd + K)"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
                <span className="text-slate-600 font-medium">Buscar processo, TR ou setor...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-500 rounded border border-slate-300 shadow-sm">
                <Command className="w-3 h-3" /> K
              </kbd>
            </button>

            {/* Status dos Coletores de Dados (Jitter / Delta Hash) */}
            <div className="hidden xl:flex items-center space-x-5 text-xs border-l border-r border-slate-200 px-4 py-1 bg-slate-50/50 rounded-lg">
              <div className="flex items-center space-x-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span className="font-semibold text-blue-900">SEI:</span>
                <span className="text-slate-600">{lastSyncSEI}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="font-semibold text-emerald-900">StartGov:</span>
                <span className="text-slate-600">{lastSyncStartGov}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="font-semibold text-amber-900">PNCP:</span>
                <span className="text-slate-600">{lastSyncPNCP}</span>
              </div>
            </div>

            {/* Notificações e Identificação Limpa do Usuário */}
            <div className="flex items-center space-x-3">
              <Link 
                href="/alertas" 
                className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                title="Notificações e Alertas SLA"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
              </Link>

              <div className="border-l border-slate-200 pl-3 flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-900 text-white font-medium flex items-center justify-center text-xs shadow-inner">
                  SJ
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <p className="font-semibold text-slate-800 leading-tight">Sérvulo Junior</p>
                  <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                    <span className="font-semibold text-blue-700">SUDES</span>
                    <span>&bull;</span>
                    <span>SEDUC-MA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de Busca Global Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};
