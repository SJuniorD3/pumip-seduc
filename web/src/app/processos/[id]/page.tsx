'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { mockProcessos, mockTramitacoes } from '../../../lib/mockData';
import { MetroTimeline } from '../../../components/MetroTimeline';
import { SyncButton } from '../../../components/SyncButton';
import { 
  ArrowLeft, 
  Building, 
  Calendar, 
  Clock, 
  ExternalLink, 
  FileText, 
  ShieldAlert, 
  Send,
  MessageSquare
} from 'lucide-react';

export default function ProcessoDetalhePage() {
  const params = useParams();
  const processoId = params.id as string;

  // Busca o processo correspondente
  const processo = mockProcessos.find((p) => p.id === processoId) || mockProcessos[0];
  const eventos = mockTramitacoes[processo.id] || mockTramitacoes[mockProcessos[0].id] || [];

  // Estado para novas notas internas (RF15)
  const [notas, setNotas] = useState([
    {
      id: 'nota-1',
      autor: 'Servulo Junior (SUPTI)',
      data: '14/10/2026 às 16:30',
      conteudo: 'Aprovada minuta técnica do Termo de Referência com a equipe de redes. Aguardando envio formal à CSL.',
      versao: 1
    }
  ]);
  const [novaNota, setNovaNota] = useState('');

  const handleAddNota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaNota.trim()) return;

    setNotas([
      ...notas,
      {
        id: `nota-${Date.now()}`,
        autor: 'Servulo Junior (SUPTI)',
        data: 'Hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        conteudo: novaNota.trim(),
        versao: 1
      }
    ]);
    setNovaNota('');
  };

  return (
    <div className="space-y-6">
      {/* Navegação de Retorno */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Painel Executivo</span>
        </Link>

        <div className="flex items-center gap-3">
          <SyncButton
            processoId={processo.id}
            ultimaVerificacao={processo.ultima_verificacao_em}
          />
        </div>
      </div>

      {/* Cartão de Resumo do Processo */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-base font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                {processo.protocolo_sei}
              </span>
              {processo.protocolo_startgov ? (
                <span className="text-sm font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1">
                  <span>StartGov: {processo.protocolo_startgov}</span>
                  <ExternalLink className="w-3 h-3 text-emerald-600" />
                </span>
              ) : (
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                  Sem vínculo StartGov
                </span>
              )}
              {processo.numero_contrato_pncp && (
                <span className="text-xs font-mono bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                  PNCP: {processo.numero_contrato_pncp}
                </span>
              )}
            </div>

            <h1 className="text-lg font-bold text-slate-900 mt-2">
              {processo.objeto}
            </h1>
          </div>

          <div className="flex items-center gap-3 self-start">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                Tempo Parado
              </span>
              <span
                className={`text-xl font-bold ${
                  processo.dias_parado_na_unidade >= 5 ? 'text-red-600' : 'text-slate-800'
                }`}
              >
                {processo.dias_parado_na_unidade} dias
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                Setor Atual
              </span>
              <span className="text-sm font-bold text-blue-800">
                {processo.unidade_atual_sei}
              </span>
            </div>
          </div>
        </div>

        {/* Metadados adicionais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block mb-0.5">Unidade de Origem:</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              {processo.unidade_origem?.nome || 'SUPDEV / SUPTI'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Última Movimentação:</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {new Date(processo.ultima_movimentacao_em).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Fase no StartGov:</span>
            <span className="font-semibold text-emerald-700">
              {processo.fase_atual_startgov || 'Não iniciado na fase externa'}
            </span>
          </div>
        </div>
      </div>

      {/* Metrô Processual Unificado */}
      <MetroTimeline
        eventos={eventos}
        protocoloSei={processo.protocolo_sei}
        protocoloStartGov={processo.protocolo_startgov}
      />

      {/* Notas Internas de Acompanhamento (RF15 - Conforme LAI) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Notas Internas de Acompanhamento Setorial (RF15)
            </h2>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
            {notas.length} notas
          </span>
        </div>

        {/* Aviso Obrigatório da LAI */}
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Aviso Permanente - Lei nº 12.527/2011 (LAI):</span>
            <p className="mt-0.5 text-amber-800">
              Notas registradas sobre processos administrativos constituem informação pública sujeita a requerimento pela LAI. 
              As notas não sofrem exclusão definitiva; eventuais retificações preservam o histórico de versões anteriores.
            </p>
          </div>
        </div>

        {/* Lista de Notas */}
        <div className="space-y-3">
          {notas.map((n) => (
            <div key={n.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-semibold text-slate-700">{n.autor}</span>
                <span>{n.data}</span>
              </div>
              <p className="text-slate-800 font-medium">{n.conteudo}</p>
            </div>
          ))}
        </div>

        {/* Formulário de Nova Nota */}
        <form onSubmit={handleAddNota} className="flex gap-2 pt-2">
          <input
            type="text"
            value={novaNota}
            onChange={(e) => setNovaNota(e.target.value)}
            placeholder="Adicionar nota interna de acompanhamento (ex: agendada reunião com fornecedor)..."
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Registrar</span>
          </button>
        </form>
      </div>
    </div>
  );
}
