# AGENTS Progress Tracker

## Status

This file tracks the real implementation state of the project.

Step 1, Step 2, Step 3, and Step 4 have been completed.

Frontend is part of the project specification, but it has not been started yet.

## Completed Steps

- Step 1 - Initial Project Setup
- Step 2 - Transactions CRUD
- Step 3 - Backend Modularization
- Step 4 - Investments Module

## Current Step

- No active implementation step at the moment

## Next Steps

- Step 5 - MCP Server

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

## Problems Found

- Local JDK 26 is not compatible with Kotlin 1.9.25 for Maven compilation in this project context
- Docker Compose with JDK 21 was used to keep Step 1 executable and testable
- Backend test execution inside the Maven container must use the Compose datasource host instead of `localhost`

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
