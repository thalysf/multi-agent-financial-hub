# Financial Hub Agents

Initial multi-agent system for Step 6 of the project specification.

## Agents

- `Orchestrator`: routes a user request to the best specialized agent.
- `FinancialAnalyst`: analyzes transactions and spending behavior.
- `InvestmentAdvisor`: analyzes investments and portfolio allocation.

The specialized agents use MCP tools from `financial_hub_mcp`; they do not read the database directly.

## Run

```powershell
cd agents-python
python -m pip install -r requirements.txt
python -m financial_hub_agents "analyze my spending"
```

You can also run the installed console script:

```powershell
financial-hub-agents "show my investment summary"
```

## Smoke test

```powershell
cd agents-python
python tests/smoke_test.py
```
