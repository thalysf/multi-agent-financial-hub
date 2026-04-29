package com.financialhub.backend.investments

import com.financialhub.backend.investments.service.InvestmentCommand
import com.financialhub.backend.investments.service.InvestmentView
import com.financialhub.backend.modules.FinancialModule

interface InvestmentModule : FinancialModule {
    override val name: String
        get() = "investments"

    fun create(command: InvestmentCommand): InvestmentView

    fun list(): List<InvestmentView>

    fun getById(id: Long): InvestmentView

    fun update(
        id: Long,
        command: InvestmentCommand,
    ): InvestmentView

    fun delete(id: Long)
}
