package com.financialhub.backend.ai.service

import com.financialhub.backend.ai.client.AgentsClient
import com.financialhub.backend.ai.dto.AiAnalyzeResponse
import org.springframework.stereotype.Service

@Service
class AiAnalysisService(
    private val agentsClient: AgentsClient,
) {
    fun analyze(message: String): AiAnalyzeResponse =
        agentsClient.analyze(message.trim())
}
