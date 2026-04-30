from typing import Any

from mcp.shared.memory import create_connected_server_and_client_session

from financial_hub_mcp.server import mcp


class FinancialHubMcpClient:
    def __init__(self, mcp_server=mcp) -> None:
        self.mcp_server = mcp_server

    async def call_tool(self, tool_name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        async with create_connected_server_and_client_session(
            self.mcp_server,
            raise_exceptions=True,
        ) as client_session:
            result = await client_session.call_tool(tool_name, arguments)

        return dict(result.structuredContent or {})

    async def get_transactions(self, *, limit: int = 100) -> dict[str, Any]:
        return await self.call_tool("get_transactions", {"limit": limit})

    async def get_investments(self, *, limit: int = 100) -> dict[str, Any]:
        return await self.call_tool("get_investments", {"limit": limit})
