'use client';

import React, { useState, useMemo } from 'react';
import { Processo, UnidadeOrganizacional } from '../lib/types';
import { mockUnidades } from '../lib/mockData';
import { 
  Building2, 
  Network, 
  Filter, 
  ChevronRight, 
  AlertTriangle, 
  Clock, 
  Flame, 
  Layers, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  X,
  ShieldAlert,
  ChevronDown,
  Activity,
  FolderTree
} from 'lucide-react';
import { Abbr, InfoTooltip } from './Tooltip';

interface SectorHierarchyDashboardProps {
  processos: Processo[];
  selectedSector: string | null;
  onSelectSector: (sectorSigla: string | null) => void;
}

export const SectorHierarchyDashboard: React.FC<SectorHierarchyDashboardProps> = ({
  processos,
  selectedSector,
  onSelectSector
}) => {
  // Filtro de nó na árvore hierárquica (ex: 'TODOS', 'SEDUC', 'SEDUC.SAAD', 'SEDUC.SAAD.STI', etc.)
  const [hierarquiaFiltro, setHierarquiaFiltro] = useState<string>('TODOS');
  const [expandirArvore, setExpandirArvore] = useState(false);

  // Mapeamento das unidades
  const unidadesMap = useMemo(() => {
    const map = new Map<string, UnidadeOrganizacional>();
    mockUnidades.forEach(u => map.set(u.sigla, u));
    return map;
  }, []);

  // Filtra os processos de acordo com o nó hierárquico selecionado na árvore
  const processosFiltradosPorHierarquia = useMemo(() => {
    if (hierarquiaFiltro === 'TODOS') {
      return processos;
    }

    return processos.filter(p => {
      // 1. Verifica pelo caminho hierárquico da unidade de origem
      const caminhoOrigem = p.unidade_origem?.caminho_hierarquico || '';
      if (caminhoOrigem.startsWith(hierarquiaFiltro)) {
        return true;
      }

      // 2. Verifica se a unidade atual (SEI) pertence a esse ramo hierárquico
      const unidadeAtual = unidadesMap.get(p.unidade_atual_sei);
      if (unidadeAtual && unidadeAtual.caminho_hierarquico.startsWith(hierarquiaFiltro)) {
        return true;
      }

      return false;
    });
  }, [processos, hierarquiaFiltro, unidadesMap]);

  // Se houver um setor específico selecionado (clique no gráfico), filtra mais ainda
  const processosExibidos = useMemo(() => {
    if (!selectedSector) return processosFiltradosPorHierarquia;
    return processosFiltradosPorHierarquia.filter(p => p.unidade_atual_sei === selectedSector);
  }, [processosFiltradosPorHierarquia, selectedSector]);

  // 1. Distribuição de Processos por Unidade Atual (Onde estão os processos?)
  const distribuicaoSetores = useMemo(() => {
    const contagem: Record<string, { total: number; inerciaTotal: number; quentes: number; mornos: number; frios: number }> = {};

    processosFiltradosPorHierarquia.forEach(p => {
      const setor = p.unidade_atual_sei;
      if (!contagem[setor]) {
        contagem[setor] = { total: 0, inerciaTotal: 0, quentes: 0, mornos: 0, frios: 0 };
      }
      contagem[setor].total += 1;
      contagem[setor].inerciaTotal += p.dias_parado_na_unidade;
      if (p.prioridade === 'QUENTE') contagem[setor].quentes += 1;
      else if (p.prioridade === 'MORNO') contagem[setor].mornos += 1;
      else contagem[setor].frios += 1;
    });

    return Object.entries(contagem).map(([sigla, dados]) => {
      const unidade = unidadesMap.get(sigla);
      const mediaDias = dados.total > 0 ? (dados.inerciaTotal / dados.total).toFixed(1) : '0';
      return {
        sigla,
        nome: unidade?.nome || `Unidade ${sigla}`,
        caminho: unidade?.caminho_hierarquico || sigla,
        tipo: unidade?.tipo || 'SETOR',
        total: dados.total,
        mediaDias: Number(mediaDias),
        quentes: dados.quentes,
        mornos: dados.mornos,
        frios: dados.frios,
        percentual: ((dados.total / Math.max(processosFiltradosPorHierarquia.length, 1)) * 100).toFixed(0)
      };
    }).sort((a, b) => b.total - a.total);
  }, [processosFiltradosPorHierarquia, unidadesMap]);

  // 2. Distribuição por Fases Processuais (Ciclo de Vida da Lei 14.133)
  const fasesProcessuais = useMemo(() => {
    const etapasMap: Record<string, { label: string; count: number; cor: string; bg: string }> = {
      FASE_INTERNA_SEI: { label: 'Fase Interna (SEI)', count: 0, cor: 'text-blue-700', bg: 'bg-blue-500' },
      INSTRUCAO_TR: { label: 'Instrução do TR', count: 0, cor: 'text-indigo-700', bg: 'bg-indigo-500' },
      ANALISE_JURIDICA: { label: 'Análise Jurídica (ASJUR)', count: 0, cor: 'text-amber-700', bg: 'bg-amber-500' },
      FASE_EXTERNA_LICITACAO: { label: 'Licitação / CSL (StartGov)', count: 0, cor: 'text-purple-700', bg: 'bg-purple-500' },
      CONTRATO_EXECUCAO: { label: 'Execução Contratual (PNCP)', count: 0, cor: 'text-emerald-700', bg: 'bg-emerald-500' },
      CONCLUIDO: { label: 'Concluído', count: 0, cor: 'text-slate-700', bg: 'bg-slate-400' }
    };

    processosFiltradosPorHierarquia.forEach(p => {
      if (etapasMap[p.status_etapa]) {
        etapasMap[p.status_etapa].count += 1;
      }
    });

    return Object.values(etapasMap);
  }, [processosFiltradosPorHierarquia]);

  // 3. Identificação do Setor com Maior Retenção / Gargalo da Pasta
  const setorMaiorGargalo = useMemo(() => {
    if (distribuicaoSetores.length === 0) return null;
    return [...distribuicaoSetores].sort((a, b) => b.mediaDias - a.mediaDias)[0];
  }, [distribuicaoSetores]);

  // Opções estruturadas da Árvore Hierárquica
  const nosHierarquicos = [
    { label: 'Toda a SEDUC-MA (Visão Global da Pasta)', caminho: 'TODOS', nivel: 0 },
    { label: 'Gabinete do Secretário (SEDUC.GAB)', caminho: 'SEDUC', nivel: 1 },
    { label: 'Subsecretaria de Educação (SUBSEDUC)', caminho: 'SEDUC.SUBSEDUC', nivel: 2 },
    { label: 'Secretaria Adjunta de Administração (SAAD)', caminho: 'SEDUC.SAAD', nivel: 2 },
    { label: '↳ Superintendência de TI (STI)', caminho: 'SEDUC.SAAD.STI', nivel: 3 },
    { label: '  ↳ Supervisão de Sistemas (SUDES)', caminho: 'SEDUC.SAAD.STI.SUDES', nivel: 4 },
    { label: '  ↳ Supervisão de Redes (SUPREDES)', caminho: 'SEDUC.SAAD.STI.SUPREDES', nivel: 4 },
    { label: '  ↳ Supervisão de Chamados (SUGEC)', caminho: 'SEDUC.SAAD.STI.SUGEC', nivel: 4 },
    { label: '↳ Superintendência de Infraestrutura (SUINFRA)', caminho: 'SEDUC.SAAD.SUINFRA', nivel: 3 },
    { label: 'Secretaria Adjunta de Orçamento e Finanças (SAOFC)', caminho: 'SEDUC.SAOFC', nivel: 2 },
    { label: 'Comissão Setorial de Licitação (CSL)', caminho: 'SEDUC.CSL', nivel: 2 },
    { label: 'Assessoria Jurídica (ASJUR)', caminho: 'SEDUC.ASJUR', nivel: 2 },
    { label: 'Assessoria de Planejamento (ASPLAN)', caminho: 'SEDUC.ASPLAN', nivel: 2 }
  ];

  const noSelecionado = nosHierarquicos.find(n => n.caminho === hierarquiaFiltro) || nosHierarquicos[0];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-5">
      {/* Cabeçalho da Seção Analítica com Seletor da Árvore Hierárquica */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Distribuição Visual de Processos por Setor & Hierarquia</span>
              <InfoTooltip content="Painel analítico para gestão visualizar onde os processos estão localizados na estrutura da SEDUC-MA, com filtragem multinível pela árvore organizacional." />
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Acompanhe onde os processos estão concentrados na estrutura organizacional da SEDUC-MA e identifique retenções em tempo real.
          </p>
        </div>

        {/* Seletor Suspenso da Árvore Hierárquica */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative w-full lg:w-80">
            <select
              value={hierarquiaFiltro}
              onChange={(e) => {
                setHierarquiaFiltro(e.target.value);
                onSelectSector(null); // Reseta filtro de setor individual
              }}
              title="Selecione um nível da árvore hierárquica da SEDUC-MA para filtrar os processos subordinados"
              className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition cursor-pointer"
            >
              {nosHierarquicos.map((no) => (
                <option key={no.caminho} value={no.caminho}>
                  {no.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Breadcrumb e Indicador de Filtro Ativo */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 px-3.5 rounded-xl border border-slate-200/70 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <FolderTree className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="font-semibold text-slate-600">Ramo Selecionado:</span>
          <span className="bg-white text-blue-800 font-bold px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
            {noSelecionado.label}
          </span>
          <span className="text-slate-400">&bull;</span>
          <span className="text-slate-600 font-medium">
            <strong>{processosFiltradosPorHierarquia.length}</strong> processo(s) abrangidos
          </span>
        </div>

        {selectedSector && (
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs text-xs">
              <span>Setor: {selectedSector}</span>
              <button
                type="button"
                onClick={() => onSelectSector(null)}
                className="hover:bg-blue-700 rounded-full p-0.5 transition"
                title="Limpar filtro de setor"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
            <button
              type="button"
              onClick={() => onSelectSector(null)}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline"
            >
              Ver todos os setores
            </button>
          </div>
        )}
      </div>

      {/* Grid de Gráficos Analíticos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* GRÁFICO 1: Barras Horizontais de Carga por Setor Atual (Onde estão?) */}
        <div className="lg:col-span-7 bg-slate-50/60 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Onde Estão os Processos Agora? (Carga por Setor)
                </h3>
              </div>
              <span className="text-xs text-slate-400 italic hidden sm:inline">
                Clique em uma barra para filtrar
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Representação do volume de processos físicos ou digitais retidos na unidade atual segundo o SEI-MA.
            </p>

            {distribuicaoSetores.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum processo localizado neste ramo hierárquico.
              </div>
            ) : (
              <div className="space-y-3">
                {distribuicaoSetores.map((setor) => {
                  const isSelected = selectedSector === setor.sigla;
                  const maxTotal = Math.max(...distribuicaoSetores.map(s => s.total), 1);
                  const barWidthPercent = (setor.total / maxTotal) * 100;

                  // Cores baseadas na inércia média do setor
                  const corBarra = setor.mediaDias >= 10
                    ? 'bg-red-500 hover:bg-red-600'
                    : setor.mediaDias >= 5
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-blue-600 hover:bg-blue-700';

                  const statusInercia = setor.mediaDias >= 10
                    ? 'Crítico (≥ 10d úteis)'
                    : setor.mediaDias >= 5
                    ? 'Atenção (5-9d úteis)'
                    : 'Regular (< 5d úteis)';

                  const tooltipText = `Unidade: ${setor.nome} (${setor.sigla})\nCaminho Hierárquico: ${setor.caminho}\nTipo: ${setor.tipo}\nVolume Atual: ${setor.total} processo(s) (${setor.percentual}% da carteira)\nInércia Média: ${setor.mediaDias} dias úteis sem despacho\nClassificação SLA: ${statusInercia}\n\nClique para ${isSelected ? 'remover este filtro' : 'filtrar os processos deste setor'}.`;

                  return (
                    <button
                      key={setor.sigla}
                      type="button"
                      onClick={() => onSelectSector(isSelected ? null : setor.sigla)}
                      title={tooltipText}
                      className={`w-full text-left p-2.5 rounded-xl border transition group focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isSelected
                          ? 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-300'
                          : 'bg-white hover:bg-slate-100/80 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                        <div className="flex items-center gap-2 truncate">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs border ${
                            isSelected ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}>
                            <Abbr sigla={setor.sigla} descricao={setor.nome} />
                          </span>
                          <span className="text-slate-800 truncate text-xs">{setor.nome}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-500 font-mono">
                            Média: <strong>{setor.mediaDias}d úteis</strong>
                          </span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                            {setor.total} proc ({setor.percentual}%)
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso Proporcional */}
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${corBarra}`}
                          style={{ width: `${Math.max(barWidthPercent, 12)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legenda de Inércia */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
            <span className="font-semibold text-slate-600">Semáforo de Retenção:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1" title="Menos de 5 dias úteis sem movimentação: Dentro do prazo regular">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span> Regular (&lt; 5d)
              </span>
              <span className="flex items-center gap-1" title="Entre 5 e 9 dias úteis sem movimentação: Requer atenção da chefia imediata">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Atenção (5-9d)
              </span>
              <span className="flex items-center gap-1" title="10 dias úteis ou mais parado no mesmo setor: Crítico (SLA estourado)">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Crítico (≥ 10d)
              </span>
            </div>
          </div>
        </div>

        {/* GRÁFICOS 2 & 3: Ciclo de Vida da Lei 14.133 + Diagnóstico de Gargalos */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Fases da Contratação Pública */}
          <div className="bg-slate-50/60 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span>Fases do Ciclo de Vida</span>
                  <InfoTooltip content="Ciclo de contratação pública conforme a Lei Federal nº 14.133/2021: desde a fase preparatória interna no SEI até a disputa no StartGov e publicação no PNCP." />
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">SEI + StartGov</span>
            </div>

            <div className="space-y-2.5 pt-1">
              {fasesProcessuais.map((fase) => {
                const total = Math.max(processosFiltradosPorHierarquia.length, 1);
                const percent = ((fase.count / total) * 100).toFixed(0);

                return (
                  <div 
                    key={fase.label} 
                    className="space-y-1 group/fase cursor-help"
                    title={`Fase: ${fase.label}\nProcessos nesta etapa: ${fase.count} (${percent}% do total filtrado)`}
                  >
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 text-xs truncate group-hover/fase:text-blue-700 transition">
                        {fase.label}
                      </span>
                      <span className="font-mono text-slate-900 font-bold shrink-0">
                        {fase.count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${fase.bg}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card de Diagnóstico Executivo de Gargalo */}
          {setorMaiorGargalo && (
            <div 
              className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 space-y-2 shadow-2xs"
              title={`Diagnóstico Automático: A unidade ${setorMaiorGargalo.sigla} apresenta a maior inércia média da carteira (${setorMaiorGargalo.mediaDias} dias úteis).`}
            >
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Ponto Crítico de Retenção</span>
                <InfoTooltip content="Indica o setor com maior tempo médio de retenção de processos sem movimentação oficial no SEI." />
              </div>
              <p className="text-xs text-amber-950 leading-relaxed">
                A <strong>{setorMaiorGargalo.nome} (<Abbr sigla={setorMaiorGargalo.sigla} />)</strong> concentra a maior média de permanência da carteira: 
                <span className="text-red-700 font-bold ml-1">{setorMaiorGargalo.mediaDias} dias úteis</span> por processo.
              </p>
              <div className="pt-1 flex items-center justify-between text-xs text-amber-900 font-semibold border-t border-amber-200/80">
                <span>{setorMaiorGargalo.total} processos nesta unidade</span>
                <button
                  type="button"
                  onClick={() => onSelectSector(setorMaiorGargalo.sigla)}
                  title={`Filtrar apenas os ${setorMaiorGargalo.total} processos parados na unidade ${setorMaiorGargalo.sigla}`}
                  className="text-blue-700 hover:text-blue-900 underline font-bold flex items-center gap-1"
                >
                  <span>Filtrar este setor</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
