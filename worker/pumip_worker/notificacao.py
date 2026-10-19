"""
PUMIP-SEDUC: Envio Seguro de Notificações Transacionais
Conforme Seção 6.1 e 10.1 do Relatório de Auditoria Técnica (@Cpacesso).
"""

import html
from typing import Any, Optional

try:
    import httpx
except ImportError:
    httpx = None

from pumip_worker.config import config
from pumip_worker.log import logger, mascarar_email
from pumip_worker.modelos import EventoFonte, Processo


def disparar_notificacao_email(
    destinatario_email: str,
    destinatario_nome: str,
    processo: Processo,
    evento: Optional[EventoFonte] = None,
    titulo_alerta: str = "Novo Andamento Detectado",
    client: Optional[Any] = None
) -> bool:
    """
    Envia notificação transacional via Resend API com sanitização HTML completa
    e mascaramento de dados pessoais nos logs.
    """
    email_mascarado = mascarar_email(destinatario_email)
    logger.info(f"Disparando notificação de alerta para destinatário: {email_mascarado}")

    if not config.resend_api_key:
        logger.info(
            f"RESEND_API_KEY não configurada. Notificação para {email_mascarado} simulada."
        )
        return True

    # Sanitização estrita contra injeção de HTML / XSS em e-mails
    nome_escapado = html.escape(destinatario_nome)
    protocolo_escapado = html.escape(processo.protocolo_sei)
    objeto_escapado = html.escape(processo.objeto[:180])
    texto_andamento = evento.descricao_andamento if evento else "Inércia ou alteração contratual"
    andamento_escapado = html.escape(texto_andamento)

    html_content = (
        '<div style="font-family: Arial, sans-serif; max-width: 600px; '
        'margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">'
        '<h2 style="color: #1e3a8a;">PUMIP-SEDUC &bull; Notificação de Processo</h2>'
        f'<p>Prezado(a) <strong>{nome_escapado}</strong>,</p>'
        '<p>Houve uma nova atualização de interesse para o processo sob seu monitoramento:</p>'
        '<ul>'
        f'<li><strong>Protocolo SEI:</strong> {protocolo_escapado}</li>'
        f'<li><strong>Objeto:</strong> {objeto_escapado}</li>'
        f'<li><strong>Andamento:</strong> {andamento_escapado}</li>'
        '</ul>'
        '<p style="font-size: 11px; color: #64748b;">'
        'Secretaria de Estado da Educação do Maranhão (SEDUC-MA) &bull; Monitoramento Automatizado'
        '</p>'
        '</div>'
    )

    try:
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {config.resend_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "from": config.remetente_email,
            "to": [destinatario_email],
            "subject": f"[PUMIP-SEDUC] {titulo_alerta} - {processo.protocolo_sei}",
            "html": html_content
        }

        if client:
            resp = client.post(url, json=payload, headers=headers)
        else:
            if httpx is None:
                logger.warning("httpx não instalado para envio de e-mails.")
                return False
            with httpx.Client(timeout=10.0) as cli:
                resp = cli.post(url, json=payload, headers=headers)

        if resp.status_code in (200, 201):
            logger.info(f"E-mail enviado com sucesso para {email_mascarado}")
            return True
        else:
            logger.warning(f"Falha no envio de e-mail ({resp.status_code}): {resp.text[:120]}")
            return False
    except Exception as e:
        logger.error(f"Erro ao conectar com API de e-mail para {email_mascarado}: {e}")
        return False
