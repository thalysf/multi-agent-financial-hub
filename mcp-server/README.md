# Financial Hub MCP Server

Python MCP server for Step 5 of the project specification.

## Project layout

The server uses a standard Python `src/` layout:

```text
mcp-server/
|-- pyproject.toml
|-- requirements.txt
|-- src/
|   `-- financial_hub_mcp/
|       |-- server.py
|       |-- tools.py
|       |-- database.py
|       |-- schemas.py
|       `-- config.py
`-- tests/
    `-- smoke_test.py
```

- `server.py` creates and runs the FastMCP server.
- `tools.py` registers the MCP tools.
- `database.py` isolates PostgreSQL access.
- `schemas.py` defines structured tool responses.
- `config.py` reads environment-driven configuration.

## Tools

- `get_transactions`
- `add_transaction`
- `get_investments`

The server connects directly to the PostgreSQL database used by the project so the tools return real data.

## Configuration

Defaults match the root `docker-compose.yml`:

- `MCP_DB_HOST=localhost`
- `MCP_DB_PORT=5432`
- `MCP_DB_NAME=financial_hub`
- `MCP_DB_USER=financial_user`
- `MCP_DB_PASSWORD=financial_pass`
- `MCP_DB_SSLMODE=disable`

Copy `.env.example` into your own environment if you need to override any value.

## Run

```powershell
cd mcp-server
python -m pip install -r requirements.txt
python -m financial_hub_mcp
```

You can also run the installed console script:

```powershell
financial-hub-mcp
```

## Smoke test

The smoke test opens an in-memory MCP client session against the server, creates a real transaction in PostgreSQL, then queries transactions and investments.

```powershell
cd mcp-server
python tests/smoke_test.py
```
