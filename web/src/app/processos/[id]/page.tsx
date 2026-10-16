'use client';

import React, { useState, useEffect } from 'react';
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
  MessageSquare,
  Star,
  Share2,
  Check,
  Compass,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export default function ProcessoDetalhePage() {
  const params = useParams();
  const processoId = params.id as string;

  // Busca o processo correspondente
  const processo = mockProcessos.find((p) => p.id === processoId) || mockProcessos[0];
  const eventos = mockTramitacoes[processo.id] || mockTramitacoes[mockProcessos[0].id] || [];

  const [favorito, setFavorito] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Verifica se está nos favoritos
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pumip_favoritos');
      if (saved) {
        const favs: string[] = JSON.parse(saved);
        setFavorito(favs.includes(processo.id));
      }
    } catch (e) {
      console.warn('Erro ao carregar favoritos:', e);
    }
  }, [processo.id]);

  const toggleFavorito = () => {
    try {
      const saved = localStorage.getItem('pumip_favoritos');
      let favs: string[] = saved ? JSON.parse(saved) : [];
      if (favs.includes(processo.id)) {
        favs = favs.filter((id) => id !== processo.id);
        setFavorito(false);
      } else {
        favs.push(processo.id);
        setFavorito(true);
      }
      localStorage.setItem('pumip_favoritos', JSON.stringify(favs));
    } catch (e) {
      console.warn('Erro ao salvar favorito:', e);
    }
  };

  const handleCopyWhatsApp = () => {
    const texto = `📌 *Processo SEI:* ${processo.protocolo_sei}
🏢 *Objeto:* ${processo.objeto}
📍 *Localização Atual:* ${processo.unidade_atual_sei} (${processo.dias_parado_na_unidade} dias na unidade)
🎯 *Próximo Passo Esperado:* ${processo.proximo_passo_esperado || 'Tramitação setorial de rotina'}
🛒 *StartGov:* ${processo.protocolo_startgov || 'Aguardando vinculação'}
🔗 *Acompanhar no PUMIP:* http://localhost:3000/processos/${processo.id}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto).then(() => {
        setCopiedWhatsApp(true);
        setTimeout(() => setCopiedWhatsApp(false), 2500);
      });
    }
  };

  // Semáforo de Inércia (3 Níveis)
  const getSemaforo = (dias: number) => {
    if (dias >= 7) {
      return {
        dot: 'bg-red-500 animate-pulse',
        text: 'text-red-700',
        bg: 'bg-red-50 border-red-200',
        label: 'Gargalo Crítico (7+ dias sem tramitação)'
      };
    }
    if (dias >= 4) {
      return {
        dot: 'bg-amber-500',
        text: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-200',
        label: 'Atenção (4 a 6 dias na unidade)'
      };
    }
    return {
      dot: 'bg-emerald-500',
      text: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200',
      label: 'Regular (0 a 3 dias)'
    };
  };

  const semaforo = getSemaforo(processo.dias_parado_na_unidade);

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
      {/* Navegação de Retorno e Ações Principais */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Painel Executivo</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Fixar na Minha Mesa */}
          <button
            onClick={toggleFavorito}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
              favorito
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
            title={favorito ? 'Fixado na sua mesa' : 'Fixar na minha mesa'}
          >
            <Star className={`w-4 h-4 ${favorito ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
            <span>{favorito ? 'Fixado na Mesa' : 'Fixar na Minha Mesa'}</span>
          </button>

          {/* Botão Copiar para WhatsApp */}
          <button
            onClick={handleCopyWhatsApp}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
              copiedWhatsApp
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
            }`}
            title="Copiar resumo rápido pronto para WhatsApp ou Despacho"
          >
            {copiedWhatsApp ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copiado com Sucesso!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Copiar p/ WhatsApp</span>
              </>
            )}
          </button>

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
              {processo.tem_novidade_hoje && (
                <span className="text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Movimentado Hoje
                </span>
              )}
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

          {/* Indicadores de Tempo Parado e Setor Atual com Semáforo */}
          <div className="flex items-center gap-3 self-start">
            <div className={`rounded-lg p-3 text-center border ${semaforo.bg}`}>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${semaforo.dot}`}></span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-600">
                  Tempo Parado
                </span>
              </div>
              <span className={`text-xl font-bold ${semaforo.text}`}>
                {processo.dias_parado_na_unidade} {processo.dias_parado_na_unidade === 1 ? 'dia' : 'dias'}
              </span>
              <span className="text-[9px] block text-slate-500 mt-0.5">
                {semaforo.label}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center min-w-[120px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-0.5">
                Setor Atual
              </span>
              <span className="text-sm font-bold text-blue-800">
                {processo.unidade_atual_sei}
              </span>
              <span className="text-[9px] block text-slate-400 mt-0.5">
                No SEI GOVMA
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

      {/* Card Destaque: Próximo Passo Esperado */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600 text-white shadow-sm shrink-0 mt-0.5 sm:mt-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Próximo Passo Esperado
              </span>
              <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.2 rounded-full font-semibold">
                Guia Operacional
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {processo.proximo_passo_esperado || 'Tramitação setorial regular'}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Setor responsável atual: <strong className="text-blue-800">{processo.unidade_atual_sei}</strong>. 
              {processo.dias_parado_na_unidade >= 5 && ' Cobrança de despacho recomendada devido à inércia.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleCopyWhatsApp}
          className="self-end sm:self-center shrink-0 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
        >
          <Share2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Notificar Responsável</span>
        </button>
      </div>

      {/* Metrô Processual Unificado com Filtro de Marcos Críticos */}
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Registrar</span>
          </button>
        </form>
      </div>
    </div>
  );
}
