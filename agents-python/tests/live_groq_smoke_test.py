import asyncio
import json

from financial_hub_agents.llm import MissingGroqApiKeyError
from financial_hub_agents.orchestrator import Orchestrator


async def run_smoke_test() -> None:
    orchestrator = Orchestrator()

    spending_result = await orchestrator.handle("Analyze my expenses using the real Groq provider")
    investment_result = await orchestrator.handle("Analyze my investment portfolio using the real Groq provider")

    if spending_result.routed_to != "FinancialAnalyst":
        raise RuntimeError("Expected expense request to route to FinancialAnalyst.")

    if investment_result.routed_to != "InvestmentAdvisor":
        raise RuntimeError("Expected investment request to route to InvestmentAdvisor.")

    report = {
        "spending": spending_result.model_dump(),
        "investments": investment_result.model_dump(),
    }
    print(json.dumps(report, indent=2))


def main() -> None:
    try:
        asyncio.run(run_smoke_test())
    except MissingGroqApiKeyError as error:
        raise SystemExit(str(error)) from error


if __name__ == "__main__":
    main()
