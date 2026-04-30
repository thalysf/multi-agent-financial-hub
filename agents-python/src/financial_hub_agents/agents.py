from collections import defaultdict
from decimal import Decimal

from financial_hub_agents.mcp_client import FinancialHubMcpClient
from financial_hub_agents.models import AgentResponse


class FinancialAnalyst:
    name = "FinancialAnalyst"

    def __init__(self, mcp_client: FinancialHubMcpClient | None = None) -> None:
        self.mcp_client = mcp_client or FinancialHubMcpClient()

    async def analyze(self, message: str) -> AgentResponse:
        transactions = await self.mcp_client.get_transactions(limit=100)
        items = transactions.get("items", [])

        if not items:
            return AgentResponse(
                agent=self.name,
                tools_used=["get_transactions"],
                response="No transactions were found, so there is no spending behavior to analyze yet.",
                data={"transactionCount": 0},
            )

        income_total = Decimal("0")
        expense_total = Decimal("0")
        expenses_by_category: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))

        for item in items:
            amount = Decimal(str(item["amount"]))
            if item["type"] == "INCOME":
                income_total += amount
            else:
                expense_total += amount
                expenses_by_category[str(item["category"])] += amount

        net_balance = income_total - expense_total
        top_category = _top_decimal_item(expenses_by_category)

        response = (
            f"Analyzed {len(items)} transaction(s). "
            f"Income total is {_money(income_total)}, expenses total {_money(expense_total)}, "
            f"and the net balance is {_money(net_balance)}."
        )
        if top_category is not None:
            category, total = top_category
            response += f" The highest spending category is {category} with {_money(total)}."

        return AgentResponse(
            agent=self.name,
            tools_used=["get_transactions"],
            response=response,
            data={
                "transactionCount": len(items),
                "incomeTotal": str(income_total),
                "expenseTotal": str(expense_total),
                "netBalance": str(net_balance),
                "topExpenseCategory": (
                    {"category": top_category[0], "amount": str(top_category[1])}
                    if top_category
                    else None
                ),
            },
        )


class InvestmentAdvisor:
    name = "InvestmentAdvisor"

    def __init__(self, mcp_client: FinancialHubMcpClient | None = None) -> None:
        self.mcp_client = mcp_client or FinancialHubMcpClient()

    async def analyze(self, message: str) -> AgentResponse:
        investments = await self.mcp_client.get_investments(limit=100)
        items = investments.get("items", [])

        if not items:
            return AgentResponse(
                agent=self.name,
                tools_used=["get_investments"],
                response="No investments were found, so there is no portfolio allocation to analyze yet.",
                data={"investmentCount": 0},
            )

        positions = []
        total_position_cost = Decimal("0")

        for item in items:
            quantity = Decimal(str(item["quantity"]))
            average_price = Decimal(str(item["averagePrice"]))
            position_cost = quantity * average_price
            total_position_cost += position_cost
            positions.append(
                {
                    "asset": item["asset"],
                    "quantity": str(quantity),
                    "averagePrice": str(average_price),
                    "positionCost": str(position_cost),
                }
            )

        largest_position = max(positions, key=lambda position: Decimal(position["positionCost"]))
        response = (
            f"Analyzed {len(items)} investment position(s). "
            f"The total position cost is {_money(total_position_cost)}. "
            f"The largest position is {largest_position['asset']} at {_money(Decimal(largest_position['positionCost']))}."
        )

        return AgentResponse(
            agent=self.name,
            tools_used=["get_investments"],
            response=response,
            data={
                "investmentCount": len(items),
                "totalPositionCost": str(total_position_cost),
                "largestPosition": largest_position,
            },
        )


def _money(value: Decimal) -> str:
    return f"{value.quantize(Decimal('0.01'))}"


def _top_decimal_item(items: dict[str, Decimal]) -> tuple[str, Decimal] | None:
    if not items:
        return None

    return max(items.items(), key=lambda item: item[1])
