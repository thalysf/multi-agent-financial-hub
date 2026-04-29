package com.financialhub.backend.transactions

import com.financialhub.backend.modules.FinancialModule
import com.financialhub.backend.transactions.service.TransactionCommand
import com.financialhub.backend.transactions.service.TransactionView

interface TransactionModule : FinancialModule {
    override val name: String
        get() = "transactions"

    fun create(command: TransactionCommand): TransactionView

    fun list(): List<TransactionView>

    fun getById(id: Long): TransactionView

    fun update(
        id: Long,
        command: TransactionCommand,
    ): TransactionView

    fun delete(id: Long)
}
