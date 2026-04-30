package com.financialhub.backend.ai.dto

data class SpringAiSummaryResponse(
    val provider: String,
    val model: String,
    val response: String,
    val context: SpringAiSummaryContext,
)

data class SpringAiSummaryContext(
    val transactionCount: Int,
    val investmentCount: Int,
    val incomeTotal: String,
    val expenseTotal: String,
    val investmentCostTotal: String,
)
