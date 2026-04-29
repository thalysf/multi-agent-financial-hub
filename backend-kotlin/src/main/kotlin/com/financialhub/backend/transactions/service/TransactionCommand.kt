package com.financialhub.backend.transactions.service

import com.financialhub.backend.transactions.domain.TransactionType
import java.math.BigDecimal
import java.time.LocalDate

data class TransactionCommand(
    val type: TransactionType,
    val amount: BigDecimal,
    val category: String,
    val date: LocalDate,
)
