'use client';

import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../../components/Breadcrumb';
import { AdminGuard } from '../../../components/AdminGuard';
import { Abbr, InfoTooltip } from '../../../components/Tooltip';
import { 
  getFeriadosAno, 
  getFeriadosPersonalizados, 
  saveFeriadosPersonalizados, 
  calcularPermanenciaDetelhada, 
  Feriado 
} from '../../../lib/diasUteis';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { 
  Calendar, 
  Plus, 
  CheckCircle, 
  Calculator, 
  Trash2, 
  ShieldAlert, 
  MapPin, 
  Building2,
  CalendarCheck
} from 'lucide-react';

export default function AdminFeriadosPage() {
  const currentYear = 2026;
  const [ano, setAno] = useState<number>(currentYear);
  const [feriadosOficiais, setFeriadosOficiais] = useState<Feriado[]>([]);
  const [feriadosCustom, setFeriadosCustom] = useState<Feriado[]>([]);

  // Formulário de novo ponto facultativo / suspensão
  const [novaData, setNovaData] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [sucessoMsg, setSucessoMsg] = useState(false);

  // Testador de cálculo manual (Critério de Aceite RF04)
  const [testInicio, setTestInicio] = useState('2026-07-20');
  const [testFim, setTestFim] = useState('2026-08-05');
  const [testResult, setTestResult] = useState<{ diasCorridos: number; diasUteis: number; feriadosCruzados: Feriado[] } | null>(null);

  useEffect(() => {
    setFeriadosOficiais(getFeriadosAno(ano));
    setFeriadosCustom(getFeriadosPersonalizados());
  }, [ano]);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaData || !novoNome) return;

    const novo: Feriado = {
      id: `custom-${Date.now()}`,
      data: novaData,
      nome: novoNome,
      tipo: 'PONTO_FACULTATIVO_SEDUC',
      fixo: false
    };

    const updated = [novo, ...feriadosCustom];
    setFeriadosCustom(updated);
    saveFeriadosPersonalizados(updated);

    if (isSupabaseConfigured()) {
      supabase
        .from('feriados')
        .upsert({
          data: novaData,
          descricao: novoNome,
          abrangencia: 'MUNICIPAL'
        })
        .then(() => {});
    }

    setNovaData('');
    setNovoNome('');
    setSucessoMsg(true);
    setTimeout(() => setSucessoMsg(false), 3000);
  };

  const handleRemoveCustom = (id: string) => {
    const target = feriadosCustom.find((f) => f.id === id);
    const updated = feriadosCustom.filter((f) => f.id !== id);
    setFeriadosCustom(updated);
    saveFeriadosPersonalizados(updated);

    if (target && isSupabaseConfigured()) {
      supabase
        .from('feriados')
        .delete()
        .eq('data', target.data)
        .then(() => {});
    }
  };

  const handleRunTest = () => {
    if (!testInicio || !testFim) return;
    const res = calcularPermanenciaDetelhada(testInicio, testFim);
    setTestResult(res);
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'NACIONAL':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'ESTADUAL_MA':
        return 'bg-red-100 text-red-900 border-red-200';
      case 'MUNICIPAL_SLZ':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'PONTO_FACULTATIVO_SEDUC':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'NACIONAL':
        return 'Nacional';
      case 'ESTADUAL_MA':
        return 'Estadual (Maranhão)';
      case 'MUNICIPAL_SLZ':
        return 'Municipal (São Luís)';
      case 'PONTO_FACULTATIVO_SEDUC':
        return 'Ponto Facultativo / SEDUC';
      default:
        return tipo;
    }
  };

  return (
    <AdminGuard moduloNome="Gestão de Feriados & Prazos">
      <div className="space-y-5 max-w-6xl">
        {/* Trilha de Navegação */}
        <Breadcrumb
          items={[
            { label: 'Administração', href: '/admin/organograma' },
            { label: 'Feriados & Prazos Legais (RF04)', isCurrent: true }
          ]}
        />

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-blue-700" />
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Calendário de Feriados e Cálculo de Dias Úteis (RF04)</span>
              <InfoTooltip content="Cálculo oficial de permanência e SLA processual conforme Art. 183 da Lei 14.133/2021: exclui o dia do começo e inclui o do vencimento. Aplica o algoritmo de Meeus/Jones/Butcher para feriados móveis da Páscoa." />
            </h1>
            <span className="text-xs bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded border border-red-200">
              Módulo ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Regulamenta o cálculo oficial de permanência de processos da <Abbr sigla="SEDUC" />, excluindo feriados nacionais, 
            estaduais do Maranhão, municipais de São Luís e suspensões administrativas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-semibold">Exercício:</span>
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-blue-900 bg-white"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </div>

      {/* Grid: Formulário de Suspensão + Testador de Casos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário: Ponto Facultativo / Suspensão de Expediente */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Cadastrar Ponto Facultativo ou Suspensão SEDUC</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Insira decretos estaduais ou portarias de suspensão de expediente para não prejudicar os prazos das unidades.
            </p>
          </div>

          <form onSubmit={handleAddCustom} className="space-y-3 text-xs">
            <div>
              <label htmlFor="feriado-nova-data" className="block text-slate-700 font-semibold mb-1">
                Data da Suspensão:
              </label>
              <input
                id="feriado-nova-data"
                aria-label="Data da suspensão do expediente"
                type="date"
                required
                value={novaData}
                onChange={(e) => setNovaData(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="feriado-novo-nome" className="block text-slate-700 font-semibold mb-1">
                Descrição / Portaria:
              </label>
              <input
                id="feriado-novo-nome"
                aria-label="Descrição ou portaria da suspensão"
                type="text"
                required
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex: Ponto Facultativo - Portaria Gabinete SEDUC nº 142/2026"
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {sucessoMsg && (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5 animate-fade-in text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Salvo no calendário!
                </span>
              )}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition ml-auto shadow-sm"
              >
                Adicionar ao Calendário
              </button>
            </div>
          </form>
        </div>

        {/* Testador do Critério de Aceite RF04 */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Simulador de Permanência & Cruzamento de Feriados</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Valide o cálculo exato entre duas datas conforme os 5 casos de teste que cruzam feriados no Maranhão.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label htmlFor="simulador-test-inicio" className="block text-slate-700 font-semibold mb-1">Entrada na Unidade:</label>
              <input
                id="simulador-test-inicio"
                aria-label="Data de entrada na unidade"
                type="date"
                value={testInicio}
                onChange={(e) => setTestInicio(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white"
              />
            </div>
            <div>
              <label htmlFor="simulador-test-fim" className="block text-slate-700 font-semibold mb-1">Saída / Consulta:</label>
              <input
                id="simulador-test-fim"
                aria-label="Data de saída ou consulta"
                type="date"
                value={testFim}
                onChange={(e) => setTestFim(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white"
              />
            </div>
          </div>

          <button
            onClick={handleRunTest}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-3 rounded-lg text-xs transition"
          >
            Calcular Permanência (Dias Corridos x Úteis)
          </button>

          {testResult && (
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1">
                  <span>Dias Corridos:</span>
                  <InfoTooltip content="Total absoluto de dias entre as duas datas sem qualquer desconto." />
                </span>
                <span className="font-bold text-slate-900 text-sm">{testResult.diasCorridos} dias</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1">
                  <span>Dias Úteis Legais:</span>
                  <InfoTooltip content="Tempo líquido de tramitação excluindo fins de semana e feriados oficiais (Art. 183 da Lei 14.133/2021)." />
                </span>
                <span className="font-bold text-blue-700 text-sm">{testResult.diasUteis} dias úteis</span>
              </div>
              {testResult.feriadosCruzados.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">
                    Feriados descontados no período ({testResult.feriadosCruzados.length}):
                  </span>
                  <div className="space-y-1">
                    {testResult.feriadosCruzados.map((fc, i) => (
                      <span key={i} className="inline-block bg-amber-50 text-amber-900 border border-amber-200 text-xs px-2 py-0.5 rounded mr-1 mb-1">
                        {fc.data}: {fc.nome}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Feriados Vigorando no Ano */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Feriados em Vigor no Calendário ({ano})
            </h3>
            <p className="text-xs text-slate-500">
              Total de {feriadosOficiais.length + feriadosCustom.length} datas cadastradas para o exercício.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 font-semibold text-blue-900">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span> Nacional
            </span>
            <span className="flex items-center gap-1 font-semibold text-red-900">
              <span className="w-2 h-2 rounded-full bg-red-600"></span> Estadual MA
            </span>
            <span className="flex items-center gap-1 font-semibold text-emerald-900">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Municipal São Luís
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1">
                    <span>Data Oficial</span>
                    <InfoTooltip content="Data no formato DD/MM/AAAA considerada dia não útil para cômputo de prazos." />
                  </span>
                </th>
                <th className="py-3 px-4">Descrição do Feriado / Suspensão</th>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1">
                    <span>Âmbito Legal</span>
                    <InfoTooltip content="Jurisdição da norma: Federal (Lei 10.607), Estadual Maranhão (Lei 2.457), Municipal São Luís (Lei 3.432) ou Portaria SEDUC." />
                  </span>
                </th>
                <th className="py-3 px-4 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <span>Tipo</span>
                    <InfoTooltip content="Fixo (dia fixo do ano) ou Móvel (calculado pelas efemérides astronômicas da Páscoa)." />
                  </span>
                </th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Feriados Personalizados da SEDUC */}
              {feriadosCustom.map((fc) => (
                <tr key={fc.id} className="bg-purple-50/30 hover:bg-purple-50/60 transition">
                  <td className="py-3 px-4 font-mono font-bold text-purple-900">
                    {fc.data.split('-').reverse().join('/')}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {fc.nome}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-bold px-2 py-0.5 rounded border bg-purple-100 text-purple-900 border-purple-200">
                      Ponto Facultativo SEDUC
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-xs text-slate-500">Administrativo</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleRemoveCustom(fc.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded transition"
                      title="Excluir suspensão"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Feriados Legais Fixos e Móveis */}
              {feriadosOficiais.map((fo) => (
                <tr key={fo.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                    {fo.data.split('-').reverse().join('/')}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {fo.nome}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getTipoBadge(fo.tipo)}`}>
                      {formatTipoLabel(fo.tipo)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500 text-xs">
                    {fo.fixo ? 'Data Fixa' : 'Data Móvel'}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 text-xs">
                    Oficial
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </AdminGuard>
  );
}
