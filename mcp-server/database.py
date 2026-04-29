from datetime import date
from decimal import Decimal

import psycopg
from psycopg.rows import dict_row

from config import DatabaseSettings, load_database_settings


ALLOWED_TRANSACTION_TYPES = {"INCOME", "EXPENSE"}


class DatabaseClient:
    def __init__(self, settings: DatabaseSettings | None = None) -> None:
        self.settings = settings or load_database_settings()

    def get_transactions(
        self,
        *,
        limit: int = 50,
        transaction_type: str | None = None,
        category: str | None = None,
    ) -> list[dict[str, str | int]]:
        normalized_limit = _normalize_limit(limit)
        normalized_type = _normalize_transaction_type(transaction_type)
        normalized_category = category.strip() if category else None

        clauses = []
        params: list[object] = []

        if normalized_type is not None:
            clauses.append("type = %s")
            params.append(normalized_type)

        if normalized_category:
            clauses.append("category ILIKE %s")
            params.append(normalized_category)

        where_clause = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        query = f"""
            SELECT id, type, amount, category, date
            FROM transactions
            {where_clause}
            ORDER BY date DESC, id DESC
            LIMIT %s
        """
        params.append(normalized_limit)

        with psycopg.connect(self.settings.dsn, row_factory=dict_row) as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, params)
                rows = cursor.fetchall()

        return [_serialize_transaction_row(row) for row in rows]

    def add_transaction(
        self,
        *,
        transaction_type: str,
        amount: Decimal,
        category: str,
        transaction_date: date,
    ) -> dict[str, str | int]:
        normalized_type = _normalize_transaction_type(transaction_type, required=True)
        normalized_amount = _normalize_amount(amount)
        normalized_category = _normalize_category(category)

        query = """
            INSERT INTO transactions (type, amount, category, date)
            VALUES (%s, %s, %s, %s)
            RETURNING id, type, amount, category, date
        """
        params = [
            normalized_type,
            normalized_amount,
            normalized_category,
            transaction_date,
        ]

        with psycopg.connect(self.settings.dsn, row_factory=dict_row) as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, params)
                created = cursor.fetchone()

        if created is None:
            raise RuntimeError("Transaction insert did not return a created row.")

        return _serialize_transaction_row(created)

    def get_investments(self, *, limit: int = 50) -> list[dict[str, str | int]]:
        normalized_limit = _normalize_limit(limit)
        query = """
            SELECT id, asset, quantity, average_price
            FROM investments
            ORDER BY id DESC
            LIMIT %s
        """

        with psycopg.connect(self.settings.dsn, row_factory=dict_row) as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, [normalized_limit])
                rows = cursor.fetchall()

        return [_serialize_investment_row(row) for row in rows]


def _normalize_limit(limit: int) -> int:
    if limit < 1:
        raise ValueError("limit must be greater than zero.")

    return min(limit, 100)


def _normalize_transaction_type(
    transaction_type: str | None,
    *,
    required: bool = False,
) -> str | None:
    if transaction_type is None:
        if required:
            raise ValueError("transaction type is required.")
        return None

    normalized_type = transaction_type.strip().upper()
    if normalized_type not in ALLOWED_TRANSACTION_TYPES:
        raise ValueError("transaction type must be INCOME or EXPENSE.")

    return normalized_type


def _normalize_amount(amount: Decimal) -> Decimal:
    if amount <= Decimal("0"):
        raise ValueError("amount must be greater than zero.")

    return amount


def _normalize_category(category: str) -> str:
    normalized_category = category.strip()
    if not normalized_category:
        raise ValueError("category must not be blank.")

    return normalized_category


def _serialize_transaction_row(row: dict[str, object]) -> dict[str, str | int]:
    return {
        "id": int(row["id"]),
        "type": str(row["type"]),
        "amount": str(row["amount"]),
        "category": str(row["category"]),
        "date": row["date"].isoformat(),
    }


def _serialize_investment_row(row: dict[str, object]) -> dict[str, str | int]:
    return {
        "id": int(row["id"]),
        "asset": str(row["asset"]),
        "quantity": str(row["quantity"]),
        "averagePrice": str(row["average_price"]),
    }
