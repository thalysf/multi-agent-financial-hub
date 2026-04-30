# Financial Hub Agents

Initial multi-agent system for Step 6 of the project specification.

## Agents

- `Orchestrator`: routes a user request to the best specialized agent.
- `FinancialAnalyst`: analyzes transactions and spending behavior.
- `InvestmentAdvisor`: analyzes investments and portfolio allocation.

The specialized agents use MCP tools from `financial_hub_mcp`; they do not read the database directly.

## LLM configuration

Step 7 uses Groq as the first LLM provider.

Create a local `.env` file in `agents-python/` using `.env.example` as reference:

```powershell
GROQ_API_KEY=your-token-here
GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
GROQ_FALLBACK_MODELS=llama-3.3-70b-versatile,llama-3.1-8b-instant
```

The real `.env` file is ignored by Git, so the token does not need to be committed.

The default model is `meta-llama/llama-4-scout-17b-16e-instruct`, with automatic fallback to `llama-3.3-70b-versatile` and then `llama-3.1-8b-instant`.

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

## HTTP API

Step 8 exposes the orchestrator over HTTP for the Kotlin backend:

```powershell
cd agents-python
python -m financial_hub_agents.api
```

Available endpoints:

- `GET /health`
- `POST /analyze` with body `{"message": "analyze my spending"}`

## Smoke test

```powershell
cd agents-python
python tests/smoke_test.py
```

For a live Groq validation:

```powershell
cd agents-python
python tests/live_groq_smoke_test.py
```
