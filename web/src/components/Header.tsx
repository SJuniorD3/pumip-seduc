'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, ShieldCheck, UserCheck } from 'lucide-react';

interface HeaderProps {
  lastSyncSEI?: string;
  lastSyncStartGov?: string;
  lastSyncPNCP?: string;
  activeRole?: string;
  activeUnit?: string;
}

export const Header: React.FC<HeaderProps> = ({
  lastSyncSEI = 'Hoje às 14:00',
  lastSyncStartGov = 'Hoje às 13:45',
  lastSyncPNCP = 'Hoje às 12:30',
  activeRole = 'SUPERVISOR',
  activeUnit = 'SUDES / STI'
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo e Identidade Visual SEDUC-MA */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-md">
              P
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-slate-900 tracking-tight">PUMIP</span>
                <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                  SEDUC-MA
                </span>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full border border-emerald-200">
                  Hierarquia v2.1
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Plataforma Unificada de Monitoramento e Inteligência Processual
              </p>
            </div>
          </div>

          {/* Indicadores de Frescor das Fontes (RF02) */}
          <div className="hidden md:flex items-center space-x-4 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <div className="flex items-center space-x-1.5 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="font-semibold text-blue-900">SEI:</span>
              <span className="text-slate-600">{lastSyncSEI}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center space-x-1.5 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-emerald-900">StartGov:</span>
              <span className="text-slate-600">{lastSyncStartGov}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center space-x-1.5 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="font-semibold text-amber-900">PNCP:</span>
              <span className="text-slate-600">{lastSyncPNCP}</span>
            </div>
          </div>

          {/* Notificações e Perfil do Usuário com Cargo Estruturado */}
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
                  <span className="font-bold text-blue-700">{activeRole}</span>
                  <span>&bull;</span>
                  <span className="truncate max-w-[150px]">{activeUnit}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
