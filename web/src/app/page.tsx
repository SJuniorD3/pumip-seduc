'use client';

import React, { useState, useMemo } from 'react';
import { KPICards } from '../components/KPICards';
import { ProcessTable } from '../components/ProcessTable';
import { mockProcessos, mockUnidades } from '../lib/mockData';
import { Processo, UserRole } from '../lib/types';
import { 
  ShieldCheck, 
  Kanban, 
  Bell, 
  Layers, 
  ChevronRight, 
  UserCheck,
  Building2
} from 'lucide-react';
import Link from 'next/link';

interface RoleSimulation {
  role: UserRole;
  label: string;
  titular: string;
  unidadeSigla: string;
  caminho: string;
  nivelDesc: string;
}

const ROLES_HIERARCHY: RoleSimulation[] = [
  {
    role: 'SECRETARIO',
    label: 'Secretária de Estado',
    titular: 'Jandira Dias Araújo Silva',
    unidadeSigla: 'SEDUC',
    caminho: 'SEDUC',
    nivelDesc: 'Visão Global de Toda a Secretaria de Educação'
  },
  {
    role: 'SUBSECRETARIO',
    label: 'Subsecretário de Educação',
    titular: 'José Antônio Barros Heluy',
    unidadeSigla: 'SUBSEDUC',
    caminho: 'SEDUC.SUBSEDUC',
    nivelDesc: 'Gestão Executiva e Coordenação Integrada'
  },
  {
    role: 'SECRETARIO_ADJUNTO',
    label: 'Secretária Adjunta (SAAD)',
    titular: 'Luzivete Botelho da Silva Rodrigues',
    unidadeSigla: 'SAAD',
    caminho: 'SEDUC.SAAD',
    nivelDesc: 'Herança: STI, SUINFRA, SUPRI e SUPERLOG'
  },
  {
    role: 'SUPERINTENDENTE',
    label: 'Superintendente de TI (STI)',
    titular: 'Roberto Max Louzeiro Pimentel',
    unidadeSigla: 'STI',
    caminho: 'SEDUC.SAAD.STI',
    nivelDesc: 'Herança: SUDES, SUPREDES, SUGEC e SUMES'
  },
  {
    role: 'SUPERVISOR',
    label: 'Supervisor de Sistemas (SUDES)',
    titular: 'Sérvulo José Freire Junior',
    unidadeSigla: 'SUDES',
    caminho: 'SEDUC.SAAD.STI.SUDES',
    nivelDesc: 'Carteira Setorial da Supervisão de Sistemas'
  },
  {
    role: 'ASSESSOR',
    label: 'Assessor Jurídico (ASJUR)',
    titular: 'Valter Pereira Veras Neto',
    unidadeSigla: 'ASJUR',
    caminho: 'SEDUC.ASJUR',
    nivelDesc: 'Processos em instrução/análise jurídica na ASJUR'
  },
  {
    role: 'TECNICO',
    label: 'Técnico de Desenvolvimento',
    titular: 'Analista de Sistemas',
    unidadeSigla: 'SUDES',
    caminho: 'SEDUC.SAAD.STI.SUDES',
    nivelDesc: 'Processos designados da unidade direta'
  }
];

export default function DashboardPage() {
  const [selectedRoleIndex, setSelectedRoleIndex] = useState<number>(4); // Default: Supervisor (Sérvulo Junior)
  const currentSim = ROLES_HIERARCHY[selectedRoleIndex];

  // Aplicação da regra de Row Level Security (RLS) conforme o cargo e o caminho hierárquico
  const processosFiltrados = useMemo(() => {
    return mockProcessos.filter((proc) => {
      // 1. Secretário, Subsecretário e Admin possuem visão global
      if (['SECRETARIO', 'SUBSECRETARIO', 'ADMIN', 'AUDITOR'].includes(currentSim.role)) {
        return true;
      }

      const procCaminho = proc.unidade_origem?.caminho_hierarquico || '';

      // 2. Secretário Adjunto: vê sua secretaria adjunta e todos os setores subordinados (prefixo)
      if (currentSim.role === 'SECRETARIO_ADJUNTO') {
        return procCaminho.startsWith(currentSim.caminho) || proc.unidade_origem?.sigla === currentSim.unidadeSigla;
      }

      // 3. Superintendente: vê sua superintendência e supervisões subordinadas
      if (currentSim.role === 'SUPERINTENDENTE') {
        return procCaminho.startsWith(currentSim.caminho) || proc.unidade_origem?.sigla === currentSim.unidadeSigla;
      }

      // 4. Supervisor: vê processos da sua supervisão
      if (currentSim.role === 'SUPERVISOR') {
        return proc.unidade_origem?.sigla === currentSim.unidadeSigla || procCaminho.startsWith(currentSim.caminho);
      }

      // 5. Assessor: vê processos de sua unidade ou que estejam tramitando atualmente nela
      if (currentSim.role === 'ASSESSOR') {
        return proc.unidade_origem?.sigla === currentSim.unidadeSigla || proc.unidade_atual_sei === currentSim.unidadeSigla;
      }

      // 6. Técnico: vê processos da sua unidade de lotação
      return proc.unidade_origem?.sigla === currentSim.unidadeSigla;
    });
  }, [currentSim]);

  return (
    <div className="space-y-6">
      {/* Seletor Interativo da Escala de Cargos (Organograma SEDUC-MA) */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Simulador de Perfis e Permissões RLS (Hierarquia SEDUC-MA)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Ordem de Autoridade: <strong>Secretário &gt; Subsecretário &gt; Secretário Adjunto &gt; Superintendente &gt; Supervisor &gt; Assessor / Técnico</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {ROLES_HIERARCHY.map((item, idx) => {
            const isSelected = idx === selectedRoleIndex;
            return (
              <button
                key={item.role + idx}
                onClick={() => setSelectedRoleIndex(idx)}
                className={`p-2.5 rounded-lg border text-left transition relative ${
                  isSelected
                    ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.role.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">{item.label}</p>
                <p className="text-[10px] text-slate-500 truncate">{item.titular}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Banner de Boas-Vindas com o Contexto do Cargo Selecionado */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs bg-blue-500/30 text-blue-200 border border-blue-400/40 px-2.5 py-0.5 rounded-full font-bold">
              {currentSim.label}: {currentSim.titular}
            </span>
            <span className="text-xs bg-slate-800/80 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-mono text-[11px]">
              {currentSim.caminho}
            </span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              RLS Aplicado no Banco
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            Painel Executivo de Acompanhamento Processual
          </h1>

          <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
            {currentSim.nivelDesc}. De acordo com as políticas do Supabase, este perfil visualiza apenas 
            as demandas da sua alçada hierárquica por herança de organograma.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
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

      {/* Cards de KPIs Principais Filtrados pela Visão Hierárquica */}
      <KPICards processos={processosFiltrados} />

      {/* Tabela de Processos com a Visão Restrita pelo Cargo Atual */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Processos Visíveis na Carteira Hierárquica
            </h2>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              {processosFiltrados.length} processos
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Regra de não ampliação de acesso ativa
          </span>
        </div>
        <ProcessTable processos={processosFiltrados} />
      </div>
    </div>
  );
}
