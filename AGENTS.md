# AGENTS Progress Tracker

## Status

This file tracks the real implementation state of the project.

Step 1, Step 2, Step 3, Step 4, Step 5, Step 6, Step 7, and Step 8 have been completed.

Frontend is part of the project specification, but it has not been started yet.

## Completed Steps

- Step 1 - Initial Project Setup
- Step 2 - Transactions CRUD
- Step 3 - Backend Modularization
- Step 4 - Investments Module
- Step 5 - MCP Server
- Step 6 - Multi-Agent System
- Step 7 - LLM Integration
- Step 8 - Kotlin to Python Integration

## Current Step

- No active implementation step at the moment

## Next Steps

- Step 9 - Spring AI Integration in Kotlin Backend

## Decisions Taken

- `specs.md` was created as the source of truth for project execution
- Progress tracking will be updated in this file after implementation begins
- Frontend is part of the official scope
- Spring AI is part of the official scope
- Frontend Plan A is `React + TypeScript + Vite + Tailwind CSS`
- `shadcn/ui` is not part of the initial frontend implementation
- Additional frontend tooling should only be added if the minimal stack becomes insufficient
- Spring AI will be implemented in a dedicated backend step after the main Kotlin to Python integration is working
- Backend uses Kotlin with Spring Boot and Maven
- Spring backend configuration uses `application.yml`
- All project containers must be declared and executed through the root `docker-compose.yml`
- PostgreSQL and backend execution were validated through Docker Compose
- Local Java should be preferred when compatible, but Docker Compose is the fallback for runtimes that are not compatible with the Kotlin toolchain
- Transactions are exposed through the `/transactions` REST resource
- Transaction persistence uses Spring Data JPA with automatic schema update for the current project stage
- Step 2 validation uses the PostgreSQL service provided by the root `docker-compose.yml`
- Transaction code is organized by feature using MVC-oriented layers (`controller`, `service`, `repository`, `domain`, `exception`)
- The backend Compose command runs `mvn clean spring-boot:run` to avoid stale compiled classes after structural refactors
- Backend modularization uses a shared `FinancialModule` contract plus a `FinancialModuleRegistry`
- The transaction module boundary is exposed through the `TransactionModule` interface instead of leaking service implementation details
- Investments are exposed through the `/investments` REST resource using the same modular boundary pattern as transactions
- Transaction request/response classes live in a dedicated `dto` subpackage
- Investment request/response classes live in a dedicated `dto` subpackage
- Exception handlers (`RestControllerAdvice`) are kept in each module's `exception` package
- The MCP server uses direct PostgreSQL access to expose real project data through MCP tools
- MCP server database configuration is driven by environment variables with defaults aligned to the root `docker-compose.yml`
- Step 5 validation uses an in-memory MCP client session to execute the mandatory tools locally against the real PostgreSQL database
- MCP server Python code is organized as an installable `src/` layout package named `financial_hub_mcp`
- The initial Step 6 multi-agent system was deterministic; Step 7 replaced final agent text generation with Groq-backed LLM responses
- The agent system is organized as an installable `src/` layout package named `financial_hub_agents`
- Specialized agents must access project data through MCP tools instead of direct database access
- Groq is the first LLM provider implemented for the Python agents
- Groq API keys must be supplied through `GROQ_API_KEY` in the environment or an ignored local `agents-python/.env` file
- Groq model selection uses `meta-llama/llama-4-scout-17b-16e-instruct` as the default model, with `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` as same-provider fallbacks
- The Python agent system exposes an HTTP integration layer with FastAPI for Kotlin backend communication
- The Python agents HTTP service exposes `GET /health` and `POST /analyze`
- The Kotlin backend exposes `POST /ai/analyze` as the backend-facing AI analysis endpoint
- Kotlin to Python integration uses `AGENTS_BASE_URL`, defaulting to `http://localhost:8000` locally and `http://agents:8000` in Docker Compose
- The backend AI package follows the current MVC/service/client style: `controller`, `service`, `client`, `dto`, and `exception`
- Step 8 deliberately does not use Spring AI; Spring AI remains Step 9
- Docker Compose now declares `postgres`, `agents`, and `backend`; project services should continue to run through the root `docker-compose.yml`

## Problems Found

- Local JDK 26 is not compatible with Kotlin 1.9.25 for Maven compilation in this project context
- Docker Compose with JDK 21 was used to keep Step 1 executable and testable
- Backend test execution inside the Maven container must use the Compose datasource host instead of `localhost`
- The `pip` command is not directly available in the local PowerShell environment, so Python package installation should use `python -m pip`
- Running backend Maven tests with `spring.jpa.hibernate.ddl-auto=create-drop` against the Compose PostgreSQL database can wipe current local data; reseed transactions/investments afterward if manual end-to-end validation needs real rows
- `docker compose run backend ...` may start dependent services such as `agents` because of Compose dependencies

## Notes

- Base repository structure exists
- PostgreSQL is available through Docker Compose
- Backend is available in `backend-kotlin/`
- `GET /health` responds with database-backed status when the backend service is running
- Transaction CRUD backend structure now exists in `backend-kotlin/src/main/kotlin/com/financialhub/backend/transactions/`
- Transaction creation and listing were validated with Spring Boot integration tests against PostgreSQL
- Manual validation also confirmed `POST /transactions` and `GET /transactions` through the running Docker Compose backend
- Modular backend contracts now exist in `backend-kotlin/src/main/kotlin/com/financialhub/backend/modules/`
- Step 3 validation confirmed module registration plus continued backend operation after modularization
- Investment CRUD backend structure now exists in `backend-kotlin/src/main/kotlin/com/financialhub/backend/investments/`
- Step 4 validation confirmed investment CRUD through Spring Boot integration tests and manual `POST /investments` plus `GET /investments`
- MCP server implementation now exists in `mcp-server/` with `get_transactions`, `add_transaction`, and `get_investments`
- Step 5 validation confirmed mandatory MCP tool registration plus real PostgreSQL reads and writes through `python tests/smoke_test.py`
- MCP server structure separates server creation, tool registration, database access, schemas, and configuration
- Initial multi-agent implementation now exists in `agents-python/` with `Orchestrator`, `FinancialAnalyst`, and `InvestmentAdvisor`
- Step 6 validation confirmed routing behavior and MCP-backed agent responses through `python tests/smoke_test.py`
- Step 7 validation confirmed Groq-generated agent responses based on real MCP tool outputs through `python tests/live_groq_smoke_test.py`
- A local ignored `agents-python/.env` file exists for `GROQ_API_KEY`; the current key was created on April 29, 2026 and should be renewed by July 28, 2026
- FastAPI integration for agents now exists at `agents-python/src/financial_hub_agents/api.py`
- Kotlin AI integration now exists in `backend-kotlin/src/main/kotlin/com/financialhub/backend/ai/`
- Backend AI endpoint contract:
  - request: `POST /ai/analyze` with JSON body `{"message": "..."}`
  - response: `agent`, `routedTo`, `routingReason`, `response`, `toolsUsed`, and `data`
- Python agents endpoint contract:
  - request: `POST /analyze` with JSON body `{"message": "..."}`
  - response uses camelCase aliases for Kotlin compatibility (`routedTo`, `routingReason`, `toolsUsed`)
- Root `docker-compose.yml` now starts the Python agents service using `python:3.14-slim`, installs `agents-python/requirements.txt`, and runs `python -m financial_hub_agents.api`
- Docker Compose agents service reads `agents-python/.env` through `env_file`; the real token remains ignored by Git
- Compose runtime database configuration for MCP uses service host `postgres` through `MCP_DB_HOST=postgres`
- Step 8 backend test validation passed with `docker compose run --rm -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/financial_hub backend ./mvnw test`
- Step 8 Python validation passed with `python tests/smoke_test.py`, `python tests/live_groq_smoke_test.py`, `python -m compileall -q src tests`, and `python -m pip check` inside `agents-python/.venv`
- Step 8 end-to-end validation passed through Docker Compose with `POST http://localhost:8080/ai/analyze`
- Manual end-to-end validation seeded:
  - transaction: `EXPENSE`, amount `125.75`, category `Groceries`, date `2026-04-29`
  - investment: asset `VALE3`, quantity `900.0000`, averagePrice `84.32`
- Confirmed full flow after Step 8:
  - `POST /ai/analyze` on Kotlin backend
  - Kotlin `AgentsClient` calls Python FastAPI `/analyze`
  - Python `Orchestrator` routes to `FinancialAnalyst` or `InvestmentAdvisor`
  - Specialized agent calls MCP tools (`get_transactions` or `get_investments`)
  - MCP reads PostgreSQL
  - Groq generates the final natural-language response from real tool output
- Current recommended next step is Step 9 - Spring AI Integration in Kotlin Backend
- For the next session, read `specs.md` and this `AGENTS.md` first; do not start frontend yet because Step 9 comes before frontend setup
