'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { mockProcessos, mockTramitacoes } from '../../../lib/mockData';
import { MetroTimeline } from '../../../components/MetroTimeline';
import { SyncButton } from '../../../components/SyncButton';
import { Breadcrumb } from '../../../components/Breadcrumb';
import { Abbr, InfoTooltip } from '../../../components/Tooltip';
import { useAuth } from '../../../lib/authContext';
import { filterProcessosByRLS } from '../../../lib/rlsFilter';
import { getSemaforoInercia, isSlaEstourado } from '../../../lib/slaConfig';
import { isSupabaseConfigured } from '../../../lib/supabase';
import { obterProcessoPorIdBanco } from '../../../lib/dados/processos';
import { listarNotasProcessoBanco, criarNotaProcessoBanco } from '../../../lib/dados/notas';
import { Processo } from '../../../lib/types';
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
  AlertTriangle,
  SearchX
} from 'lucide-react';

export default function ProcessoDetalhePage() {
  const params = useParams();
  const processoId = params.id as string;
  const { user } = useAuth();
  const [processoBanco, setProcessoBanco] = useState<Processo | null>(null);

  useEffect(() => {
    if (isSupabaseConfigured() && processoId) {
      obterProcessoPorIdBanco(processoId)
        .then((p) => {
          if (p) setProcessoBanco(p);
        })
        .catch(() => {});
    }
  }, [processoId]);

  // REMEDIAÇÃO P0-5: Aplica filtro RLS antes de buscar — usuário só vê processo se tiver permissão
  const processosAutorizados = filterProcessosByRLS(mockProcessos, user);
  const processo = processoBanco || processosAutorizados.find((p) => p.id === processoId);
  const eventos = processo ? (mockTramitacoes[processo.id] || []) : [];

  const [favorito, setFavorito] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Notas internas com persistência local (RF15)
  const [notas, setNotas] = useState<Array<{
    id: string;
    autor: string;
    data: string;
    conteudo: string;
    versao: number;
  }>>([]);
  const [novaNota, setNovaNota] = useState('');

  // Carrega favoritos e notas persistidas no navegador
  useEffect(() => {
    if (!processo) return;

    try {
      // 1. Favoritos
      const savedFavs = localStorage.getItem('pumip_favoritos');
      if (savedFavs) {
        const favs: string[] = JSON.parse(savedFavs);
        setFavorito(favs.includes(processo.id));
      }

      // 2. Notas Internas: Sincronização com Supabase e Fallback Local
      if (isSupabaseConfigured() && processo.id.length === 36) {
        listarNotasProcessoBanco(processo.id).then((bancoNotas) => {
          if (bancoNotas.length > 0) {
            setNotas(
              bancoNotas.map((n) => ({
                id: n.id,
                autor: `${n.autor_nome} (${n.autor_sigla || 'SEDUC'})`,
                data: new Date(n.created_at).toLocaleString('pt-BR'),
                conteudo: n.conteudo,
                versao: n.versao
              }))
            );
            return;
          }
        }).catch(() => {});
      }

      const savedNotas = localStorage.getItem(`pumip_notas_${processo.id}`);
      if (savedNotas) {
        setNotas(JSON.parse(savedNotas));
      } else {
        // Inicializa com a nota padrão histórica
        const defaultNotes = [
          {
            id: 'nota-1',
            autor: 'Sérvulo Junior (SUDES)',
            data: '14/10/2026 às 16:30',
            conteudo: 'Aprovada minuta técnica do Termo de Referência com a equipe de redes. Aguardando envio formal à CSL.',
            versao: 1
          }
        ];
        setNotas(defaultNotes);
        localStorage.setItem(`pumip_notas_${processo.id}`, JSON.stringify(defaultNotes));
      }
    } catch (e) {
      console.warn('Erro ao carregar dados locais:', e);
    }
  }, [processo]);

  const toggleFavorito = () => {
    if (!processo) return;
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
    if (!processo) return;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://pumip.seduc.ma.gov.br');
    const texto = `📌 *Processo SEI:* ${processo.protocolo_sei}
🏢 *Objeto:* ${processo.objeto}
📍 *Localização Atual:* ${processo.unidade_atual_sei} (${processo.dias_parado_na_unidade} dias na unidade)
🎯 *Próximo Passo Esperado:* ${processo.proximo_passo_esperado || 'Tramitação setorial de rotina'}
🛒 *StartGov:* ${processo.protocolo_startgov || 'Aguardando vinculação'}
🔗 *Acompanhar no PUMIP:* ${siteUrl}/processos/${processo.id}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto).then(() => {
        setCopiedWhatsApp(true);
        setTimeout(() => setCopiedWhatsApp(false), 2500);
      });
    }
  };

  const handleAddNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaNota.trim() || !processo) return;

    let novaId = `nota-${Date.now()}`;
    const textoNota = novaNota.trim();

    if (isSupabaseConfigured() && processo.id.length === 36 && user.id.length === 36) {
      const notaSalva = await criarNotaProcessoBanco({
        processo_id: processo.id,
        usuario_id: user.id,
        conteudo: textoNota
      });
      if (notaSalva) {
        novaId = notaSalva.id;
      }
    }

    const nova = {
      id: novaId,
      autor: `${user.nome} (${user.unidade_sigla})`,
      data: 'Hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      conteudo: textoNota,
      versao: 1
    };

    const atualizadas = [...notas, nova];
    setNotas(atualizadas);
    setNovaNota('');
    try {
      localStorage.setItem(`pumip_notas_${processo.id}`, JSON.stringify(atualizadas));
    } catch (err) {
      console.warn('Erro ao persistir nota:', err);
    }
  };

  // ESTADO 404: Se o processo não existe
  if (!processo) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-10">
        <Breadcrumb
          items={[
            { label: 'Processos Monitorados', href: '/processos' },
            { label: 'Processo não encontrado', isCurrent: true }
          ]}
        />

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
            <SearchX className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full border border-amber-200 uppercase tracking-wider">
              Erro 404 &bull; Não Localizado
            </span>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-3">
              Processo Não Encontrado na Carteira
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mt-2 leading-relaxed">
              O protocolo ou identificador informado (<strong className="font-mono text-slate-800">{processoId}</strong>) não consta na base ativa ou seu perfil atual (<strong className="text-blue-800">{user.role} - {user.unidade_sigla}</strong>) não possui permissão de acesso RLS.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/processos"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition shadow-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ver Lista de Processos Autorizados</span>
            </Link>
            <Link
              href="/"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs transition"
            >
              <span>Voltar ao Painel Executivo</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const semaforo = getSemaforoInercia(processo.dias_parado_na_unidade);

  return (
    <div className="space-y-5">
      {/* Trilha de Navegação (Breadcrumb) */}
      <Breadcrumb
        items={[
          { label: 'Processos Monitorados', href: '/processos' },
          { label: processo.protocolo_sei, isCurrent: true }
        ]}
      />

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
              <span 
                title="Número de autuação oficial no Sistema Eletrônico de Informações (SEI-MA)"
                className="text-base font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200"
              >
                {processo.protocolo_sei}
              </span>
              {processo.tem_novidade_hoje && (
                <span 
                  title="Processo teve nova movimentação ou despacho registrado nas últimas 24 horas"
                  className="text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse"
                >
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Movimentado Hoje
                </span>
              )}
              {processo.protocolo_startgov ? (
                <span 
                  title="Protocolo oficial de licitação / compra eletrônica no sistema StartGov"
                  className="text-sm font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1"
                >
                  <span>StartGov: {processo.protocolo_startgov}</span>
                  <ExternalLink className="w-3 h-3 text-emerald-600" />
                </span>
              ) : (
                <span 
                  title="Processo ainda não foi vinculado a nenhum certame no StartGov"
                  className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded"
                >
                  Sem vínculo StartGov
                </span>
              )}
              {processo.numero_contrato_pncp && (
                <span 
                  title="Identificador oficial do contrato no Portal Nacional de Contratações Públicas (Lei 14.133/2021)"
                  className="text-xs font-mono bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200"
                >
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
            <div 
              title={`Permanência líquida na unidade atual: ${processo.dias_parado_na_unidade} dias úteis (Meta SLA da SEDUC: máx 5 dias úteis)`}
              className={`rounded-lg p-3 text-center border ${semaforo.bgClass}`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${semaforo.dotClass}`}></span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-600">
                  Tempo Parado
                </span>
              </div>
              <span className={`text-xl font-bold ${semaforo.textClass}`}>
                {processo.dias_parado_na_unidade} {processo.dias_parado_na_unidade === 1 ? 'dia' : 'dias'}
              </span>
              <span className="text-[9px] block text-slate-500 mt-0.5">
                {semaforo.label}
              </span>
            </div>

            <div 
              title={`Lotação atual do processo na estrutura organizacional da SEDUC: ${processo.unidade_atual_sei}`}
              className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center min-w-[120px]"
            >
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
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                <span>Próximo Passo Esperado</span>
                <InfoTooltip content="Ação operacional prioritária recomendada pela inteligência de fluxo processual da SEDUC para acelerar a tramitação." />
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
              {isSlaEstourado(processo.dias_parado_na_unidade) && ' Cobrança de despacho recomendada devido à inércia.'}
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

      {/* Notas Internas de Acompanhamento (RF15 - Conforme LAI com Persistência) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Notas Internas de Acompanhamento Setorial (RF15)
            </h2>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
            {notas.length} notas registradas
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

        {/* Lista de Notas Persistidas */}
        <div className="space-y-3">
          {notas.map((n) => (
            <div key={n.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-bold text-slate-800">{n.autor}</span>
                <span className="font-mono text-[11px]">{n.data}</span>
              </div>
              <p className="text-slate-800 font-medium leading-relaxed">{n.conteudo}</p>
            </div>
          ))}
        </div>

        {/* Formulário de Nova Nota */}
        <form onSubmit={handleAddNota} className="flex gap-2 pt-2">
          <input
            type="text"
            value={novaNota}
            onChange={(e) => setNovaNota(e.target.value)}
            placeholder={`Adicionar nota como ${user.nome} (ex: agendada reunião com fornecedor)...`}
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
