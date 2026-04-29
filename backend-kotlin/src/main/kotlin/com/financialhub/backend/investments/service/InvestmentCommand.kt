package com.financialhub.backend.investments.service

import java.math.BigDecimal

data class InvestmentCommand(
    val asset: String,
    val quantity: BigDecimal,
    val averagePrice: BigDecimal,
)
