'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Processo } from '../lib/types';
import { SyncButton } from './SyncButton';
import { exportToExcel, exportToCSV, triggerPrintPDF } from '../lib/exportUtils';
import { KPIFilterType } from './KPICards';
import { getSemaforoInercia, isSlaEstourado } from '../lib/slaConfig';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Clock, 
  Building, 
  ArrowRight,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Star,
  Copy,
  Check,
  Compass,
  Sparkles,
  Share2,
  AlertTriangle,
  X,
  RotateCcw,
  SearchX
} from 'lucide-react';
import { Abbr, InfoTooltip } from './Tooltip';

interface ProcessTableProps {
  processos: Processo[];
  kpiFilter?: KPIFilterType;
  onClearKpiFilter?: () => void;
}

export const ProcessTable: React.FC<ProcessTableProps> = ({ 
  processos, 
  kpiFilter = 'TODOS',
  onClearKpiFilter 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrioridade, setFilterPrioridade] = useState<string>('TODAS');
  const [tabAtiva, setTabAtiva] = useState<'TODOS' | 'FAVORITOS'>('TODOS');
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Carrega favoritos salvos no navegador (localStorage)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pumip_favoritos');
      if (saved) {
        setFavoritos(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Erro ao carregar favoritos:', e);
    }
  }, []);

  const toggleFavorito = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    let newFavs: string[];
    if (favoritos.includes(id)) {
      newFavs = favoritos.filter((fav) => fav !== id);
    } else {
      newFavs = [...favoritos, id];
    }
    setFavoritos(newFavs);
    try {
      localStorage.setItem('pumip_favoritos', JSON.stringify(newFavs));
    } catch (err) {
      console.warn('Erro ao salvar favoritos:', err);
    }
  };

  const handleCopyWhatsApp = (proc: Processo, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://pumip.seduc.ma.gov.br');
    const texto = `📌 *Processo SEI:* ${proc.protocolo_sei}
🏢 *Objeto:* ${proc.objeto}
📍 *Localização Atual:* ${proc.unidade_atual_sei} (${proc.dias_parado_na_unidade} dias na unidade)
🎯 *Próximo Passo Esperado:* ${proc.proximo_passo_esperado || 'Tramitação setorial de rotina'}
🛒 *StartGov:* ${proc.protocolo_startgov || 'Aguardando vinculação'}
🔗 *Acompanhar no PUMIP:* ${siteUrl}/processos/${proc.id}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto).then(() => {
        setCopiedId(proc.id);
        setTimeout(() => setCopiedId(null), 2500);
      });
    }
  };

  const handleResetAllFilters = () => {
    setSearchTerm('');
    setFilterPrioridade('TODAS');
    setTabAtiva('TODOS');
    if (onClearKpiFilter) {
      onClearKpiFilter();
    }
  };

  const filtered = processos.filter((p) => {
    const matchesSearch =
      p.protocolo_sei.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.protocolo_startgov && p.protocolo_startgov.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.objeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.unidade_atual_sei.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPrioridade =
      filterPrioridade === 'TODAS' || p.prioridade === filterPrioridade;

    const matchesTab =
      tabAtiva === 'TODOS' || favoritos.includes(p.id);

    // Filtro inteligente do KPI selecionado
    let matchesKpi = true;
    if (kpiFilter === 'CRITICOS') {
      matchesKpi = isSlaEstourado(p.dias_parado_na_unidade) || p.prioridade === 'QUENTE';
    } else if (kpiFilter === 'CONTRATACAO') {
      matchesKpi = p.status_etapa === 'FASE_EXTERNA_LICITACAO' || !!p.protocolo_startgov;
    } else if (kpiFilter === 'SETOR_GARGALO') {
      matchesKpi = p.unidade_atual_sei === 'ASJUR';
    }

    return matchesSearch && matchesPrioridade && matchesTab && matchesKpi;
  });

  const handleExportCSV = () => {
    exportToCSV('processos_seduc_export', filtered, [
      { header: 'Protocolo SEI', key: 'protocolo_sei' },
      { header: 'StartGov', key: (p) => p.protocolo_startgov || 'N/A' },
      { header: 'Objeto', key: 'objeto' },
      { header: 'Unidade Atual', key: 'unidade_atual_sei' },
      { header: 'Próximo Passo', key: (p) => p.proximo_passo_esperado || 'Rotina' },
      { header: 'Etapa', key: 'status_etapa' },
      { header: 'Prioridade', key: 'prioridade' },
      { header: 'Dias Parado', key: 'dias_parado_na_unidade' }
    ]);
  };

  const handleExportExcel = () => {
    exportToExcel('processos_seduc_export', 'Processos SEDUC', filtered, [
      { header: 'Protocolo SEI', key: 'protocolo_sei' },
      { header: 'Identificador StartGov', key: (p) => p.protocolo_startgov || 'Não vinculado' },
      { header: 'Objeto da Demanda', key: 'objeto' },
      { header: 'Unidade Atual no SEI', key: 'unidade_atual_sei' },
      { header: 'Próximo Passo Esperado', key: (p) => p.proximo_passo_esperado || 'Rotina' },
      { header: 'Etapa Processual', key: 'status_etapa' },
      { header: 'Faixa de Prioridade', key: 'prioridade' },
      { header: 'Dias Parado na Unidade', key: 'dias_parado_na_unidade' },
      { header: 'Última Movimentação', key: (p) => new Date(p.ultima_movimentacao_em).toLocaleDateString('pt-BR') }
    ]);
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'QUENTE':
        return 'bg-red-100 text-red-700 border-red-300 font-bold';
      case 'MORNO':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case 'FRIO':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FASE_INTERNA_SEI':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'INSTRUCAO_TR':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'ANALISE_JURIDICA':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'FASE_EXTERNA_LICITACAO':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CONTRATO_EXECUCAO':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getKpiFilterName = (filter: KPIFilterType) => {
    switch (filter) {
      case 'CRITICOS': return 'SLA Estourado / Críticos';
      case 'CONTRATACAO': return 'Fase de Contratação (StartGov)';
      case 'SETOR_GARGALO': return 'Maior Gargalo (ASJUR)';
      default: return 'Todos';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Abas Superiores: Todos vs Fixados na Minha Mesa */}
      <div className="border-b border-slate-200 bg-slate-50/80 px-3 sm:px-4 pt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTabAtiva('TODOS')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              tabAtiva === 'TODOS'
                ? 'bg-white border-blue-600 text-blue-700 shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Todos os Processos</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
              {processos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTabAtiva('FAVORITOS')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              tabAtiva === 'FAVORITOS'
                ? 'bg-white border-amber-500 text-amber-800 shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoritos.length > 0 ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
            <span>Fixados na Minha Mesa</span>
            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded-full border border-amber-200">
              {favoritos.length}
            </span>
          </button>
        </div>

        {/* Legenda rápida de Semáforo */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-600 pb-2">
          <span className="font-semibold text-slate-700">Semáforo de Inércia:</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 0-3d Regular
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> 4-6d Atenção
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> 7d+ Gargalo
          </span>
        </div>
      </div>

      {/* Chip de Filtro KPI Ativo (quando clicado nos cards superiores) */}
      {kpiFilter !== 'TODOS' && (
        <div className="px-4 py-2 bg-blue-50/70 border-b border-blue-200 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>
              Filtrando pelo card superior: <strong>{getKpiFilterName(kpiFilter)}</strong> ({filtered.length} encontrados)
            </span>
          </div>
          <button
            onClick={onClearKpiFilter}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 bg-white hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-300 transition"
          >
            <X className="w-3 h-3" />
            <span>Remover Filtro</span>
          </button>
        </div>
      )}

      {/* Barra de Filtros, Busca e Exportação */}
      <div className="p-3 sm:p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Input de Busca com Botão Limpar (X) */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por SEI, StartGov, objeto ou setor..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterPrioridade}
              onChange={(e) => setFilterPrioridade(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODAS">Todas as Faixas</option>
              <option value="QUENTE">Quente (&le; 15d / Crítico)</option>
              <option value="MORNO">Morno (15-60d)</option>
              <option value="FRIO">Frio (&gt; 60d / Concluído)</option>
            </select>
          </div>

          <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
            <button
              onClick={handleExportExcel}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
              title="Exportar para Excel (XLSX/XML)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
              title="Exportar para CSV (UTF-8)"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={() => triggerPrintPDF('Processos SEDUC-MA')}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
              title="Imprimir ou Salvar em PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabela Responsiva com Coluna Fixada (Sticky Left) */}
      <div className="overflow-x-auto relative">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-slate-100/90 text-slate-800 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th 
                className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-100 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]" 
                title="Fixar na Minha Mesa (salve processos prioritários para acompanhamento rápido na aba Favoritos)"
              >
                <span className="cursor-help" title="Fixar na Minha Mesa">⭐</span>
              </th>
              <th className="py-3 px-4 min-w-[200px] sticky left-10 bg-slate-100 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-1.5">
                  <span>Protocolos (<Abbr sigla="SEI" /> / <Abbr sigla="StartGov" />)</span>
                  <InfoTooltip content="Identificadores do processo no Sistema Eletrônico de Informações (SEI-GOVMA) e na plataforma de licitações StartGov." />
                </div>
              </th>
              <th className="py-3 px-4 min-w-[260px]">
                <div className="flex items-center gap-1.5">
                  <span>Objeto e Próximo Passo</span>
                  <InfoTooltip content="Descrição sintética do objeto da contratação e próximo ato administrativo previsto para dar andamento." />
                </div>
              </th>
              <th className="py-3 px-4 min-w-[140px]">
                <div className="flex items-center gap-1.5">
                  <span>Unidade Atual</span>
                  <InfoTooltip content="Setor da SEDUC-MA que detém a carga eletrônica atual do processo, regido pela hierarquia e regras de RLS." />
                </div>
              </th>
              <th className="py-3 px-4 min-w-[140px]">
                <div className="flex items-center gap-1.5">
                  <span>Etapa Processual</span>
                  <InfoTooltip content="Fase atual do ciclo de vida da contratação pública conforme a Lei Federal nº 14.133/2021." />
                </div>
              </th>
              <th className="py-3 px-4 min-w-[130px]">
                <div className="flex items-center gap-1.5">
                  <span>Semáforo de Inércia</span>
                  <InfoTooltip content="Contagem em dias úteis sem movimentação no setor atual. Exclui fins de semana e feriados oficiais da SEDUC (Art. 183 Lei 14.133/2021)." />
                </div>
              </th>
              <th className="py-3 px-4 text-right min-w-[140px]">
                <div className="flex items-center justify-end gap-1.5">
                  <span>Ações Rápidas</span>
                  <InfoTooltip content="Atalhos para copiar resumo formatado para despacho ou WhatsApp, sincronizar com o SEI e abrir a linha do tempo no Metrô Processual." />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 px-4 text-slate-500">
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <SearchX className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        Nenhum processo encontrado
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Não encontramos resultados para os filtros selecionados ou termo digitado.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetAllFilters}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Limpar filtros e busca</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((proc) => {
                const isFav = favoritos.includes(proc.id);
                const semaforo = getSemaforoInercia(proc.dias_parado_na_unidade);
                const isCopied = copiedId === proc.id;

                return (
                  <tr key={proc.id} className={`hover:bg-slate-50/90 transition group ${isFav ? 'bg-amber-50/20' : ''}`}>
                    {/* Coluna 1 Fixada: Botão de Fixar / Favoritar */}
                    <td className={`py-3 px-3 text-center align-middle sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] ${isFav ? 'bg-amber-50/50' : 'bg-white group-hover:bg-slate-50'}`}>
                      <button
                        onClick={(e) => toggleFavorito(proc.id, e)}
                        className="p-1 rounded hover:bg-slate-200/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        title={isFav ? 'Remover da minha mesa (desafixar)' : 'Fixar na minha mesa para acompanhamento prioritário'}
                      >
                        <Star
                          className={`w-4 h-4 transition ${
                            isFav
                              ? 'text-amber-500 fill-amber-400'
                              : 'text-slate-300 group-hover:text-slate-400'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Coluna 2 Fixada: Protocolos SEI e StartGov */}
                    <td className={`py-3 px-4 font-mono sticky left-10 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] ${isFav ? 'bg-amber-50/50' : 'bg-white group-hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/processos/${proc.id}`}
                          title={`Protocolo oficial no SEI-GOVMA: ${proc.protocolo_sei}. Clique para abrir a ficha completa e a linha do tempo no Metrô Processual.`}
                          className="font-bold text-blue-700 hover:underline hover:text-blue-900"
                        >
                          {proc.protocolo_sei}
                        </Link>
                        {proc.tem_novidade_hoje && (
                          <span 
                            title="Houve nova movimentação ou despacho registrado nas últimas 24 horas"
                            className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 border border-blue-200 animate-pulse cursor-help"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                            Novo
                          </span>
                        )}
                      </div>

                      {proc.protocolo_startgov ? (
                        <div 
                          title={`Identificador do certame de compras no StartGov: ${proc.protocolo_startgov}`}
                          className="text-[11px] text-emerald-800 font-semibold mt-0.5 flex items-center gap-1 cursor-help"
                        >
                          <span>{proc.protocolo_startgov}</span>
                        </div>
                      ) : (
                        <div 
                          title="Este processo ainda está em fase interna preparatória e não possui certame autuado no StartGov"
                          className="text-[10px] text-slate-400 italic cursor-help"
                        >
                          Aguardando StartGov
                        </div>
                      )}
                    </td>

                    {/* Objeto e Próximo Passo Esperado */}
                    <td className="py-3 px-4 max-w-sm">
                      <p 
                        title={`Objeto: ${proc.objeto}`}
                        className="font-semibold text-slate-900 line-clamp-1"
                      >
                        {proc.objeto}
                      </p>

                      <div 
                        title={`Próxima ação administrativa prevista: ${proc.proximo_passo_esperado || 'Tramitação setorial de rotina'}`}
                        className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5 mt-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 cursor-help"
                      >
                        <Compass className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="text-blue-900 font-bold shrink-0">Próximo passo:</span>
                        <span className="text-slate-700 truncate">
                          {proc.proximo_passo_esperado || 'Tramitação de rotina'}
                        </span>
                      </div>
                    </td>

                    {/* Unidade Atual no SEI */}
                    <td className="py-3 px-4">
                      <span 
                        title={`Unidade detentora da carga atual do processo: ${proc.unidade_atual_sei}. Regida pelas regras de RLS (Row Level Security).`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200 cursor-help"
                      >
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <Abbr sigla={proc.unidade_atual_sei} />
                      </span>
                    </td>

                    {/* Etapa Processual */}
                    <td className="py-3 px-4">
                      <span
                        title={`Fase da Lei 14.133/2021: ${proc.status_etapa.replace(/_/g, ' ')}`}
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-help ${getStatusBadge(
                          proc.status_etapa
                        )}`}
                      >
                        {proc.status_etapa.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Semáforo de Inércia (3 níveis claros) */}
                    <td className="py-3 px-4">
                      <div 
                        title={`Inércia: Processo retido há ${proc.dias_parado_na_unidade} dias úteis na unidade ${proc.unidade_atual_sei}. Classificação: ${semaforo.label}.`}
                        className="flex flex-col gap-1 cursor-help"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${semaforo.dotClass}`}></span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded border ${semaforo.badgeClass}`}
                          >
                            {proc.dias_parado_na_unidade} {proc.dias_parado_na_unidade === 1 ? 'dia' : 'dias'} úteis
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {semaforo.label}
                        </span>
                      </div>
                    </td>

                    {/* Ações Rápidas: Copiar WhatsApp + Link */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botão Copiar para WhatsApp */}
                        <button
                          type="button"
                          onClick={(e) => handleCopyWhatsApp(proc, e)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                            isCopied
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-300'
                          }`}
                          title="Copiar resumo estruturado com link direto para WhatsApp ou Despacho"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span className="text-[10px]">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span className="text-[10px] hidden sm:inline">WhatsApp</span>
                            </>
                          )}
                        </button>

                        <SyncButton
                          processoId={proc.id}
                          ultimaVerificacao={proc.ultima_verificacao_em}
                        />

                        <Link
                          href={`/processos/${proc.id}`}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          title="Abrir Linha do Tempo Unificada no Metrô Processual"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
