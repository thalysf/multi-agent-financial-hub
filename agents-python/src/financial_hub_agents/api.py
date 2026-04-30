from fastapi import FastAPI
from pydantic import BaseModel, Field
import uvicorn

from financial_hub_agents.orchestrator import Orchestrator


class AnalyzeRequest(BaseModel):
    message: str = Field(min_length=1)


class HealthResponse(BaseModel):
    status: str


app = FastAPI(title="Financial Hub Agents API")


@app.get("/health")
async def health() -> HealthResponse:
    return HealthResponse(status="UP")


@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    return await Orchestrator().handle(request.message)


def main() -> None:
    uvicorn.run("financial_hub_agents.api:app", host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
