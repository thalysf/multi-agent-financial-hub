from datetime import date
from decimal import Decimal
from typing import Literal

from mcp.server.fastmcp import FastMCP

from financial_hub_mcp.database import DatabaseClient
from financial_hub_mcp.schemas import (
    InvestmentRecord,
    InvestmentsResponse,
    TransactionRecord,
    TransactionsResponse,
)


def register_tools(mcp: FastMCP, database_client: DatabaseClient) -> None:
    @mcp.tool()
    def get_transactions(
        limit: int = 50,
        transaction_type: Literal["INCOME", "EXPENSE"] | None = None,
        category: str | None = None,
    ) -> TransactionsResponse:
        """Return transactions from the project PostgreSQL database."""
        rows = database_client.get_transactions(
            limit=limit,
            transaction_type=transaction_type,
            category=category,
        )
        items = [TransactionRecord.model_validate(row) for row in rows]
        return TransactionsResponse(count=len(items), items=items)

    @mcp.tool()
    def add_transaction(
        type: Literal["INCOME", "EXPENSE"],
        amount: Decimal,
        category: str,
        date: date,
    ) -> TransactionRecord:
        """Insert a transaction into PostgreSQL and return the created record."""
        row = database_client.add_transaction(
            transaction_type=type,
            amount=amount,
            category=category,
            transaction_date=date,
        )
        return TransactionRecord.model_validate(row)

    @mcp.tool()
    def get_investments(limit: int = 50) -> InvestmentsResponse:
        """Return investments from the project PostgreSQL database."""
        rows = database_client.get_investments(limit=limit)
        items = [InvestmentRecord.model_validate(row) for row in rows]
        return InvestmentsResponse(count=len(items), items=items)
