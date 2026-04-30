package com.financialhub.backend.ai.dto

data class AiAnalyzeResponse(
    val agent: String,
    val routedTo: String,
    val routingReason: String,
    val response: String,
    val toolsUsed: List<String>,
    val data: Map<String, Any?>,
)
