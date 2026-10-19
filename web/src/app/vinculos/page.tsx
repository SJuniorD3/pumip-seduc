'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Breadcrumb } from '../../components/Breadcrumb';
import { mockProcessos } from '../../lib/mockData';
import { 
  GitMerge, 
  CheckCircle, 
  XCircle, 
  Plus, 
  ShieldCheck, 
  Search, 
  ArrowRight, 
  Percent, 
  FileText,
  Clock,
  Building
} from 'lucide-react';
import { Abbr, InfoTooltip } from '../../components/Tooltip';

interface SugestaoVinculo {
  id: string;
  processoId: string;
  protocoloSei: string;
  objetoSei: string;
  unidadeOrigem: string;
  protocoloStartGov: string;
  modalidadeStartGov: string;
  fornecedorSugerido: string;
  valorEstimado: string;
  trechoOrigem: string;
  confiancaPercent: number;
  status: 'PENDENTE' | 'CONFIRMADO' | 'REJEITADO';
  confirmadoPor?: string;
  confirmadoEm?: string;
}

export default function VinculosPage() {
  const [sugestoes, setSugestoes] = useState<SugestaoVinculo[]>([
    {
      id: 'sug-1',
      processoId: '10000000-0000-0000-0000-000000000001',
      protocoloSei: 'SEI-021001/004521/2026',
      objetoSei: 'Aquisição de Switches Gerenciáveis e Roteadores para Expansão da Rede Escolar Digital',
      unidadeOrigem: 'SUDES / STI',
      protocoloStartGov: 'STARTGOV-2026/0892',
      modalidadeStartGov: 'Pregão Eletrônico PE nº 042/2026',
      fornecedorSugerido: 'Maranhão Conectividade & Redes Ltda',
      valorEstimado: 'R$ 1.450.000,00',
      trechoOrigem: '...Aviso de Licitação PE 042/2026 oriundo do processo administrativo SEI-021001/004521/2026 da SEDUC...',
      confiancaPercent: 98,
      status: 'CONFIRMADO',
      confirmadoPor: 'Sérvulo José Freire Junior (SUDES)',
      confirmadoEm: '05/10/2026 às 11:15'
    },
    {
      id: 'sug-2',
      processoId: '10000000-0000-0000-0000-000000000002',
      protocoloSei: 'SEI-021001/007812/2026',
      objetoSei: 'Contratação de Serviços Especializados de Nuvem Governamental e Banco de Dados Supabase',
      unidadeOrigem: 'SUDES / STI',
      protocoloStartGov: 'STARTGOV-2026/1045',
      modalidadeStartGov: 'Inexigibilidade / Contratação Direta nº 018/2026',
      fornecedorSugerido: 'CloudGov Soluções Tecnológicas S.A.',
      valorEstimado: 'R$ 820.000,00',
      trechoOrigem: '...Termo de Referência referente à demanda de nuvem e banco de dados protocolada no SEI 021001/007812/2026...',
      confiancaPercent: 94,
      status: 'PENDENTE'
    },
    {
      id: 'sug-3',
      processoId: '10000000-0000-0000-0000-000000000003',
      protocoloSei: 'SEI-021001/001190/2026',
      objetoSei: 'Elaboração de ETP e Termo de Referência para Reforma e Modernização das Escolas DIGNAS',
      unidadeOrigem: 'SUINFRA',
      protocoloStartGov: 'STARTGOV-2026/1102',
      modalidadeStartGov: 'Concorrência Pública nº 012/2026',
      fornecedorSugerido: 'Consórcio Construtor Munin',
      valorEstimado: 'R$ 4.200.000,00',
      trechoOrigem: '...Obras civis e adequação física das unidades DIGNAS polo Munin vinculadas ao processo 001190/2026...',
      confiancaPercent: 82,
      status: 'PENDENTE'
    }
  ]);

  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSeiId, setManualSeiId] = useState(mockProcessos[0].id);
  const [manualStartGovCode, setManualStartGovCode] = useState('');
  const [sucessoMsg, setSucessoMsg] = useState(false);

  const handleConfirmar = (id: string) => {
    setSugestoes(
      sugestoes.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'CONFIRMADO',
              confirmadoPor: 'Sérvulo José Freire Junior (SUDES)',
              confirmadoEm: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            }
          : s
      )
    );
  };

  const handleRejeitar = (id: string) => {
    setSugestoes(
      sugestoes.map((s) => (s.id === id ? { ...s, status: 'REJEITADO' } : s))
    );
  };

  const handleCriarVinculoManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStartGovCode.trim()) return;

    const proc = mockProcessos.find((p) => p.id === manualSeiId) || mockProcessos[0];

    const novo: SugestaoVinculo = {
      id: `manual-${Date.now()}`,
      processoId: proc.id,
      protocoloSei: proc.protocolo_sei,
      objetoSei: proc.objeto,
      unidadeOrigem: proc.unidade_origem?.sigla || 'SEDUC',
      protocoloStartGov: manualStartGovCode.trim().toUpperCase(),
      modalidadeStartGov: 'Vinculação Manual Registrada pelo Servidor',
      fornecedorSugerido: 'A confirmar na leitura do certame',
      valorEstimado: 'A apurar',
      trechoOrigem: 'Vinculação manual direta autorizada pelo servidor responsável.',
      confiancaPercent: 100,
      status: 'CONFIRMADO',
      confirmadoPor: 'Sérvulo José Freire Junior (SUDES)',
      confirmadoEm: new Date().toLocaleDateString('pt-BR')
    };

    setSugestoes([novo, ...sugestoes]);
    setManualStartGovCode('');
    setShowManualModal(false);
    setSucessoMsg(true);
    setTimeout(() => setSucessoMsg(false), 3000);
  };

  const pendentes = sugestoes.filter((s) => s.status === 'PENDENTE');
  const confirmados = sugestoes.filter((s) => s.status === 'CONFIRMADO');

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Trilha de Navegação */}
      <Breadcrumb
        items={[
          { label: 'Vínculos SEI ↔ StartGov (RF16)', isCurrent: true }
        ]}
      />

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitMerge className="w-5 h-5 text-blue-700" />
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Vinculação de Processos: <Abbr sigla="SEI" /> &harr; <Abbr sigla="StartGov" /> (RF16)</span>
              <InfoTooltip content="Conexão cruzada entre a tramitação preparatória interna no SEI-GOVMA e o certame licitatório no StartGov. Conforme o requisito RF16, o cruzamento algorítmico requer validação humana formal de auditoria." />
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Conforme a Seção 4.3 do Descritivo Técnico, o robô sugere correlações baseadas em regex, mas 
            <strong> nenhum vínculo se torna oficial sem a validação humana registrada</strong>.
          </p>
        </div>

        <button
          onClick={() => setShowManualModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition shadow-sm self-start sm:self-auto"
          title="Criar vinculação direta quando a busca automática não identificar a correspondência"
        >
          <Plus className="w-4 h-4" />
          <span>Vincular Manualmente</span>
        </button>
      </div>

      {sucessoMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Vínculo confirmado com sucesso e consolidado na Linha do Tempo Unificada!</span>
        </div>
      )}

      {/* Seção 1: Vínculos Sugeridos Aguardando Validação Humana */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Sugestões Pendentes de Confirmação Humana</span>
              <InfoTooltip content="Sugestões detectadas pelo robô coletor ao localizar menções a protocolos SEI nos avisos de licitação e editais do StartGov." />
            </h2>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
              {pendentes.length} pendentes
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Identificado automaticamente via Regex e cruzamento de metadados
          </span>
        </div>

        {pendentes.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            Nenhuma nova sugestão de vínculo pendente no momento.
          </div>
        ) : (
          <div className="space-y-3">
            {pendentes.map((sug) => (
              <div
                key={sug.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                  <div className="flex items-center gap-3">
                    <span 
                      title="Processo administrativo autuado no SEI-GOVMA"
                      className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 cursor-help"
                    >
                      SEI: {sug.protocoloSei}
                    </span>
                    <span className="text-slate-400 font-bold">&harr;</span>
                    <span 
                      title="Certame licitatório correspondente na plataforma StartGov"
                      className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 cursor-help"
                    >
                      StartGov: {sug.protocoloStartGov}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span 
                      title="Grau de certeza do cruzamento baseado em menção expressa do número do processo nos autos do certame"
                      className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-slate-200 cursor-help"
                    >
                      <Percent className="w-3 h-3 text-blue-600" />
                      <span>{sug.confiancaPercent}% de Confiança</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-semibold">Demanda no SEI:</span>
                    <p className="font-medium text-slate-900">{sug.objetoSei}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Unidade de Origem: <strong><Abbr sigla={sug.unidadeOrigem} /></strong>
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5 font-semibold">Contratação no StartGov:</span>
                    <p className="font-medium text-emerald-900 font-semibold">{sug.modalidadeStartGov}</p>
                    <p className="text-[11px] text-slate-600">Fornecedor: {sug.fornecedorSugerido}</p>
                    <p className="text-[11px] text-slate-600">Valor Estimado: {sug.valorEstimado}</p>
                  </div>
                </div>

                {/* Trecho onde foi encontrado */}
                <div 
                  title="Evidência textual capturada pelo coletor para comprovar o vínculo"
                  className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs cursor-help"
                >
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Trecho de Origem Localizado pelo Robô:
                  </span>
                  <p className="font-mono text-[11px] text-slate-700 italic">
                    &ldquo;{sug.trechoOrigem}&rdquo;
                  </p>
                </div>

                {/* Ações de Confirmação */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleRejeitar(sug.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
                    title="Descartar esta sugestão caso se trate de falso positivo ou homônimo"
                  >
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                    <span>Rejeitar Vínculo</span>
                  </button>

                  <button
                    onClick={() => handleConfirmar(sug.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-sm"
                    title="Registrar sua assinatura eletrônica de auditoria e unificar a linha do tempo no Metrô Processual"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirmar e Vincular Linha do Tempo</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seção 2: Histórico de Vínculos Confirmados */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Vínculos Ativos e Validados ({confirmados.length})
          </h3>
          <p className="text-[11px] text-slate-500">
            Processos com linha do tempo unificada em operação entre SEI e StartGov.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Protocolo SEI</th>
                <th className="py-3 px-4">Contratação StartGov</th>
                <th className="py-3 px-4">Objeto</th>
                <th className="py-3 px-4">Validado por</th>
                <th className="py-3 px-4 text-right">Metrô</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {confirmados.map((conf) => (
                <tr key={conf.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">
                    {conf.protocoloSei}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                    {conf.protocoloStartGov}
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate font-medium text-slate-800">
                    {conf.objetoSei}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800">{conf.confirmadoPor}</p>
                    <span className="text-[10px] text-slate-400">{conf.confirmadoEm}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/processos/${conf.processoId}`}
                      className="p-1.5 text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                    >
                      <span>Abrir</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Vinculação Manual */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                Vincular Processo SEI &harr; StartGov Manualmente
              </h2>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCriarVinculoManual} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Selecione o Processo no SEI:
                </label>
                <select
                  value={manualSeiId}
                  onChange={(e) => setManualSeiId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {mockProcessos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.protocolo_sei} - {p.objeto.substring(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Identificador / Certame no StartGov:
                </label>
                <input
                  type="text"
                  required
                  value={manualStartGovCode}
                  onChange={(e) => setManualStartGovCode(e.target.value)}
                  placeholder="Ex: STARTGOV-2026/0892 ou PE nº 042/2026"
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500">
                A vinculação manual consolidará automaticamente os eventos do StartGov na Linha do Tempo Unificada do processo e registrará seu usuário na trilha de auditoria.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm"
                >
                  Confirmar Vínculo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
