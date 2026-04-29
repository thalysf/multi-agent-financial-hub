package com.financialhub.backend.transactions.repository

import com.financialhub.backend.transactions.domain.Transaction
import org.springframework.data.jpa.repository.JpaRepository

interface TransactionRepository : JpaRepository<Transaction, Long>
