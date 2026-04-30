import asyncio
import json

from financial_hub_agents.orchestrator import Orchestrator
from financial_hub_agents.llm import StaticLlmProvider


async def run_smoke_test() -> None:
    orchestrator = Orchestrator(llm_provider=StaticLlmProvider())

    spending_result = await orchestrator.handle("Analyze my expenses and spending by category")
    investment_result = await orchestrator.handle("Analyze my investment portfolio")

    if spending_result.routed_to != "FinancialAnalyst":
        raise RuntimeError("Expected expense request to route to FinancialAnalyst.")

    if investment_result.routed_to != "InvestmentAdvisor":
        raise RuntimeError("Expected investment request to route to InvestmentAdvisor.")

    if "get_transactions" not in spending_result.tools_used:
        raise RuntimeError("FinancialAnalyst did not use the get_transactions MCP tool.")

    if "get_investments" not in investment_result.tools_used:
        raise RuntimeError("InvestmentAdvisor did not use the get_investments MCP tool.")

    if "Static LLM response" not in spending_result.response:
        raise RuntimeError("FinancialAnalyst did not generate its response through the LLM provider.")

    if "Static LLM response" not in investment_result.response:
        raise RuntimeError("InvestmentAdvisor did not generate its response through the LLM provider.")

    report = {
        "spending": spending_result.model_dump(),
        "investments": investment_result.model_dump(),
    }
    print(json.dumps(report, indent=2))


def main() -> None:
    asyncio.run(run_smoke_test())


if __name__ == "__main__":
    main()
