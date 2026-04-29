package com.financialhub.backend.transactions.dto

import com.financialhub.backend.transactions.domain.TransactionType
import com.financialhub.backend.transactions.service.TransactionView
import java.math.BigDecimal
import java.time.LocalDate

data class TransactionResponse(
    val id: Long,
    val type: TransactionType,
    val amount: BigDecimal,
    val category: String,
    val date: LocalDate,
) {
    companion object {
        fun fromView(view: TransactionView): TransactionResponse =
            TransactionResponse(
                id = view.id,
                type = view.type,
                amount = view.amount,
                category = view.category,
                date = view.date,
            )
    }
}
