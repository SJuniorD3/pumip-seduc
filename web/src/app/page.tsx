'use client';

import React, { useState, useEffect } from 'react';
import { KPICards } from '../components/KPICards';
import { ProcessTable } from '../components/ProcessTable';
import { mockProcessos } from '../lib/mockData';
import { Processo } from '../lib/types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ShieldCheck, Kanban, Bell, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [processos, setProcessos] = useState<Processo[]>(mockProcessos);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLiveDB, setIsLiveDB] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured()) {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('processos')
            .select('*, unidade_origem:unidades_organizacionais(*)');

          if (!error && data && data.length > 0) {
            setProcessos(data as Processo[]);
            setIsLiveDB(true);
          }
        } catch (e) {
          console.warn('Usando dados simulados locais:', e);
        } finally {
          setLoading(false);
        }
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas e Contexto de Permissão Hierárquica */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-blue-500/20 text-blue-200 border border-blue-400/30 px-2.5 py-0.5 rounded-full font-semibold">
              Superintendência de TI &bull; SUPTI
            </span>
            <span className="text-xs bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Controle RLS Ativo
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Painel Executivo de Acompanhamento Processual
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Visão consolidada de processos com origem na SUPTI e setores subordinados (SUPDEV e SUPINFRA). 
            Dados sincronizados em tempo real via SEI, StartGov e PNCP.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/kanban"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <Kanban className="w-4 h-4" />
            <span>Quadro Kanban</span>
          </Link>
          <Link
            href="/alertas"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition"
          >
            <Bell className="w-4 h-4" />
            <span>Regras de Alerta</span>
          </Link>
        </div>
      </div>

      {/* Cards de KPIs Principais */}
      <KPICards processos={processos} />

      {/* Tabela de Processos Monitorados */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900">
            Processos da Carteira Setorial
          </h2>
          <span className="text-xs text-slate-500">
            Mostrando {processos.length} processos ativos
          </span>
        </div>
        <ProcessTable processos={processos} />
      </div>
    </div>
  );
}
