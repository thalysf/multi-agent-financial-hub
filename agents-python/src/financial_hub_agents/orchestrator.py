from financial_hub_agents.agents import FinancialAnalyst, InvestmentAdvisor
from financial_hub_agents.llm import LlmProvider
from financial_hub_agents.models import OrchestratorResponse


INVESTMENT_KEYWORDS = {
    "asset",
    "assets",
    "carteira",
    "investimento",
    "investimentos",
    "investment",
    "investments",
    "portfolio",
    "position",
    "positions",
}

TRANSACTION_KEYWORDS = {
    "category",
    "despesa",
    "despesas",
    "expense",
    "expenses",
    "gasto",
    "gastos",
    "income",
    "receita",
    "receitas",
    "spending",
    "transaction",
    "transactions",
}


class Orchestrator:
    name = "Orchestrator"

    def __init__(
        self,
        financial_analyst: FinancialAnalyst | None = None,
        investment_advisor: InvestmentAdvisor | None = None,
        llm_provider: LlmProvider | None = None,
    ) -> None:
        self.financial_analyst = financial_analyst or FinancialAnalyst(llm_provider=llm_provider)
        self.investment_advisor = investment_advisor or InvestmentAdvisor(llm_provider=llm_provider)

    async def handle(self, message: str) -> OrchestratorResponse:
        routed_to, reason = self._route(message)

        if routed_to == "InvestmentAdvisor":
            result = await self.investment_advisor.analyze(message)
        else:
            result = await self.financial_analyst.analyze(message)

        return OrchestratorResponse(
            routed_to=routed_to,
            routing_reason=reason,
            response=result.response,
            tools_used=result.tools_used,
            data=result.data,
        )

    def _route(self, message: str) -> tuple[str, str]:
        normalized_message = message.lower()
        words = set(normalized_message.replace(",", " ").replace(".", " ").split())

        investment_matches = words & INVESTMENT_KEYWORDS
        transaction_matches = words & TRANSACTION_KEYWORDS

        if investment_matches and not transaction_matches:
            return "InvestmentAdvisor", f"Matched investment terms: {sorted(investment_matches)}"

        if transaction_matches:
            return "FinancialAnalyst", f"Matched transaction terms: {sorted(transaction_matches)}"

        return "FinancialAnalyst", "Default route for general financial analysis requests"
