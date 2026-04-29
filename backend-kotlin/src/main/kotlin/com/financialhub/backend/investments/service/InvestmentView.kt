package com.financialhub.backend.investments.service

import java.math.BigDecimal

data class InvestmentView(
    val id: Long,
    val asset: String,
    val quantity: BigDecimal,
    val averagePrice: BigDecimal,
)
