'use client';

import React, { useState } from 'react';
import { 
  BellRing, 
  Plus, 
  Mail, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';

interface AlertaItem {
  id: string;
  tipo: string;
  descricao: string;
  processo: string;
  viaEmail: boolean;
  ativo: boolean;
}

export default function AlertasPage() {
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

  const handleCriarAlerta = (e: React.FormEvent) => {
    e.preventDefault();
    const novo: AlertaItem = {
      id: `alt-${Date.now()}`,
      tipo: tipoSelecionado === 'INERCIA_SLA' ? 'INÉRCIA / SLA (RF05)' : 'PALAVRA-CHAVE (RF06)',
      descricao:
        tipoSelecionado === 'INERCIA_SLA'
          ? `Alerta se parado por mais de ${parametroValor} dias úteis`
          : `Gatilho monitorando: "${parametroValor}"`,
      processo: processoAlvo,
      viaEmail: notificarEmail,
      ativo: true
    };
    setAlertas([novo, ...alertas]);
    setFeedbackMsg(true);
    setTimeout(() => setFeedbackMsg(false), 3000);
  };

  const handleToggle = (id: string) => {
    setAlertas(
      alertas.map((a) => (a.id === id ? { ...a, ativo: !a.ativo } : a))
    );
  };

  const handleRemove = (id: string) => {
    setAlertas(alertas.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <BellRing className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-900">
            Central de Alertas e Gatilhos Transacionais
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Configure gatilhos automatizados para receber e-mails via Resend API quando ocorrerem eventos críticos, 
          estouro de prazos da Lei 14.133/2021 ou inércia de tramitação.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Criação de Regra */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Nova Regra de Alerta</span>
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
            <span>Regras Cadastradas na sua Carteira ({alertas.length})</span>
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
