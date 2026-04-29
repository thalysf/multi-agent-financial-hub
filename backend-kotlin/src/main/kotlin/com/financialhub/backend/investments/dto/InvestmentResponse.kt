package com.financialhub.backend.investments.dto

import com.financialhub.backend.investments.service.InvestmentView
import java.math.BigDecimal

data class InvestmentResponse(
    val id: Long,
    val asset: String,
    val quantity: BigDecimal,
    val averagePrice: BigDecimal,
) {
    companion object {
        fun fromView(view: InvestmentView): InvestmentResponse =
            InvestmentResponse(
                id = view.id,
                asset = view.asset,
                quantity = view.quantity,
                averagePrice = view.averagePrice,
            )
    }
}
