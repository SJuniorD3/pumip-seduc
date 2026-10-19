import { NextResponse, type NextRequest } from 'next/server';
import { criarClienteServidor } from '../../../lib/supabase/server';
import { isSupabaseConfigured } from '../../../lib/supabase';
import { obterPerfil } from '../../../lib/auth/perfil';

/**
 * PUMIP-SEDUC: API de Sincronização Manual com o Worker (RF08 / OPS-02)
 * Aciona o worker agendando verificação imediata (prioridade QUENTE e proxima_verificacao = now).
 * Aplica trava anti-sobrecarga (cooldown de 15 minutos) e autorização RLS via usuario_pode_ver_processo.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { processoId } = body;

    if (!processoId || typeof processoId !== 'string') {
      return NextResponse.json(
        { error: 'ID do processo é obrigatório' },
        { status: 400 }
      );
    }

    // REMEDIAÇÃO N-04: Autenticação obrigatória com obterPerfil()
    const user = await obterPerfil();
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado. Sessão necessária para acionar sincronização.' },
        { status: 401 }
      );
    }

    if (!isSupabaseConfigured()) {
      // Modo demonstração: simula agendamento com sucesso
      return NextResponse.json({
        sucesso: true,
        modo: 'demo',
        mensagem: 'Sincronização solicitada em modo demonstração.',
        proxima_verificacao: new Date().toISOString()
      });
    }

    const supabase = criarClienteServidor();

    // REMEDIAÇÃO N-04: Validação de autorização com RPC usuario_pode_ver_processo
    if (user.id) {
      const { data: podeVer, error: permError } = await supabase.rpc('usuario_pode_ver_processo', {
        p_usuario: user.id,
        p_processo: processoId
      });

      if (permError || !podeVer) {
        return NextResponse.json(
          { error: 'Acesso negado: você não possui permissão para visualizar ou sincronizar este processo.' },
          { status: 403 }
        );
      }
    }

    // Consulta estado atual do processo e última verificação
    const { data: processo, error: findError } = await supabase
      .from('processos')
      .select('id, protocolo_sei, ultima_verificacao_em')
      .eq('id', processoId)
      .single();

    if (findError || !processo) {
      return NextResponse.json(
        { error: 'Processo não localizado no banco institucional.' },
        { status: 404 }
      );
    }

    // Valida cooldown de 15 minutos (900 segundos) contra sobrecarga dos portais
    if (processo.ultima_verificacao_em) {
      const ultimoTimestamp = new Date(processo.ultima_verificacao_em).getTime();
      const segundosPassados = (Date.now() - ultimoTimestamp) / 1000;
      const limiteCooldown = 15 * 60;

      if (segundosPassados < limiteCooldown) {
        const restanteSegundos = Math.ceil(limiteCooldown - segundosPassados);
        return NextResponse.json(
          {
            error: `Limite de requisições ativo. Aguarde ${Math.ceil(restanteSegundos / 60)} minuto(s) para nova consulta na fonte.`,
            cooldownRestante: restanteSegundos
          },
          { status: 429 }
        );
      }
    }

    // Atualiza o processo colocando-o no topo imediato da fila do worker Python
    const agoraIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('processos')
      .update({
        proxima_verificacao_em: agoraIso,
        prioridade: 'QUENTE',
        updated_at: agoraIso
      })
      .eq('id', processoId);

    if (updateError) {
      return NextResponse.json(
        { error: `Falha ao agendar sincronização: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      protocolo_sei: processo.protocolo_sei,
      prioridade: 'QUENTE',
      agendado_em: agoraIso,
      mensagem: 'Processo agendado com sucesso para coleta prioritária pelo worker.'
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Erro interno no servidor de sincronização.' },
      { status: 500 }
    );
  }
}
