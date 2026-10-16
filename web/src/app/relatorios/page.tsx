'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Breadcrumb } from '../../components/Breadcrumb';
import { exportToExcel, exportToCSV, triggerPrintPDF } from '../../lib/exportUtils';
import { 
  BarChart3, 
  FileSpreadsheet, 
  Printer, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Download, 
  Building, 
  Info,
  Calendar,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface ContratoLegal {
  id: string;
  numeroContrato: string;
  processoSei: string;
  fornecedor: string;
  objeto: string;
  tipoContratacao: 'LICITACAO' | 'DISPENSA_INEXIGIBILIDADE';
  dataAssinatura: string;
  prazoLegalLimiteDiasUteis: number; // 20 para licitacao, 10 para direta (Art. 94)
  diasUteisDecorridos: number;
  publicadoPncp: boolean;
  dataPublicacaoPncp?: string | null;
  linkPncp?: string | null;
}

interface ContratoVigencia {
  id: string;
  numeroContrato: string;
  processoSei: string;
  fornecedor: string;
  objeto: string;
  unidadeGestora: string;
  valorAnual: string;
  dataFimVigencia: string;
  diasRestantes: number;
}

interface PermanenciaUnidade {
  unidadeSigla: string;
  unidadeNome: string;
  processosAtivos: number;
  mediaDiasUteis: number;
  tempoEmAnaliseDias: number;
  tempoAguardandoTerceiroDias: number;
  tempoSobrestadoDias: number;
  maiorGargaloDias: number;
}

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState<'art94' | 'vigencia' | 'permanencia'>('art94');

  // Base 1: Prazos de Publicação PNCP (Art. 94 Lei 14.133/2021)
  const [contratosArt94] = useState<ContratoLegal[]>([
    {
      id: 'c-01',
      numeroContrato: 'CT nº 045/2026-SEDUC',
      processoSei: 'SEI-021001/004521/2026',
      fornecedor: 'Maranhão Conectividade & Redes Ltda',
      objeto: 'Aquisição de Switches Gerenciáveis para Unidades Escolares',
      tipoContratacao: 'LICITACAO',
      dataAssinatura: '08/10/2026',
      prazoLegalLimiteDiasUteis: 20,
      diasUteisDecorridos: 6,
      publicadoPncp: true,
      dataPublicacaoPncp: '10/10/2026',
      linkPncp: 'https://pncp.gov.br/app/contratos/12345678000199-1-000045/2026'
    },
    {
      id: 'c-02',
      numeroContrato: 'CT nº 051/2026-SEDUC',
      processoSei: 'SEI-021001/007812/2026',
      fornecedor: 'CloudGov Soluções Tecnológicas S.A.',
      objeto: 'Serviços Especializados de Nuvem Governamental e Supabase',
      tipoContratacao: 'DISPENSA_INEXIGIBILIDADE',
      dataAssinatura: '02/10/2026',
      prazoLegalLimiteDiasUteis: 10,
      diasUteisDecorridos: 9, // Alerta: 9 de 10 dias úteis!
      publicadoPncp: false,
      dataPublicacaoPncp: null,
      linkPncp: null
    },
    {
      id: 'c-03',
      numeroContrato: 'CT nº 012/2026-SEDUC',
      processoSei: 'SEI-021001/009940/2026',
      fornecedor: 'NutriMaranhão Alimentos Ltda',
      objeto: 'Fornecimento Contínuo de Merenda Escolar para a Rede Estadual',
      tipoContratacao: 'LICITACAO',
      dataAssinatura: '15/08/2026',
      prazoLegalLimiteDiasUteis: 20,
      diasUteisDecorridos: 4,
      publicadoPncp: true,
      dataPublicacaoPncp: '21/08/2026',
      linkPncp: 'https://pncp.gov.br/app/contratos/12345678000199-2-000011/2026'
    }
  ]);

  // Base 2: Vigência de Contratos (RF13 - Alertas de 120, 90 e 60 dias)
  const [contratosVigencia] = useState<ContratoVigencia[]>([
    {
      id: 'cv-1',
      numeroContrato: 'CT nº 088/2025-SEDUC',
      processoSei: 'SEI-021001/001190/2025',
      fornecedor: 'Construtora Alvorada Ltda',
      objeto: 'Manutenção Preventiva de Telhados Escolares Regional São Luís',
      unidadeGestora: 'SUINFRA',
      valorAnual: 'R$ 2.400.000,00',
      dataFimVigencia: '15/12/2026',
      diasRestantes: 60 // Alerta Crítico (60 dias)
    },
    {
      id: 'cv-2',
      numeroContrato: 'CT nº 099/2025-SEDUC',
      processoSei: 'SEI-021001/002230/2025',
      fornecedor: 'InfoRedes Serviços de Telecomunicações',
      objeto: 'Suporte Técnico e Manutenção de Cabeamento Estruturado',
      unidadeGestora: 'STI',
      valorAnual: 'R$ 1.150.000,00',
      dataFimVigencia: '15/01/2027',
      diasRestantes: 91 // Alerta Médio (90 dias)
    },
    {
      id: 'cv-3',
      numeroContrato: 'CT nº 115/2025-SEDUC',
      processoSei: 'SEI-021001/003410/2025',
      fornecedor: 'LogTransportes Escolares do MA',
      objeto: 'Locação de Veículos para Transporte Administrativo',
      unidadeGestora: 'SUPERLOG',
      valorAnual: 'R$ 3.800.000,00',
      dataFimVigencia: '14/02/2027',
      diasRestantes: 121 // Alerta Inicial (120 dias)
    }
  ]);

  // Base 3: Tempos Médios de Permanência por Unidade (RF18)
  const [permanencias] = useState<PermanenciaUnidade[]>([
    {
      unidadeSigla: 'ASJUR',
      unidadeNome: 'Assessoria Jurídica da SEDUC',
      processosAtivos: 14,
      mediaDiasUteis: 7.8,
      tempoEmAnaliseDias: 5.2,
      tempoAguardandoTerceiroDias: 2.1,
      tempoSobrestadoDias: 0.5,
      maiorGargaloDias: 12
    },
    {
      unidadeSigla: 'CSL',
      unidadeNome: 'Comissão Setorial de Licitação',
      processosAtivos: 18,
      mediaDiasUteis: 5.4,
      tempoEmAnaliseDias: 3.8,
      tempoAguardandoTerceiroDias: 1.2,
      tempoSobrestadoDias: 0.4,
      maiorGargaloDias: 9
    },
    {
      unidadeSigla: 'STI',
      unidadeNome: 'Superintendência de Tecnologia da Informação',
      processosAtivos: 8,
      mediaDiasUteis: 3.6,
      tempoEmAnaliseDias: 2.5,
      tempoAguardandoTerceiroDias: 0.9,
      tempoSobrestadoDias: 0.2,
      maiorGargaloDias: 6
    },
    {
      unidadeSigla: 'SUINFRA',
      unidadeNome: 'Superintendência de Infraestrutura',
      processosAtivos: 22,
      mediaDiasUteis: 8.2,
      tempoEmAnaliseDias: 4.6,
      tempoAguardandoTerceiroDias: 2.8,
      tempoSobrestadoDias: 0.8,
      maiorGargaloDias: 18
    },
    {
      unidadeSigla: 'SUPRI',
      unidadeNome: 'Superintendência de Suprimentos',
      processosAtivos: 11,
      mediaDiasUteis: 4.1,
      tempoEmAnaliseDias: 3.0,
      tempoAguardandoTerceiroDias: 0.8,
      tempoSobrestadoDias: 0.3,
      maiorGargaloDias: 7
    }
  ]);

  // Ações de Exportação
  const handleExportExcel = () => {
    if (activeTab === 'art94') {
      exportToExcel('Relatorio_Art94_PNCP', 'Publicidade PNCP', contratosArt94, [
        { header: 'Número do Contrato', key: 'numeroContrato' },
        { header: 'Processo SEI', key: 'processoSei' },
        { header: 'Fornecedor', key: 'fornecedor' },
        { header: 'Modalidade', key: 'tipoContratacao' },
        { header: 'Data Assinatura', key: 'dataAssinatura' },
        { header: 'Prazo Limite (Dias Úteis)', key: 'prazoLegalLimiteDiasUteis' },
        { header: 'Dias Úteis Decorridos', key: 'diasUteisDecorridos' },
        { header: 'Publicado no PNCP', key: (c) => (c.publicadoPncp ? 'Sim' : 'Não') }
      ]);
    } else if (activeTab === 'vigencia') {
      exportToExcel('Relatorio_Vigencia_Contratos', 'Vigência Contratual', contratosVigencia, [
        { header: 'Contrato', key: 'numeroContrato' },
        { header: 'Processo SEI', key: 'processoSei' },
        { header: 'Fornecedor', key: 'fornecedor' },
        { header: 'Unidade Gestora', key: 'unidadeGestora' },
        { header: 'Valor Anual', key: 'valorAnual' },
        { header: 'Fim da Vigência', key: 'dataFimVigencia' },
        { header: 'Dias Restantes', key: 'diasRestantes' }
      ]);
    } else {
      exportToExcel('Relatorio_Permanencia_Unidades', 'Tempo de Permanência', permanencias, [
        { header: 'Sigla', key: 'unidadeSigla' },
        { header: 'Nome da Unidade', key: 'unidadeNome' },
        { header: 'Processos Ativos', key: 'processosAtivos' },
        { header: 'Média Dias Úteis', key: 'mediaDiasUteis' },
        { header: 'Em Análise (dias)', key: 'tempoEmAnaliseDias' },
        { header: 'Aguardando Terceiro (dias)', key: 'tempoAguardandoTerceiroDias' },
        { header: 'Sobrestado (dias)', key: 'tempoSobrestadoDias' },
        { header: 'Maior Gargalo (dias)', key: 'maiorGargaloDias' }
      ]);
    }
  };

  const handlePrint = () => {
    triggerPrintPDF('Relatório Gerencial PUMIP-SEDUC');
  };

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Trilha de Navegação */}
      <Breadcrumb
        items={[
          { label: 'Relatórios Executivos & Prazos Legais', isCurrent: true }
        ]}
      />

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-blue-700" />
            <h1 className="text-xl font-bold text-slate-900">
              Relatórios Gerenciais e Inteligência Processual
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Acompanhamento de prazos da Lei 14.133/2021, auditoria de publicidade no PNCP e tempo de permanência por unidade.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportExcel}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Abas dos Relatórios */}
      <div className="flex border-b border-slate-200 gap-3">
        <button
          onClick={() => setActiveTab('art94')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'art94'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Publicidade no PNCP (Art. 94 - RF12)</span>
        </button>

        <button
          onClick={() => setActiveTab('vigencia')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'vigencia'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Vigência Contratual (120/90/60d - RF13)</span>
        </button>

        <button
          onClick={() => setActiveTab('permanencia')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'permanencia'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Tempo Médio por Unidade & Estados (RF18)</span>
        </button>
      </div>

      {/* ABA 1: Publicidade no PNCP (Art. 94) */}
      {activeTab === 'art94' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 text-blue-950 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Regra Legal do Art. 94 da Lei 14.133/2021:</span>
              <p className="mt-0.5 text-blue-900 leading-relaxed">
                A divulgação no PNCP é condição indispensável para eficácia do contrato. Prazos: 
                <strong> 20 dias úteis</strong> no caso de licitação e <strong> 10 dias úteis</strong> na contratação direta, 
                contados da data de assinatura.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Contrato / Processo</th>
                    <th className="py-3 px-4">Fornecedor</th>
                    <th className="py-3 px-4">Assinatura</th>
                    <th className="py-3 px-4">Prazo Legal Limite</th>
                    <th className="py-3 px-4">Dias Úteis Decorridos</th>
                    <th className="py-3 px-4 text-center">Status PNCP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {contratosArt94.map((c) => {
                    const diasRestantes = c.prazoLegalLimiteDiasUteis - c.diasUteisDecorridos;
                    const emRisco = !c.publicadoPncp && diasRestantes <= 2;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{c.numeroContrato}</p>
                          <p className="text-[11px] font-mono text-blue-700">{c.processoSei}</p>
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-800">
                          {c.fornecedor}
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {c.dataAssinatura}
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {c.prazoLegalLimiteDiasUteis} dias úteis ({c.tipoContratacao === 'LICITACAO' ? 'Licitação' : 'Direta'})
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`font-bold px-2 py-0.5 rounded ${
                              emRisco
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {c.diasUteisDecorridos} dias úteis
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {c.publicadoPncp ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Publicado em {c.dataPublicacaoPncp}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full border border-red-200 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              Pendente! Restam {diasRestantes} dias úteis
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: Gestão de Vigência Contratual (RF13 / RF19) */}
      {activeTab === 'vigencia' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
              <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">
                Crítico: Vence em até 60 Dias
              </span>
              <span className="text-2xl font-bold text-red-700 mt-1 block">1 contrato</span>
              <p className="text-[11px] text-red-600 mt-0.5">Exige prorrogação ou certame imediato</p>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Alerta: Vence entre 60 e 90 Dias
              </span>
              <span className="text-2xl font-bold text-amber-700 mt-1 block">1 contrato</span>
              <p className="text-[11px] text-amber-600 mt-0.5">Fase de instrução do termo aditivo</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                Atenção: Vence entre 90 e 120 Dias
              </span>
              <span className="text-2xl font-bold text-blue-700 mt-1 block">1 contrato</span>
              <p className="text-[11px] text-blue-600 mt-0.5">Pesquisa de preços e manifestação</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Contrato</th>
                    <th className="py-3 px-4">Fornecedor / Objeto</th>
                    <th className="py-3 px-4">Unidade Gestora</th>
                    <th className="py-3 px-4">Valor Anual</th>
                    <th className="py-3 px-4">Término da Vigência</th>
                    <th className="py-3 px-4 text-center">Alerta Graduado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {contratosVigencia.map((cv) => (
                    <tr key={cv.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{cv.numeroContrato}</p>
                        <p className="text-[11px] font-mono text-blue-700">{cv.processoSei}</p>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800">{cv.fornecedor}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{cv.objeto}</p>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {cv.unidadeGestora}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {cv.valorAnual}
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {cv.dataFimVigencia}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            cv.diasRestantes <= 60
                              ? 'bg-red-100 text-red-800 border-red-200 animate-pulse'
                              : cv.diasRestantes <= 90
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}
                        >
                          Restam {cv.diasRestantes} dias
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: Tempo Médio de Permanência por Unidade e Sobrestamentos (RF18) */}
      {activeTab === 'permanencia' && (
        <div className="space-y-4">
          {/* Nota Metodológica Obrigatória (Descritivo Seção 10) */}
          <div className="bg-amber-50 border border-amber-200 text-amber-950 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Nota Metodológica Obrigatória (Mitigação de Riscos):</span>
              <p className="mt-0.5 text-amber-900 leading-relaxed">
                Os dados de permanência medem o fluxo processual da administração pública para identificação de gargalos estruturais e suporte às unidades. 
                <strong> Estes indicadores não constituem avaliação de desempenho individual de servidores públicos</strong> e separam adequadamente os períodos de sobrestamento e espera por diligências de terceiros.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Unidade / Setor</th>
                    <th className="py-3 px-4 text-center">Processos Ativos</th>
                    <th className="py-3 px-4 text-center">Tempo Médio Total</th>
                    <th className="py-3 px-4 text-center">Em Análise Técnica</th>
                    <th className="py-3 px-4 text-center">Aguardando Terceiro</th>
                    <th className="py-3 px-4 text-center">Sobrestado</th>
                    <th className="py-3 px-4 text-right">Maior Gargalo Registrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {permanencias.map((p) => (
                    <tr key={p.unidadeSigla} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">{p.unidadeSigla}</span>
                        <p className="text-[11px] text-slate-500">{p.unidadeNome}</p>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {p.processosAtivos}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-blue-700 text-sm">
                        {p.mediaDiasUteis.toFixed(1)} dias úteis
                      </td>

                      <td className="py-3 px-4 text-center text-slate-700">
                        {p.tempoEmAnaliseDias.toFixed(1)} dias
                      </td>

                      <td className="py-3 px-4 text-center text-slate-700">
                        {p.tempoAguardandoTerceiroDias.toFixed(1)} dias
                      </td>

                      <td className="py-3 px-4 text-center text-slate-700">
                        {p.tempoSobrestadoDias.toFixed(1)} dias
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          {p.maiorGargaloDias} dias
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
