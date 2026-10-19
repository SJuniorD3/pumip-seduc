'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Clock } from 'lucide-react';

interface SyncButtonProps {
  processoId: string;
  ultimaVerificacao?: string | null;
  onSyncSuccess?: () => void;
}

export const SyncButton: React.FC<SyncButtonProps> = ({
  processoId,
  ultimaVerificacao,
  onSyncSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (!ultimaVerificacao) {
      setCooldownSeconds(0);
      return;
    }

    const last = new Date(ultimaVerificacao).getTime();
    const now = Date.now();
    const diffSeconds = Math.floor((now - last) / 1000);
    const cooldownTotal = 15 * 60; // 15 minutos de trava anti-sobrecarga (RF08)

    if (diffSeconds < cooldownTotal) {
      setCooldownSeconds(cooldownTotal - diffSeconds);
    } else {
      setCooldownSeconds(0);
    }
  }, [ultimaVerificacao]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleSync = async () => {
    if (cooldownSeconds > 0 || loading) return;

    setLoading(true);
    setSuccessMsg(false);

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processoId })
      });

      const data = await res.json();

      if (res.ok && data.sucesso) {
        setCooldownSeconds(15 * 60);
        setSuccessMsg(true);
        if (onSyncSuccess) onSyncSuccess();
        setTimeout(() => setSuccessMsg(false), 4000);
      } else if (res.status === 429 && data.cooldownRestante) {
        setCooldownSeconds(data.cooldownRestante);
      } else {
        console.warn('Resposta da sincronização:', data.error);
      }
    } catch (err) {
      console.error('Erro na sincronização manual:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCooldown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={cooldownSeconds > 0 || loading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
          cooldownSeconds > 0
            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            : loading
            ? 'bg-blue-100 text-blue-700 border border-blue-200 cursor-wait'
            : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
        }`}
        title={
          cooldownSeconds > 0
            ? `Limite de segurança: aguarde ${formatCooldown(cooldownSeconds)} para nova consulta na fonte.`
            : 'Consultar andamento imediato no SEI e StartGov'
        }
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        <span>
          {loading
            ? 'Consultando fontes...'
            : cooldownSeconds > 0
            ? `Cooldown (${formatCooldown(cooldownSeconds)})`
            : 'Sincronizar Agora'}
        </span>
      </button>

      {successMsg && (
        <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold animate-fade-in">
          <CheckCircle className="w-3.5 h-3.5" />
          Sincronizado!
        </span>
      )}
    </div>
  );
};
