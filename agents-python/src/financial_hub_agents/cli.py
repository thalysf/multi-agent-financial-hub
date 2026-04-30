import argparse
import asyncio
import json

from financial_hub_agents.orchestrator import Orchestrator


async def run(message: str) -> None:
    result = await Orchestrator().handle(message)
    print(json.dumps(result.model_dump(), indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Financial Hub orchestrator.")
    parser.add_argument("message", help="User request to route through the agent system.")
    args = parser.parse_args()
    asyncio.run(run(args.message))
