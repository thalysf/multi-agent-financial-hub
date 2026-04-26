# AGENTS Progress Tracker

## Status

This file tracks the real implementation state of the project.

Step 1 has been completed.

Frontend is part of the project specification, but it has not been started yet.

## Completed Steps

- Step 1 - Initial Project Setup

## Current Step

- No active implementation step at the moment

## Next Steps

- Step 2 - Transactions CRUD

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

## Problems Found

- Local JDK 26 is not compatible with Kotlin 1.9.25 for Maven compilation in this project context
- Docker Compose with JDK 21 was used to keep Step 1 executable and testable

## Notes

- Base repository structure exists
- PostgreSQL is available through Docker Compose
- Backend is available in `backend-kotlin/`
- `GET /health` responds with database-backed status when the backend service is running
