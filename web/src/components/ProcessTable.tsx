'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Processo } from '../lib/types';
import { SyncButton } from './SyncButton';
import { exportToExcel, exportToCSV, triggerPrintPDF } from '../lib/exportUtils';
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
  AlertTriangle
} from 'lucide-react';

interface ProcessTableProps {
  processos: Processo[];
}

export const ProcessTable: React.FC<ProcessTableProps> = ({ processos }) => {
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
    const texto = `📌 *Processo SEI:* ${proc.protocolo_sei}
🏢 *Objeto:* ${proc.objeto}
📍 *Localização Atual:* ${proc.unidade_atual_sei} (${proc.dias_parado_na_unidade} dias na unidade)
🎯 *Próximo Passo Esperado:* ${proc.proximo_passo_esperado || 'Tramitação setorial de rotina'}
🛒 *StartGov:* ${proc.protocolo_startgov || 'Aguardando vinculação'}
🔗 *Acompanhar no PUMIP:* http://localhost:3000/processos/${proc.id}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto).then(() => {
        setCopiedId(proc.id);
        setTimeout(() => setCopiedId(null), 2500);
      });
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

    return matchesSearch && matchesPrioridade && matchesTab;
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
        return 'bg-red-100 text-red-700 border-red-200';
      case 'MORNO':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'FRIO':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FASE_INTERNA_SEI':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'INSTRUCAO_TR':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'ANALISE_JURIDICA':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'FASE_EXTERNA_LICITACAO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CONTRATO_EXECUCAO':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Semáforo Visual de Inércia (3 Níveis)
  const getSemaforoInercia = (dias: number) => {
    if (dias >= 7) {
      return {
        dotClass: 'bg-red-500 animate-pulse',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        label: 'Gargalo Crítico (7+ dias)',
        isCritical: true
      };
    }
    if (dias >= 4) {
      return {
        dotClass: 'bg-amber-500',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        label: 'Atenção (4-6 dias)',
        isCritical: false
      };
    }
    return {
      dotClass: 'bg-emerald-500',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Regular (0-3 dias)',
      isCritical: false
    };
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Abas Superiores: Todos vs Fixados na Minha Mesa */}
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTabAtiva('TODOS')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 transition flex items-center gap-1.5 ${
              tabAtiva === 'TODOS'
                ? 'bg-white border-blue-600 text-blue-700 shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Todos os Processos</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full">
              {processos.length}
            </span>
          </button>

          <button
            onClick={() => setTabAtiva('FAVORITOS')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 transition flex items-center gap-1.5 ${
              tabAtiva === 'FAVORITOS'
                ? 'bg-white border-amber-500 text-amber-800 shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoritos.length > 0 ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
            <span>Fixados na Minha Mesa</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full border border-amber-200">
              {favoritos.length}
            </span>
          </button>
        </div>

        {/* Legenda rápida de Semáforo */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-500 pb-2">
          <span className="font-semibold text-slate-600">Semáforo de Inércia:</span>
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

      {/* Barra de Filtros, Busca e Exportação */}
      <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por SEI, StartGov, objeto ou setor..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
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
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
              title="Exportar para CSV (UTF-8)"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>CSV</span>
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

      {/* Tabela Responsiva */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-100/75 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-3 w-8 text-center" title="Fixar na Minha Mesa">⭐</th>
              <th className="py-3 px-4">Protocolos (SEI / StartGov)</th>
              <th className="py-3 px-4">Objeto e Próximo Passo</th>
              <th className="py-3 px-4">Unidade / Setor Atual</th>
              <th className="py-3 px-4">Etapa Processual</th>
              <th className="py-3 px-4">Semáforo de Inércia</th>
              <th className="py-3 px-4 text-right">Ações Rápidas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">
                  {tabAtiva === 'FAVORITOS' ? (
                    <div className="space-y-1">
                      <Star className="w-6 h-6 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-600">Nenhum processo fixado na sua mesa.</p>
                      <p className="text-xs text-slate-400">Clique na estrelinha ⭐ ao lado de qualquer processo para acompanhá-lo diretamente aqui.</p>
                    </div>
                  ) : (
                    'Nenhum processo encontrado com os filtros informados.'
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((proc) => {
                const isFav = favoritos.includes(proc.id);
                const semaforo = getSemaforoInercia(proc.dias_parado_na_unidade);
                const isCopied = copiedId === proc.id;

                return (
                  <tr key={proc.id} className={`hover:bg-slate-50/80 transition group ${isFav ? 'bg-amber-50/20' : ''}`}>
                    {/* Botão de Fixar / Favoritar */}
                    <td className="py-3 px-3 text-center align-middle">
                      <button
                        onClick={(e) => toggleFavorito(proc.id, e)}
                        className="p-1 rounded hover:bg-slate-200/60 transition"
                        title={isFav ? 'Remover da minha mesa' : 'Fixar na minha mesa'}
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

                    {/* Protocolos SEI e StartGov */}
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/processos/${proc.id}`}
                          className="font-bold text-blue-700 hover:underline"
                        >
                          {proc.protocolo_sei}
                        </Link>
                        {proc.tem_novidade_hoje && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 border border-blue-200 animate-pulse">
                            <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                            Novo
                          </span>
                        )}
                      </div>

                      {proc.protocolo_startgov ? (
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                          <span>{proc.protocolo_startgov}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic">
                          Aguardando StartGov
                        </div>
                      )}
                    </td>

                    {/* Objeto e Próximo Passo Esperado */}
                    <td className="py-3 px-4 max-w-sm">
                      <p className="font-semibold text-slate-900 line-clamp-1">
                        {proc.objeto}
                      </p>

                      {/* Próximo Passo Esperado em destaque */}
                      <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5 mt-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                        <Compass className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="text-blue-800 font-bold shrink-0">Próximo passo:</span>
                        <span className="text-slate-700 truncate">
                          {proc.proximo_passo_esperado || 'Tramitação de rotina'}
                        </span>
                      </div>
                    </td>

                    {/* Unidade Atual no SEI */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        {proc.unidade_atual_sei}
                      </span>
                    </td>

                    {/* Etapa Processual */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          proc.status_etapa
                        )}`}
                      >
                        {proc.status_etapa.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Semáforo de Inércia (3 níveis claros) */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${semaforo.dotClass}`}></span>
                          <span
                            className={`font-bold text-xs px-2 py-0.5 rounded border ${semaforo.badgeClass}`}
                          >
                            {proc.dias_parado_na_unidade} {proc.dias_parado_na_unidade === 1 ? 'dia' : 'dias'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {semaforo.label}
                        </span>
                      </div>
                    </td>

                    {/* Ações Rápidas: Copiar WhatsApp + Link */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botão Copiar para WhatsApp */}
                        <button
                          onClick={(e) => handleCopyWhatsApp(proc, e)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                            isCopied
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border-slate-200'
                          }`}
                          title="Copiar resumo formatado para WhatsApp ou Despacho"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-[10px]">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
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
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Abrir Metrô Processual"
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
