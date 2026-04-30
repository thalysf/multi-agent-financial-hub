from collections import defaultdict
from decimal import Decimal
import json

from financial_hub_agents.llm import GroqLlmProvider, LlmProvider
from financial_hub_agents.mcp_client import FinancialHubMcpClient
from financial_hub_agents.models import AgentResponse


class FinancialAnalyst:
    name = "FinancialAnalyst"

    def __init__(
        self,
        mcp_client: FinancialHubMcpClient | None = None,
        llm_provider: LlmProvider | None = None,
    ) -> None:
        self.mcp_client = mcp_client or FinancialHubMcpClient()
        self.llm_provider = llm_provider or GroqLlmProvider()

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
        analysis_data = {
            "transactionCount": len(items),
            "incomeTotal": str(income_total),
            "expenseTotal": str(expense_total),
            "netBalance": str(net_balance),
            "topExpenseCategory": (
                {"category": top_category[0], "amount": str(top_category[1])}
                if top_category
                else None
            ),
        }
        response = await self.llm_provider.generate(
            system_prompt=(
                "You are FinancialAnalyst, a specialized financial agent. "
                "Use only the provided MCP tool output and derived metrics. "
                "Give concise, practical spending analysis. Do not invent transactions."
            ),
            user_prompt=_analysis_prompt(
                original_message=message,
                tool_name="get_transactions",
                tool_output=transactions,
                analysis_data=analysis_data,
            ),
        )

        return AgentResponse(
            agent=self.name,
            tools_used=["get_transactions"],
            response=response,
            data=analysis_data,
        )


class InvestmentAdvisor:
    name = "InvestmentAdvisor"

    def __init__(
        self,
        mcp_client: FinancialHubMcpClient | None = None,
        llm_provider: LlmProvider | None = None,
    ) -> None:
        self.mcp_client = mcp_client or FinancialHubMcpClient()
        self.llm_provider = llm_provider or GroqLlmProvider()

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
        analysis_data = {
            "investmentCount": len(items),
            "totalPositionCost": str(total_position_cost),
            "largestPosition": largest_position,
        }
        response = await self.llm_provider.generate(
            system_prompt=(
                "You are InvestmentAdvisor, a specialized investment agent. "
                "Use only the provided MCP tool output and derived metrics. "
                "Give concise, practical portfolio analysis. Do not invent market prices or recommendations."
            ),
            user_prompt=_analysis_prompt(
                original_message=message,
                tool_name="get_investments",
                tool_output=investments,
                analysis_data=analysis_data,
            ),
        )

        return AgentResponse(
            agent=self.name,
            tools_used=["get_investments"],
            response=response,
            data=analysis_data,
        )


def _money(value: Decimal) -> str:
    return f"{value.quantize(Decimal('0.01'))}"


def _top_decimal_item(items: dict[str, Decimal]) -> tuple[str, Decimal] | None:
    if not items:
        return None

    return max(items.items(), key=lambda item: item[1])


def _analysis_prompt(
    *,
    original_message: str,
    tool_name: str,
    tool_output: dict,
    analysis_data: dict,
) -> str:
    payload = {
        "originalMessage": original_message,
        "mcpToolUsed": tool_name,
        "mcpToolOutput": tool_output,
        "derivedMetrics": analysis_data,
    }
    return (
        "Answer the user using this JSON context. Keep the response brief and grounded in the data.\n"
        f"{json.dumps(payload, ensure_ascii=False, indent=2)}"
    )
