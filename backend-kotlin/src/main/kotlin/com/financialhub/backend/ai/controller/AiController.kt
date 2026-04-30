package com.financialhub.backend.ai.controller

import com.financialhub.backend.ai.dto.AiAnalyzeRequest
import com.financialhub.backend.ai.dto.AiAnalyzeResponse
import com.financialhub.backend.ai.dto.SpringAiSummaryRequest
import com.financialhub.backend.ai.dto.SpringAiSummaryResponse
import com.financialhub.backend.ai.service.AiAnalysisService
import com.financialhub.backend.ai.service.SpringAiSummaryService
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/ai")
class AiController(
    private val aiAnalysisService: AiAnalysisService,
    private val springAiSummaryService: SpringAiSummaryService,
) {
    @PostMapping("/analyze")
    fun analyze(
        @Valid @RequestBody request: AiAnalyzeRequest,
    ): AiAnalyzeResponse =
        aiAnalysisService.analyze(requireNotNull(request.message))

    @PostMapping("/spring/summary")
    fun springSummary(
        @RequestBody request: SpringAiSummaryRequest,
    ): SpringAiSummaryResponse =
        springAiSummaryService.summarize(request.question)
}
