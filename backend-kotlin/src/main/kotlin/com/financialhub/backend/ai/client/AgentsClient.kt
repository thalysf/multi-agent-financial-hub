package com.financialhub.backend.ai.client

import com.financialhub.backend.ai.dto.AiAnalyzeResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient

@Component
class AgentsClient(
    @Value("\${agents.base-url}") agentsBaseUrl: String,
    restClientBuilder: RestClient.Builder,
) {
    private val restClient: RestClient =
        restClientBuilder
            .baseUrl(agentsBaseUrl)
            .build()

    fun analyze(message: String): AiAnalyzeResponse =
        restClient
            .post()
            .uri("/analyze")
            .body(mapOf("message" to message))
            .retrieve()
            .body(AiAnalyzeResponse::class.java)
            ?: throw IllegalStateException("Agents service returned an empty response")
}
