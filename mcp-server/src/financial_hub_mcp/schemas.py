from typing import Literal

from pydantic import BaseModel, Field


class TransactionRecord(BaseModel):
    id: int
    type: Literal["INCOME", "EXPENSE"]
    amount: str
    category: str
    date: str


class TransactionsResponse(BaseModel):
    count: int = Field(description="Number of transactions returned by the tool.")
    items: list[TransactionRecord]


class InvestmentRecord(BaseModel):
    id: int
    asset: str
    quantity: str
    averagePrice: str


class InvestmentsResponse(BaseModel):
    count: int = Field(description="Number of investments returned by the tool.")
    items: list[InvestmentRecord]
