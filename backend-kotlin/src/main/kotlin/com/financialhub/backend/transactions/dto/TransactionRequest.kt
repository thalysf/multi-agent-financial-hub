package com.financialhub.backend.transactions.dto

import com.financialhub.backend.transactions.domain.TransactionType
import com.financialhub.backend.transactions.service.TransactionCommand
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.LocalDate

data class TransactionRequest(
    @field:NotNull
    val type: TransactionType?,
    @field:NotNull
    @field:DecimalMin(value = "0.01")
    val amount: BigDecimal?,
    @field:NotBlank
    val category: String?,
    @field:NotNull
    val date: LocalDate?,
) {
    fun toCommand(): TransactionCommand =
        TransactionCommand(
            type = requireNotNull(type),
            amount = requireNotNull(amount),
            category = requireNotNull(category).trim(),
            date = requireNotNull(date),
        )
}
