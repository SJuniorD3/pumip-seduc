import { NextResponse } from 'next/server';
import { criarClienteServidor } from '../../../lib/supabase/server';
import { isSupabaseConfigured } from '../../../lib/supabase';
import { getAppMode } from '../../../lib/appMode';

/**
 * PUMIP-SEDUC: Rota Oficial de Diagnóstico e Saúde da Aplicação (/api/saude)
 * Conforme Requisito de Observabilidade e SRE (Etapa 8 - @Cpacesso, N-04 e N-09).
 * Consulta telemetria real do banco (tabela execucoes_coleta e visão status_integracoes).
 */
export async function GET() {
  const inicio = performance.now();
  const modo = getAppMode();

  let statusBanco = 'nao_configurado';
  let latenciaBancoMs = 0;
  let totalProcessos = 0;
  let filaPrioritaria = 0;
  let servicoSaudavel = true;
  let telemetriaWorker: any = {
    ultima_execucao: null,
    conectores: {
      SEI: { status: 'aguardando_credenciais_ati' },
      StartGov: { status: 'aguardando_credenciais_ati' },
      PNCP: { status: 'aguardando_execucao' },
    }
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = criarClienteServidor();
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

        // REMEDIAÇÃO N-09: Consulta telemetria real de coleta
        const { data: ultimasExecucoes } = await supabase
          .from('execucoes_coleta')
          .select('id, iniciada_em, concluida_em, duracao_ms, status, processos_analisados, novos_andamentos, sucessos_por_fonte, falhas_por_fonte')
          .order('iniciada_em', { ascending: false })
          .limit(1);

        if (ultimasExecucoes && ultimasExecucoes.length > 0) {
          const ultima = ultimasExecucoes[0];
          telemetriaWorker.ultima_execucao = {
            id: ultima.id,
            iniciada_em: ultima.iniciada_em,
            concluida_em: ultima.concluida_em,
            duracao_ms: ultima.duracao_ms,
            status: ultima.status,
            processos_analisados: ultima.processos_analisados,
            novos_andamentos: ultima.novos_andamentos,
          };

          const sucessos = (ultima.sucessos_por_fonte as Record<string, number>) || {};
          const falhas = (ultima.falhas_por_fonte as Record<string, number>) || {};

          for (const fonte of ['PNCP', 'SEI', 'StartGov']) {
            if ((sucessos[fonte] || 0) > 0) {
              telemetriaWorker.conectores[fonte] = { status: 'ativo', sucessos: sucessos[fonte] };
            } else if ((falhas[fonte] || 0) > 0) {
              telemetriaWorker.conectores[fonte] = { status: 'com_falhas', falhas: falhas[fonte] };
            } else {
              telemetriaWorker.conectores[fonte] = { status: fonte === 'PNCP' ? 'sem_andamentos_novos' : 'aguardando_credenciais_ati' };
            }
          }
        }
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
    telemetria_worker: telemetriaWorker,
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
