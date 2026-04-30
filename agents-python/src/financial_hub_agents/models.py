from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


AgentName = Literal["Orchestrator", "FinancialAnalyst", "InvestmentAdvisor"]


class AgentResponse(BaseModel):
    agent: AgentName
    tools_used: list[str] = Field(default_factory=list)
    response: str
    data: dict


class OrchestratorResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    agent: Literal["Orchestrator"] = "Orchestrator"
    routed_to: Literal["FinancialAnalyst", "InvestmentAdvisor"] = Field(alias="routedTo")
    routing_reason: str = Field(alias="routingReason")
    response: str
    tools_used: list[str] = Field(alias="toolsUsed")
    data: dict
