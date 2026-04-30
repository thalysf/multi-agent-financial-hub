package com.financialhub.backend.ai.controller

import com.financialhub.backend.ai.dto.AiAnalyzeRequest
import com.financialhub.backend.ai.dto.AiAnalyzeResponse
import com.financialhub.backend.ai.service.AiAnalysisService
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/ai")
class AiController(
    private val aiAnalysisService: AiAnalysisService,
) {
    @PostMapping("/analyze")
    fun analyze(
        @Valid @RequestBody request: AiAnalyzeRequest,
    ): AiAnalyzeResponse =
        aiAnalysisService.analyze(requireNotNull(request.message))
}
