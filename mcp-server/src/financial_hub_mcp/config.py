from dataclasses import dataclass
import os


@dataclass(frozen=True)
class DatabaseSettings:
    host: str
    port: int
    name: str
    user: str
    password: str
    sslmode: str

    @property
    def dsn(self) -> str:
        return (
            f"host={self.host} "
            f"port={self.port} "
            f"dbname={self.name} "
            f"user={self.user} "
            f"password={self.password} "
            f"sslmode={self.sslmode}"
        )


def load_database_settings() -> DatabaseSettings:
    return DatabaseSettings(
        host=os.getenv("MCP_DB_HOST", "localhost"),
        port=int(os.getenv("MCP_DB_PORT", "5432")),
        name=os.getenv("MCP_DB_NAME", "financial_hub"),
        user=os.getenv("MCP_DB_USER", "financial_user"),
        password=os.getenv("MCP_DB_PASSWORD", "financial_pass"),
        sslmode=os.getenv("MCP_DB_SSLMODE", "disable"),
    )
