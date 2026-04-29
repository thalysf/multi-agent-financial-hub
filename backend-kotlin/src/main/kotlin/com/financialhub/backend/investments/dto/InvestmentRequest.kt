package com.financialhub.backend.investments.dto

import com.financialhub.backend.investments.service.InvestmentCommand
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal

data class InvestmentRequest(
    @field:NotBlank
    val asset: String?,
    @field:NotNull
    @field:DecimalMin(value = "0.0001")
    val quantity: BigDecimal?,
    @field:NotNull
    @field:DecimalMin(value = "0.01")
    val averagePrice: BigDecimal?,
) {
    fun toCommand(): InvestmentCommand =
        InvestmentCommand(
            asset = requireNotNull(asset).trim(),
            quantity = requireNotNull(quantity),
            averagePrice = requireNotNull(averagePrice),
        )
}
