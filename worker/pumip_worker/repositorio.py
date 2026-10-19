"""
PUMIP-SEDUC: Camada de Persistência e Acesso ao Banco (Repositório)
Conforme Seção 6.1 e 10.2 do Relatório de Auditoria Técnica (@Cpacesso).
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
try:
    from supabase import create_client, Client
except ImportError:
    create_client = None
    Client = None

from pumip_worker.config import config
from pumip_worker.log import logger
from pumip_worker.modelos import Processo, EventoFonte


class WorkerRepositorio:
    def __init__(self, supabase_client: Optional[Any] = None) -> None:
        if supabase_client:
            self.supabase = supabase_client
        elif create_client is not None:
            self.supabase = create_client(config.supabase_url, config.supabase_service_role_key)
        else:
            self.supabase = None

    def obter_processos_candidatos(self, limite: int = 50) -> List[Processo]:
        """Obtém processos da fila prioritária para sincronização periódica."""
        try:
            agora_iso = datetime.now(timezone.utc).isoformat()
            res = (
                self.supabase.table("processos_com_inercia")
                .select("*")
                .lte("proxima_verificacao_em", agora_iso)
                .order("prioridade", desc=False)
                .limit(limite)
                .execute()
            )

            candidatos = res.data or []
            return [
                Processo(
                    id=p["id"],
                    protocolo_sei=p.get("protocolo_sei", ""),
                    protocolo_startgov=p.get("protocolo_startgov"),
                    numero_contrato_pncp=p.get("numero_contrato_pncp"),
                    objeto=p.get("objeto", ""),
                    unidade_origem_id=p.get("unidade_origem_id", ""),
                    unidade_atual_sei=p.get("unidade_atual_sei", "NÃO INFORMADO"),
                    status_etapa=p.get("status_etapa", "FASE_INTERNA_SEI"),
                    prioridade=p.get("prioridade", "QUENTE"),
                    dias_parado_na_unidade=p.get("dias_parado_na_unidade", 0),
                    dias_uteis_parado=p.get("dias_uteis_parado", 0),
                    hash_ultimo_estado=p.get("hash_ultimo_estado"),
                    ultima_movimentacao_em=p.get("ultima_movimentacao_em", agora_iso)
                )
                for p in candidatos
            ]
        except Exception as e:
            logger.warning(f"Erro ao consultar processos candidatos: {e}")
            return []

    def registrar_andamento_rpc(
        self,
        processo_id: str,
        evento: EventoFonte,
        nova_unidade_sei: Optional[str] = None,
        proxima_verificacao: Optional[str] = None
    ) -> bool:
        """
        Executa a gravação atômica via função registrar_andamento_sincronizacao (Migração 003).
        Retorna True somente se um novo andamento inédito foi inserido no histórico.
        """
        try:
            rpc_params = {
                "p_processo_id": processo_id,
                "p_origem": evento.origem,
                "p_data_hora_evento": evento.data_hora_evento,
                "p_unidade_setor": evento.unidade_setor,
                "p_descricao_andamento": evento.descricao_andamento,
                "p_documento_anexado": evento.documento_anexado,
                "p_tipo_documento": evento.tipo_documento,
                "p_resumo_ia": evento.resumo_ia,
                "p_hash_evento": evento.hash_evento,
                "p_metadados": evento.metadados,
                "p_nova_unidade_sei": nova_unidade_sei,
                "p_proxima_verificacao": proxima_verificacao or datetime.now(timezone.utc).isoformat()
            }

            res = self.supabase.rpc("registrar_andamento_sincronizacao", rpc_params).execute()
            return res.data is True
        except Exception as e:
            logger.error(f"Erro na execução da RPC de sincronização: {e}")
            return False

    def usuario_pode_ver_processo(self, usuario_id: str, processo_id: str) -> bool:
        """Invoca a função unificada usuario_pode_ver_processo (Migração 004)."""
        try:
            res = self.supabase.rpc(
                "usuario_pode_ver_processo",
                {"p_usuario": usuario_id, "p_processo": processo_id}
            ).execute()
            return res.data is True
        except Exception as e:
            logger.warning(f"Erro ao verificar visibilidade de processo: {e}. Permitindo por contingência.")
            return True

    def listar_regras_alertas(self, processo_id: str, unidade_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Consulta regras ativas na tabela alertas_configurados para o escopo do processo."""
        try:
            query = self.supabase.table("alertas_configurados").select(
                "*, usuario:perfis_usuarios(id, nome, email)"
            ).eq("ativo", True)

            res = query.execute()
            regras = res.data or []

            # Filtra estritamente pelo escopo
            return [
                r for r in regras
                if (r.get("processo_id") == processo_id or
                    (unidade_id and r.get("unidade_id") == unidade_id) or
                    (not r.get("processo_id") and not r.get("unidade_id")))
            ]
        except Exception as e:
            logger.warning(f"Erro ao consultar regras de alerta: {e}")
            return []

    def registrar_execucao_rodada(self, resumo: Dict[str, Any]) -> bool:
        """Persiste telemetria da rodada de sincronização na tabela execucoes_coleta (Migração 006)."""
        if not self.supabase:
            return False
        try:
            payload = {
                "execution_id": resumo.get("execucao_id"),
                "iniciada_em": resumo.get("iniciada_em"),
                "concluida_em": resumo.get("concluida_em"),
                "duracao_ms": resumo.get("duracao_ms", 0),
                "processos_analisados": resumo.get("processos_analisados", 0),
                "novos_andamentos": resumo.get("novos_andamentos", 0),
                "status": resumo.get("status", "SUCESSO"),
                "detalhes_fontes": {
                    "sucessos": resumo.get("sucessos_por_fonte", {}),
                    "falhas": resumo.get("falhas_por_fonte", {})
                }
            }
            self.supabase.table("execucoes_coleta").insert(payload).execute()
            return True
        except Exception as e:
            logger.warning(f"Erro ao persistir telemetria em execucoes_coleta: {e}")
            return False
