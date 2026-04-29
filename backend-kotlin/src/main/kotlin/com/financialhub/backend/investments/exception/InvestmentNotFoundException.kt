package com.financialhub.backend.investments.exception

class InvestmentNotFoundException(
    id: Long,
) : RuntimeException("Investment $id not found")
