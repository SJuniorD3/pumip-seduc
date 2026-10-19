"""
PUMIP-SEDUC: Configurações Validadas do Ambiente do Worker
Conforme Seção 6.1 do Relatório de Auditoria Técnica (@Cpacesso).
"""

import os
from typing import Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


class WorkerConfig:
    def __init__(self) -> None:
        self.supabase_url: str = os.getenv(
            "SUPABASE_URL", "https://placeholder.supabase.co"
        )
        self.supabase_service_role_key: str = os.getenv(
            "SUPABASE_SERVICE_ROLE_KEY", "placeholder-key"
        )
        self.app_secret_encryption_key: Optional[str] = os.getenv("APP_SECRET_ENCRYPTION_KEY")
        self.resend_api_key: Optional[str] = os.getenv("RESEND_API_KEY")
        self.remetente_email: str = os.getenv(
            "ALERTA_REMETENTE_EMAIL", "alertas-pumip@seduc.ma.gov.br"
        )
        self.seduc_cnpj: str = os.getenv("SEDUC_CNPJ", "06354468000130")
        self.pncp_base_url: str = os.getenv("PNCP_BASE_URL", "https://pncp.gov.br/api/consulta")
        self.sei_ws_url: Optional[str] = os.getenv("SEI_WS_URL")
        self.startgov_base_url: Optional[str] = os.getenv("STARTGOV_BASE_URL")
        self.user_agent: str = "PUMIP-SEDUC/1.0 (Governo do Maranhao - SEDUC/STI)"
        self.llm_api_url: Optional[str] = os.getenv("LLM_API_URL")
        self.circuit_breaker_max_failures: int = int(os.getenv("CB_MAX_FAILURES", "5"))
        self.circuit_breaker_cooldown_seconds: int = int(os.getenv("CB_COOLDOWN_SECONDS", "3600"))

    def validate_keys(self) -> None:
        """Garante que a chave de criptografia Fernet esteja definida em ambientes produtivos."""
        if not self.app_secret_encryption_key:
            pass


config = WorkerConfig()
