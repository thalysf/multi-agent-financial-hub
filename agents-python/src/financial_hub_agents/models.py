from typing import Literal

from pydantic import BaseModel, Field


AgentName = Literal["Orchestrator", "FinancialAnalyst", "InvestmentAdvisor"]


class AgentResponse(BaseModel):
    agent: AgentName
    tools_used: list[str] = Field(default_factory=list)
    response: str
    data: dict


class OrchestratorResponse(BaseModel):
    agent: Literal["Orchestrator"] = "Orchestrator"
    routed_to: Literal["FinancialAnalyst", "InvestmentAdvisor"]
    routing_reason: str
    response: str
    tools_used: list[str]
    data: dict
