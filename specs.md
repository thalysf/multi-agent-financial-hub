# Financial Hub - Spec Driven Development (SDD)

## Objective

Build a modular financial management system with:

- Kotlin backend using Spring Boot
- Python multi-agent system
- MCP (Model Context Protocol) server for tool access to database and internal services
- LLM integration for financial analysis
- Frontend for data visualization and AI interaction
- Fully local infrastructure orchestrated with Docker

The system must be:

- Modular
- Extensible
- Incremental to implement
- Simple enough for guided learning and portfolio use

## Implementation Policy

This project must follow Spec-Driven Development.

Rules:

1. Never implement work outside the current defined step.
2. Always execute one step at a time.
3. Each step must be small, testable, and independently verifiable.
4. Validation is mandatory before moving to the next step.
5. `AGENTS.md` must be updated after every completed step.

## Progress Tracking

The project must maintain a root-level file named `AGENTS.md`.

`AGENTS.md` must always contain:

- Completed steps
- Current step
- Next steps
- Decisions taken
- Problems found

Whenever progress is made:

1. Update the code.
2. Update `AGENTS.md`.

## Repository Structure

The target structure is:

```text
/financial-hub
|-- backend-kotlin/
|-- agents-python/
|-- mcp-server/
|-- frontend-react/
|-- docker/
|-- docs/
|-- docker-compose.yml
|-- specs.md
`-- AGENTS.md
```

## Technology Decisions

These decisions are part of the specification and must be treated as default implementation rules.

### Backend

- Use Kotlin.
- Use Spring Boot.
- Use Maven as the backend build tool.
- Use `application.yml` for Spring configuration.
- Use Spring AI in a dedicated later step for native AI capabilities inside the Kotlin backend.
- Use Spring Web for REST endpoints.
- Use Spring Data JPA for persistence.
- Use PostgreSQL as the primary database.
- Use Docker Compose to run local infrastructure.

### Container Execution Policy

- Any project container must be declared in the root `docker-compose.yml`.
- Do not use ad hoc `docker run` containers as part of the project workflow.
- When a service is containerized, it must be started through `docker compose`.
- If the local environment already provides a compatible dependency, prefer using it.
- If an additional runtime or tool must be downloaded, prefer downloading it inside a Docker Compose service so it can be removed cleanly later.

### Multi-agent System

- Use Python 3.11 or newer.
- Use FastAPI for Python HTTP services when an HTTP layer is needed.
- Keep the agent system in a separate `agents-python/` directory.

### MCP Server

- Implement the MCP server in Python.
- The MCP server must be responsible for exposing tools that access real project data.
- Prefer direct database access or internal service access only when necessary for the current step.

### Frontend

- Use React.
- Use TypeScript.
- Use Vite as the frontend build tool.
- Use Tailwind CSS for styling.
- Keep the frontend implementation simple and focused on a dashboard-style interface.
- Build custom reusable components only as needed.

### Frontend Fallback Strategy

Plan A:

- Implement the frontend using only React, TypeScript, Vite, and Tailwind CSS.

Plan B:

- Add `shadcn/ui` only if the visual quality or component development effort becomes a blocker.

Constraint:

- Do not start with `shadcn/ui`.
- Do not add extra frontend libraries unless the minimal stack is no longer sufficient.

### LLM Strategy

Plan A:

- Use Groq as the primary LLM provider for agent intelligence.

Plan B:

- Use Ollama only if Groq integration is not working or is unavailable in the local execution environment.

Constraint:

- Do not implement Groq and Ollama simultaneously in the first version.
- Implement Ollama only as a fallback after Groq fails.

## Step-by-Step Implementation

## Step 1 - Initial Project Setup

### Goal

Create the base repository structure and a working Kotlin backend.

### Required tasks

- Create the initial folder structure.
- Create the Spring Boot Kotlin project in `backend-kotlin/`.
- Use Maven for the backend project.
- Use `application.yml` for backend configuration.
- Create `docker-compose.yml`.
- Add PostgreSQL service in Docker Compose.
- Add backend service in Docker Compose for container-based execution and validation.
- Configure backend connection to PostgreSQL.
- Expose a `GET /health` endpoint.

### Validation criteria

- The backend starts successfully.
- The backend connects to PostgreSQL.
- `GET /health` returns HTTP 200.

### Expected output

- Base repository structure created.
- Kotlin backend running locally.
- Database running and connected.

## Step 2 - Transactions CRUD

### Goal

Create the first financial module for income and expense transactions.

### Required tasks

- Create entity `Transaction`.
- Create JPA repository for `Transaction`.
- Create service layer for `Transaction`.
- Create REST controller for `Transaction`.

### Minimum fields

- `id`
- `type` with values `INCOME` or `EXPENSE`
- `amount`
- `category`
- `date`

### Validation criteria

- It is possible to create a transaction.
- It is possible to list transactions.
- Data persists correctly in PostgreSQL.

## Step 3 - Backend Modularization

### Goal

Refactor the backend into a modular architecture that supports future financial modules.

### Required tasks

- Create interface `FinancialModule`.
- Isolate transaction logic into its own module boundary.
- Prepare structure for adding new modules without coupling to transaction implementation details.

### Validation criteria

- The transaction module is clearly isolated.
- Module boundaries are explicit in code structure.
- The backend remains functional after modularization.

## Step 4 - Investments Module

### Goal

Add a second module for investments.

### Required tasks

- Create entity `Investment`.
- Create basic CRUD for `Investment`.

### Minimum fields

- `id`
- `asset`
- `quantity`
- `averagePrice`

### Validation criteria

- Investment CRUD works correctly.
- Investment code is separated from transaction code.

## Step 5 - MCP Server

### Goal

Create the MCP layer that exposes tools to agents.

### Required tasks

- Create the Python MCP server in `mcp-server/`.
- Use FastAPI if an HTTP interface is needed for local integration support.
- Implement these mandatory tools:
  - `get_transactions`
  - `add_transaction`
  - `get_investments`

### Validation criteria

- The tools return real project data.
- The MCP server can access the database correctly.
- Tool execution works locally.

## Step 6 - Multi-Agent System

### Goal

Create the initial multi-agent architecture.

### Required agents

- `Orchestrator`
- `FinancialAnalyst`
- `InvestmentAdvisor`

### Responsibilities

- `Orchestrator`: decides which specialized agent should handle the request.
- `FinancialAnalyst`: analyzes transactions and spending behavior.
- `InvestmentAdvisor`: analyzes investments and investment-related questions.

### Validation criteria

- The orchestrator routes requests correctly.
- Specialized agents use MCP tools instead of hardcoded data.
- Agent responses depend on real project data.

## Step 7 - LLM Integration

### Goal

Add real language-model reasoning to the agents.

### Required tasks

- Integrate Groq as the default LLM provider.
- Make agents generate responses using real tool outputs.
- Keep prompts and provider integration isolated from business logic when reasonable.

### Fallback rule

- If Groq integration fails technically or cannot be used in the local environment, replace the provider with Ollama.
- Do not switch to Ollama preemptively.

### Validation criteria

- Agents generate dynamic responses.
- Responses are based on real system data.
- Groq is the first implementation attempted.
- Ollama is used only if Groq cannot be made to work.

## Step 8 - Kotlin to Python Integration

### Goal

Connect the Kotlin backend to the Python agent system.

### Required tasks

- Create `POST /ai/analyze` in the Kotlin backend.
- Forward analysis requests to the Python orchestrator.
- Return the orchestrator response through the Kotlin API.

### Validation criteria

- End-to-end flow works:

```text
API -> Agent -> MCP -> DB -> response
```

- The Kotlin API returns the final agent output successfully.

## Step 9 - Spring AI Integration in Kotlin Backend

### Goal

Add Spring AI to the Kotlin backend as a real project capability.

### Required tasks

- Add Spring AI dependencies to the Kotlin backend.
- Create at least one backend service that uses Spring AI.
- Connect Spring AI to the same LLM strategy already defined for the project.
- Reuse project data or backend services as context for prompts when reasonable.
- Expose at least one dedicated Spring AI endpoint in the Kotlin backend.

### Provider rule

Plan A:

- Use Groq as the first provider attempted through the project LLM strategy.

Plan B:

- Use Ollama only if Groq cannot be made to work in this environment.

Constraint:

- Do not introduce a second independent LLM strategy only for Spring AI.
- Spring AI must follow the same provider fallback policy already defined in this specification.

### Suggested use cases

- financial summary generation
- transaction insight generation
- backend-native explanation endpoint

### Validation criteria

- Spring AI is integrated successfully into the Kotlin backend.
- At least one endpoint returns AI-generated output through Spring AI.
- The feature uses real project context rather than a static prompt only.
- Spring AI has a real use inside the project, even if the initial implementation is simple.

## Step 10 - Frontend Setup

### Goal

Create the base frontend application with the minimum stack required for a polished interface.

### Required tasks

- Create the frontend project in `frontend-react/`.
- Use React with TypeScript.
- Use Vite for local development and build.
- Configure Tailwind CSS.
- Create the initial app layout structure.

### Validation criteria

- The frontend starts successfully.
- Tailwind CSS styles are applied correctly.
- The base layout renders without depending on mock frameworks or extra UI libraries.

### Expected output

- Frontend project running locally.
- Base visual structure ready for dashboard pages.

## Step 11 - Initial Dashboard Interface

### Goal

Create a simple but visually polished dashboard for the financial system.

### Required tasks

- Create a main layout with sidebar, top bar, and content area.
- Create reusable UI primitives as needed, such as:
  - `Button`
  - `Card`
  - `Input`
  - `Badge`
  - `Table`
- Create an initial dashboard page showing:
  - summary cards
  - transaction list
  - investment section
  - AI analysis entry point

### Validation criteria

- The interface looks consistent and organized.
- The layout works on desktop and mobile widths.
- The visual result is good without adding unnecessary frontend tooling.

## Step 12 - Frontend to Backend Integration

### Goal

Connect the frontend to the Kotlin backend and AI analysis flow.

### Required tasks

- Integrate transaction listing with backend APIs.
- Integrate investment listing with backend APIs.
- Add a frontend action for AI analysis requests.
- Display the AI response in the dashboard interface.

### Validation criteria

- The frontend renders real backend data.
- The frontend can trigger AI analysis successfully.
- The interface reflects live system state instead of static mock data.

## Agent Execution Rules

For any agent executing this specification:

1. Execute only one step at a time.
2. Validate the current step before starting the next one.
3. Update `AGENTS.md` after each step.
4. Report:
   - what was done
   - how to test it
   - what the next recommended step is

## Engineering Guidelines

- Avoid overengineering.
- Avoid turning this into real microservices.
- Prefer simple and readable solutions.
- Optimize for learning value and incremental progress.
- Reuse local project conventions once they exist.
- Keep the frontend stack minimal unless a clear blocker appears.
- Prefer handcrafted Tailwind components before adopting additional UI libraries.

## Non-Goals

- Do not add complex authentication.
- Do not use multiple LLM providers simultaneously in the first implementation.
- Do not skip steps.
- Do not start the frontend with a large component ecosystem.

## Final Notes

This project is intended to serve as:

- a learning lab
- a portfolio project
- a base for more advanced systems later

Priorities:

- Clarity
- Simplicity
- Incremental evolution
