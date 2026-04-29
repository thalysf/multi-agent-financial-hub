import asyncio
from datetime import date
import json
from uuid import uuid4

from mcp.shared.memory import create_connected_server_and_client_session

from financial_hub_mcp.server import mcp


MANDATORY_TOOLS = {"get_transactions", "add_transaction", "get_investments"}


async def run_smoke_test() -> None:
    async with create_connected_server_and_client_session(mcp, raise_exceptions=True) as client_session:
        tools = await client_session.list_tools()
        tool_names = {tool.name for tool in tools.tools}
        missing_tools = MANDATORY_TOOLS - tool_names

        if missing_tools:
            raise RuntimeError(f"Missing mandatory tools: {sorted(missing_tools)}")

        unique_category = f"MCP Smoke {uuid4().hex[:8]}"

        created_transaction = await client_session.call_tool(
            "add_transaction",
            {
                "type": "EXPENSE",
                "amount": "19.90",
                "category": unique_category,
                "date": date.today().isoformat(),
            },
        )
        transactions = await client_session.call_tool(
            "get_transactions",
            {
                "category": unique_category,
                "limit": 5,
            },
        )
        investments = await client_session.call_tool(
            "get_investments",
            {
                "limit": 5,
            },
        )

        transaction_payload = created_transaction.structuredContent
        transactions_payload = transactions.structuredContent
        investments_payload = investments.structuredContent

        if transaction_payload["category"] != unique_category:
            raise RuntimeError("Created transaction did not match the requested category.")

        matched_categories = {
            item["category"]
            for item in transactions_payload["items"]
        }
        if unique_category not in matched_categories:
            raise RuntimeError("Created transaction was not returned by get_transactions.")

        report = {
            "tools": sorted(tool_names),
            "createdTransaction": transaction_payload,
            "transactionsCount": transactions_payload["count"],
            "investmentsCount": investments_payload["count"],
        }
        print(json.dumps(report, indent=2))


def main() -> None:
    asyncio.run(run_smoke_test())


if __name__ == "__main__":
    main()
