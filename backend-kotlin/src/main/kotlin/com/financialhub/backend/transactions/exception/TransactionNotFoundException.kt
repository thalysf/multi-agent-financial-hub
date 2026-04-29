package com.financialhub.backend.transactions.exception

class TransactionNotFoundException(
    id: Long,
) : RuntimeException("Transaction $id not found")
