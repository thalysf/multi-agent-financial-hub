from mcp.server.fastmcp import FastMCP

from financial_hub_mcp.database import DatabaseClient
from financial_hub_mcp.tools import register_tools


def create_mcp_server(database_client: DatabaseClient | None = None) -> FastMCP:
    mcp = FastMCP("financial-hub-mcp")
    register_tools(mcp, database_client or DatabaseClient())
    return mcp


mcp = create_mcp_server()


def main() -> None:
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
