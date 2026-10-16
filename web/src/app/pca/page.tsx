'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Breadcrumb } from '../../components/Breadcrumb';
import { mockProcessos } from '../../lib/mockData';
import { exportToExcel, exportToCSV } from '../../lib/exportUtils';
import { 
  ClipboardList, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  ArrowRight,
  TrendingUp,
  Building
} from 'lucide-react';

interface ItemPCA {
  id: string;
  codigoPca: string;
  descricao: string;
  unidadeDemandante: string;
  categoria: 'TIC' | 'OBRAS_ENGENHARIA' | 'MATERIAL_CONSUMO' | 'SERVICOS';
  valorEstimado: number;
  processoSeiId?: string | null;
  protocoloSei?: string | null;
  statusExecucao: 'NAO_INICIADO' | 'FASE_INTERNA_SEI' | 'LICITACAO_STARTGOV' | 'CONTRATADO';
}

export default function PcaPage() {
  const [itensPca] = useState<ItemPCA[]>([
    {
      id: 'pca-01',
      codigoPca: 'PCA-2026-TIC-001',
      descricao: 'Aquisição de Switches Gerenciáveis e Equipamentos de Conectividade Escolar',
      unidadeDemandante: 'SUDES / STI',
      categoria: 'TIC',
      valorEstimado: 1450000,
      processoSeiId: '10000000-0000-0000-0000-000000000001',
      protocoloSei: 'SEI-021001/004521/2026',
      statusExecucao: 'LICITACAO_STARTGOV'
    },
    {
      id: 'pca-02',
      codigoPca: 'PCA-2026-TIC-002',
      descricao: 'Contratação de Serviços Especializados de Nuvem Governamental e Supabase',
      unidadeDemandante: 'SUDES / STI',
      categoria: 'TIC',
      valorEstimado: 820000,
      processoSeiId: '10000000-0000-0000-0000-000000000002',
      protocoloSei: 'SEI-021001/007812/2026',
      statusExecucao: 'FASE_INTERNA_SEI'
    },
    {
      id: 'pca-03',
      codigoPca: 'PCA-2026-OBR-003',
      descricao: 'Reforma e Modernização Estrutural das Escolas DIGNAS do Polo Munin',
      unidadeDemandante: 'SUINFRA',
      categoria: 'OBRAS_ENGENHARIA',
      valorEstimado: 4200000,
      processoSeiId: '10000000-0000-0000-0000-000000000003',
      protocoloSei: 'SEI-021001/001190/2026',
      statusExecucao: 'FASE_INTERNA_SEI'
    },
    {
      id: 'pca-04',
      codigoPca: 'PCA-2026-ALIM-004',
      descricao: 'Registro de Preços para Fornecimento Contínuo de Merenda Escolar na Rede',
      unidadeDemandante: 'SUPRI',
      categoria: 'MATERIAL_CONSUMO',
      valorEstimado: 12500000,
      processoSeiId: '10000000-0000-0000-0000-000000000004',
      protocoloSei: 'SEI-021001/009940/2026',
      statusExecucao: 'CONTRATADO'
    },
    {
      id: 'pca-05',
      codigoPca: 'PCA-2026-TIC-005',
      descricao: 'Contratação de Links de Internet Dedicada e Fibra Óptica para Unidades Escolares',
      unidadeDemandante: 'SUPREDES / STI',
      categoria: 'TIC',
      valorEstimado: 3800000,
      processoSeiId: null,
      protocoloSei: null,
      statusExecucao: 'NAO_INICIADO'
    },
    {
      id: 'pca-06',
      codigoPca: 'PCA-2026-SER-006',
      descricao: 'Serviços Especializados de Apoio Operacional e Limpeza Predial nas Escolas',
      unidadeDemandante: 'SUPERLOG',
      categoria: 'SERVICOS',
      valorEstimado: 6400000,
      processoSeiId: null,
      protocoloSei: null,
      statusExecucao: 'NAO_INICIADO'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');

  // Cálculos do Painel
  const totalItens = itensPca.length;
  const itensIniciados = itensPca.filter((i) => i.processoSeiId !== null).length;
  const percentExecutado = Math.round((itensIniciados / totalItens) * 100);
  const emLicitacao = itensPca.filter((i) => i.statusExecucao === 'LICITACAO_STARTGOV').length;
  const contratados = itensPca.filter((i) => i.statusExecucao === 'CONTRATADO').length;
  const naoIniciados = itensPca.filter((i) => i.statusExecucao === 'NAO_INICIADO').length;

  const filtered = itensPca.filter((item) => {
    const matchesSearch =
      item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigoPca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.unidadeDemandante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.protocoloSei && item.protocoloSei.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'TODOS' || item.statusExecucao === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const formatMoeda = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LICITACAO_STARTGOV':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'FASE_INTERNA_SEI':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONTRATADO':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'NAO_INICIADO':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case 'LICITACAO_STARTGOV':
        return 'Em Licitação (StartGov)';
      case 'FASE_INTERNA_SEI':
        return 'Fase Interna (SEI)';
      case 'CONTRATADO':
        return 'Contratado / Vigente';
      case 'NAO_INICIADO':
        return 'Não Iniciado no SEI';
      default:
        return status;
    }
  };

  const handleExportarExcel = () => {
    exportToExcel('PCA_SEDUC_2026', 'Itens PCA', filtered, [
      { header: 'Código PCA', key: 'codigoPca' },
      { header: 'Descrição do Objeto', key: 'descricao' },
      { header: 'Unidade Demandante', key: 'unidadeDemandante' },
      { header: 'Categoria', key: 'categoria' },
      { header: 'Valor Estimado (R$)', key: (i) => i.valorEstimado },
      { header: 'Processo SEI', key: (i) => i.protocoloSei || 'Não aberto' },
      { header: 'Status de Execução', key: (i) => formatStatusLabel(i.statusExecucao) }
    ]);
  };

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Trilha de Navegação */}
      <Breadcrumb
        items={[
          { label: 'Plano de Contratações Anual (PCA 2026)', isCurrent: true }
        ]}
      />

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-5 h-5 text-blue-700" />
            <h1 className="text-xl font-bold text-slate-900">
              Plano de Contratações Anual - PCA 2026 (RF14)
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Acompanhamento da execução do planejamento anual de compras da SEDUC-MA com correlação automática ao SEI e StartGov.
          </p>
        </div>

        <button
          onClick={handleExportarExcel}
          className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Planilha (Excel)</span>
        </button>
      </div>

      {/* Cards de Execução do PCA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Itens Planejados no PCA
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{totalItens} itens</span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {percentExecutado}% Iniciados
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${percentExecutado}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Em Licitação (StartGov)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600">{emLicitacao}</span>
            <span className="text-xs text-emerald-800 font-medium">Fase Externa</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Disputa de preços em curso</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Contratados / Vigentes
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-purple-600">{contratados}</span>
            <span className="text-xs text-purple-800 font-medium">Publicado PNCP</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Contrato assinado em execução</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Demandas Não Iniciadas
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-red-600">{naoIniciados}</span>
            <span className="text-xs font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
              Ação Requerida
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Sem processo autuado no SEI</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código PCA, objeto ou unidade..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-600 font-medium">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="NAO_INICIADO">Não Iniciados no SEI</option>
            <option value="FASE_INTERNA_SEI">Fase Interna (SEI)</option>
            <option value="LICITACAO_STARTGOV">Em Licitação (StartGov)</option>
            <option value="CONTRATADO">Contratados</option>
          </select>
        </div>
      </div>

      {/* Tabela de Itens do PCA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item PCA</th>
                <th className="py-3 px-4">Descrição da Demanda</th>
                <th className="py-3 px-4">Unidade Demandante</th>
                <th className="py-3 px-4">Valor Estimado</th>
                <th className="py-3 px-4">Processo SEI Vinculado</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    {item.codigoPca}
                  </td>

                  <td className="py-3 px-4 max-w-xs">
                    <p className="font-semibold text-slate-900 line-clamp-2">
                      {item.descricao}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Categoria: {item.categoria}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-700">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {item.unidadeDemandante}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {formatMoeda(item.valorEstimado)}
                  </td>

                  <td className="py-3 px-4 font-mono">
                    {item.protocoloSei ? (
                      <Link
                        href={`/processos/${item.processoSeiId}`}
                        className="font-bold text-blue-700 hover:underline flex items-center gap-1"
                        title="Ver Linha do Tempo no Metrô Processual"
                      >
                        <span>{item.protocoloSei}</span>
                        <ArrowRight className="w-3 h-3 text-blue-500" />
                      </Link>
                    ) : (
                      <span className="text-[11px] text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-sans font-medium">
                        Pendente de autuação
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(item.statusExecucao)}`}>
                      {formatStatusLabel(item.statusExecucao)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
