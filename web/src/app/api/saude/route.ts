import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { getAppMode } from '../../../lib/appMode';

/**
 * PUMIP-SEDUC: Rota Oficial de Diagnóstico e Saúde da Aplicação (/api/saude)
 * Conforme Requisito de Observabilidade e SRE (Etapa 8 - @Cpacesso).
 */
export async function GET() {
  const inicio = performance.now();
  const modo = getAppMode();

  let statusBanco = 'nao_configurado';
  let latenciaBancoMs = 0;
  let totalProcessos = 0;
  let filaPrioritaria = 0;
  let servicoSaudavel = true;

  if (isSupabaseConfigured()) {
    try {
      const t0 = performance.now();
      const { data, error, count } = await supabase
        .from('processos')
        .select('id, prioridade', { count: 'exact', head: false })
        .limit(10);

      latenciaBancoMs = Math.round(performance.now() - t0);

      if (error) {
        statusBanco = `erro: ${error.message}`;
        servicoSaudavel = false;
      } else {
        statusBanco = 'conectado';
        totalProcessos = count || (data?.length ?? 0);
        filaPrioritaria = data?.filter((p) => p.prioridade === 'QUENTE').length ?? 0;
      }
    } catch (err: unknown) {
      statusBanco = 'erro_conexao';
      servicoSaudavel = false;
    }
  } else {
    statusBanco = 'modo_demo';
  }

  const duracaoTotalMs = Math.round(performance.now() - inicio);

  const payload = {
    status: servicoSaudavel ? 'ok' : 'degraded',
    versao: '2.0.0',
    timestamp: new Date().toISOString(),
    ambiente: {
      modo,
      node_version: process.version,
      uptime_segundos: Math.round(process.uptime()),
      memoria_heap_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
    banco_dados: {
      status: statusBanco,
      latencia_ms: latenciaBancoMs,
      total_processos: totalProcessos,
      fila_prioritaria: filaPrioritaria,
    },
    conectores_worker: {
      sei_ws: { status: 'aguardando_credenciais_ati', circuit_breaker: 'fechado' },
      startgov_api: { status: 'aguardando_credenciais_ati', circuit_breaker: 'fechado' },
      pncp_publico: { status: 'ativo', circuit_breaker: 'fechado' },
    },
    latencia_total_ms: duracaoTotalMs,
  };

  return NextResponse.json(payload, {
    status: servicoSaudavel ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
