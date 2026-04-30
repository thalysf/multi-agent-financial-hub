package com.financialhub.backend.ai.dto

import jakarta.validation.constraints.NotBlank

data class AiAnalyzeRequest(
    @field:NotBlank
    val message: String?,
)
