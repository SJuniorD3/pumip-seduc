'use client';

import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/Breadcrumb';
import { useAuth } from '../../lib/authContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { 
  listarAlertasBanco, 
  criarAlertaBanco, 
  alternarStatusAlertaBanco, 
  removerAlertaBanco 
} from '../../lib/dados/alertas';
import { 
  BellRing, 
  Plus, 
  Mail, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  Trash2, 
  AlertTriangle,
  Zap,
  Repeat,
  Compass,
  Check
} from 'lucide-react';
import { Abbr, InfoTooltip } from '../../components/Tooltip';

interface AlertaItem {
  id: string;
  tipo: string;
  descricao: string;
  processo: string;
  viaEmail: boolean;
  ativo: boolean;
}

export default function AlertasPage() {
  const { user } = useAuth();
  const [alertas, setAlertas] = useState<AlertaItem[]>([
    {
      id: 'alt-1',
      tipo: 'INÉRCIA / SLA (RF05)',
      descricao: 'Processo parado na mesma unidade por mais de 5 dias úteis sem andamento',
      processo: 'SEI-021001/007812/2026 (Nuvem Governamental)',
      viaEmail: true,
      ativo: true
    },
    {
      id: 'alt-2',
      tipo: 'PALAVRA-CHAVE (RF06)',
      descricao: 'Gatilho ao anexar documentos contendo: "Parecer Jurídico" ou "Nota de Empenho"',
      processo: 'SEI-021001/004521/2026 (Switches Escolares)',
      viaEmail: true,
      ativo: true
    },
    {
      id: 'alt-3',
      tipo: 'PUBLICIDADE PNCP (RF12)',
      descricao: 'Alerta de prazo do Art. 94 da Lei 14.133/2021 (20 dias úteis para publicação após assinatura)',
      processo: 'Todos os processos da SUPTI',
      viaEmail: true,
      ativo: true
    }
  ]);

  const [tipoSelecionado, setTipoSelecionado] = useState('INERCIA_SLA');
  const [processoAlvo, setProcessoAlvo] = useState('SEI-021001/004521/2026');
  const [parametroValor, setParametroValor] = useState('5');
  const [notificarEmail, setNotificarEmail] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState(false);

  // Sincronização com o Supabase quando configurado
  useEffect(() => {
    if (isSupabaseConfigured() && user?.id) {
      listarAlertasBanco(user.id)
        .then((bancoAlertas) => {
          if (bancoAlertas.length > 0) {
            setAlertas(
              bancoAlertas.map((b) => ({
                id: b.id,
                tipo: b.tipo === 'INERCIA_DIAS' ? 'INÉRCIA / SLA (RF05)' : b.tipo === 'PALAVRA_CHAVE' ? 'PALAVRA-CHAVE (RF06)' : b.tipo,
                descricao: b.descricao_legivel || 'Alerta automático',
                processo: b.processo_protocolo || 'Geral',
                viaEmail: b.notificar_email,
                ativo: b.ativo
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [user?.id]);

  const handleCriarAlerta = async (e: React.FormEvent) => {
    e.preventDefault();

    const tipoEnum = tipoSelecionado === 'INERCIA_SLA' ? 'INERCIA_DIAS' : 'PALAVRA_CHAVE';
    const params = tipoSelecionado === 'INERCIA_SLA' 
      ? { dias: parseInt(parametroValor, 10) || 5 }
      : { palavras_chave: parametroValor };

    const desc = tipoSelecionado === 'INERCIA_SLA'
      ? `Alerta se parado por mais de ${parametroValor} dias úteis`
      : `Gatilho monitorando: "${parametroValor}"`;

    let novoId = `alt-${Date.now()}`;

    if (isSupabaseConfigured() && user?.id && user.id.length === 36) {
      const criado = await criarAlertaBanco({
        usuario_id: user.id,
        tipo: tipoEnum,
        parametros: params,
        notificar_email: notificarEmail,
        notificar_sistema: true
      });
      if (criado) {
        novoId = criado.id;
      }
    }

    const novo: AlertaItem = {
      id: novoId,
      tipo: tipoSelecionado === 'INERCIA_SLA' ? 'INÉRCIA / SLA (RF05)' : 'PALAVRA-CHAVE (RF06)',
      descricao: desc,
      processo: processoAlvo,
      viaEmail: notificarEmail,
      ativo: true
    };

    setAlertas([novo, ...alertas]);
    setFeedbackMsg(true);
    setTimeout(() => setFeedbackMsg(false), 3000);
  };

  const handleToggle = (id: string) => {
    const alertaAtual = alertas.find((a) => a.id === id);
    if (!alertaAtual) return;
    const novoStatus = !alertaAtual.ativo;

    if (isSupabaseConfigured() && id.length === 36) {
      alternarStatusAlertaBanco(id, novoStatus).catch(() => {});
    }

    setAlertas(
      alertas.map((a) => (a.id === id ? { ...a, ativo: novoStatus } : a))
    );
  };

  const handleRemove = (id: string) => {
    if (isSupabaseConfigured() && id.length === 36) {
      removerAlertaBanco(id).catch(() => {});
    }
    setAlertas(alertas.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Trilha de Navegação */}
      <Breadcrumb
        items={[
          { label: 'Central de Alertas e Notificações', isCurrent: true }
        ]}
      />

      {/* Cabeçalho */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <BellRing className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Central de Alertas e Notificações Inteligentes</span>
            <InfoTooltip content="Sistema de vigilância contínua que cruza dados do SEI, StartGov e PNCP para notificar gestores sobre inércia, diligências jurídicas e prazos legais." />
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Monitoramento em tempo real com disparo de notificações por e-mail (Resend API) para eventos críticos, 
          inércia processual e prazos legais da Lei nº 14.133/2021.
        </p>
      </div>

      {/* Seção de Gatilhos Inteligentes Pré-definidos (Zero-Configuração) */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold flex items-center gap-2">
              <span>Gatilhos Automáticos do Sistema (Zero-Configuração Ativos)</span>
              <InfoTooltip content="Motores de vigilância pré-configurados que operam 24/7 sem requerer nenhuma intervenção técnica ou cadastro manual." />
            </h2>
          </div>
          <span 
            title="Motores de vigilância autônomos em execução contínua"
            className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 self-start sm:self-auto cursor-help"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Proteção Ativa 24/7
          </span>
        </div>

        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          O PUMIP-SEDUC já vem equipado com 3 motores inteligentes de vigilância processual que operam 
          automaticamente sem necessidade de nenhuma configuração manual:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Card 1 */}
          <div 
            title="Gatilho 1: Aciona semáforo vermelho quando o tempo útil de permanência na mesma unidade atinge ou supera 7 dias"
            className="bg-white/10 hover:bg-white/15 p-4 rounded-xl border border-white/10 backdrop-blur-sm transition space-y-2 cursor-help"
          >
            <div className="flex items-center justify-between">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse"></span>
              <span className="text-[10px] bg-emerald-400/20 text-emerald-200 px-2 py-0.2 rounded font-bold">
                Ativo
              </span>
            </div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Gargalo Crítico (&ge; 7 dias úteis)</span>
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Detecta processos sem nenhuma movimentação há mais de 7 dias úteis em qualquer setor, acionando o semáforo vermelho pulsante.
            </p>
          </div>

          {/* Card 2 */}
          <div 
            title="Gatilho 2: Notifica os operadores imediatamente ao identificar retorno dos autos com diligência ou pendência de saneamento"
            className="bg-white/10 hover:bg-white/15 p-4 rounded-xl border border-white/10 backdrop-blur-sm transition space-y-2 cursor-help"
          >
            <div className="flex items-center justify-between">
              <Repeat className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] bg-emerald-400/20 text-emerald-200 px-2 py-0.2 rounded font-bold">
                Ativo
              </span>
            </div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Retorno de Diligência (<Abbr sigla="ASJUR" /> / <Abbr sigla="CSL" />)</span>
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Alerta imediato quando um processo retorna da Assessoria Jurídica ou Comissões solicitando saneamento ou adequação documental.
            </p>
          </div>

          {/* Card 3 */}
          <div 
            title="Gatilho 3: Monitora o avanço dos processos em tempo real e consolida o feed de novidades da pasta"
            className="bg-white/10 hover:bg-white/15 p-4 rounded-xl border border-white/10 backdrop-blur-sm transition space-y-2 cursor-help"
          >
            <div className="flex items-center justify-between">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] bg-emerald-400/20 text-emerald-200 px-2 py-0.2 rounded font-bold">
                Ativo
              </span>
            </div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Saída e Despacho Recente</span>
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Registra no Feed de Novidades das 24h e notifica os interessados sempre que um processo avança para a próxima etapa na cadeia.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Criação de Regra Personalizada */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Criar Regra Personalizada</span>
          </h2>

          <form onSubmit={handleCriarAlerta} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Tipo de Gatilho:
              </label>
              <select
                value={tipoSelecionado}
                onChange={(e) => setTipoSelecionado(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="INERCIA_SLA">Inércia / SLA (Dias sem movimentação)</option>
                <option value="PALAVRA_CHAVE">Palavra-chave em documento/andamento</option>
                <option value="MUDANCA_SETOR">Mudança de Unidade / Setor</option>
                <option value="PUBLICACAO_PNCP">Publicação Obrigatória no PNCP (Art. 94)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Processo Alvo:
              </label>
              <select
                value={processoAlvo}
                onChange={(e) => setProcessoAlvo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              >
                <option value="SEI-021001/004521/2026">SEI-021001/004521/2026 (Switches)</option>
                <option value="SEI-021001/007812/2026">SEI-021001/007812/2026 (Nuvem)</option>
                <option value="SEI-021001/001190/2026">SEI-021001/001190/2026 (Dignas)</option>
                <option value="TODOS_DA_UNIDADE">Todos da minha Superintendência</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {tipoSelecionado === 'INERCIA_SLA'
                  ? 'Dias Limite (SLA):'
                  : 'Termos a Monitorar:'}
              </label>
              <input
                type="text"
                value={parametroValor}
                onChange={(e) => setParametroValor(e.target.value)}
                placeholder={
                  tipoSelecionado === 'INERCIA_SLA'
                    ? 'Ex: 5'
                    : 'Ex: Parecer, Empenho, Homologação'
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificarEmail}
                  onChange={(e) => setNotificarEmail(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold">Disparar notificação por e-mail</span>
              </label>
              <p className="text-[10px] text-slate-400 mt-0.5 ml-5">
                Enviado para seu e-mail funcional cadastrado na SEDUC.
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg transition shadow-sm"
            >
              Ativar Regra de Alerta
            </button>

            {feedbackMsg && (
              <p className="text-center text-emerald-600 font-semibold text-xs animate-fade-in flex items-center justify-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Alerta cadastrado com sucesso!
              </p>
            )}
          </form>
        </div>

        {/* Lista de Alertas Ativos */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Regras Personalizadas ({alertas.length})</span>
            <span className="text-xs font-normal text-slate-500">
              Resumo Diário consolidado às 08:00 (RF07)
            </span>
          </h2>

          <div className="space-y-3">
            {alertas.map((alt) => (
              <div
                key={alt.id}
                className={`bg-white rounded-xl p-4 border transition ${
                  alt.ativo ? 'border-slate-200 shadow-sm' : 'border-slate-200/60 bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                        {alt.tipo}
                      </span>
                      {alt.viaEmail && (
                        <span className="text-[10px] font-medium text-slate-600 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                          <Mail className="w-3 h-3 text-slate-500" />
                          E-mail Ativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-900">
                      {alt.descricao}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      Alvo: {alt.processo}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(alt.id)}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
                        alt.ativo
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {alt.ativo ? 'Ativo' : 'Pausado'}
                    </button>
                    <button
                      onClick={() => handleRemove(alt.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                      title="Excluir alerta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
