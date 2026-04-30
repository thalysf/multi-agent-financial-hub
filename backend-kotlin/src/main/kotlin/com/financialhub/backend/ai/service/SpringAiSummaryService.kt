package com.financialhub.backend.ai.service

import com.financialhub.backend.ai.client.NativeAiClient
import com.financialhub.backend.ai.dto.SpringAiSummaryContext
import com.financialhub.backend.ai.dto.SpringAiSummaryResponse
import com.financialhub.backend.investments.InvestmentModule
import com.financialhub.backend.transactions.TransactionModule
import com.financialhub.backend.transactions.domain.TransactionType
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.math.BigDecimal

@Service
class SpringAiSummaryService(
    private val nativeAiClient: NativeAiClient,
    private val transactionModule: TransactionModule,
    private val investmentModule: InvestmentModule,
    @Value("\${spring.ai.openai.chat.options.model}") private val model: String,
) {
    fun summarize(question: String?): SpringAiSummaryResponse {
        val transactions = transactionModule.list()
        val investments = investmentModule.list()
        val incomeTotal =
            transactions
                .filter { it.type == TransactionType.INCOME }
                .fold(BigDecimal.ZERO) { total, transaction -> total + transaction.amount }
        val expenseTotal =
            transactions
                .filter { it.type == TransactionType.EXPENSE }
                .fold(BigDecimal.ZERO) { total, transaction -> total + transaction.amount }
        val investmentCostTotal =
            investments
                .fold(BigDecimal.ZERO) { total, investment -> total + investment.quantity.multiply(investment.averagePrice) }

        val context =
            SpringAiSummaryContext(
                transactionCount = transactions.size,
                investmentCount = investments.size,
                incomeTotal = incomeTotal.toPlainString(),
                expenseTotal = expenseTotal.toPlainString(),
                investmentCostTotal = investmentCostTotal.toPlainString(),
            )

        val response =
            nativeAiClient.generate(
                systemPrompt =
                    """
                    You are the backend-native Spring AI capability for Financial Hub.
                    Use only the provided backend context. Be concise, practical, and do not invent data.
                    """.trimIndent(),
                userPrompt =
                    """
                    User question: ${question?.takeIf { it.isNotBlank() } ?: "Generate a concise financial summary."}

                    Backend context:
                    - Transaction count: ${context.transactionCount}
                    - Investment count: ${context.investmentCount}
                    - Income total: ${context.incomeTotal}
                    - Expense total: ${context.expenseTotal}
                    - Investment cost total: ${context.investmentCostTotal}
                    """.trimIndent(),
            )

        return SpringAiSummaryResponse(
            provider = "groq-via-spring-ai-openai-compatible",
            model = model,
            response = response,
            context = context,
        )
    }
}
