package com.financialhub.backend.transactions.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(name = "transactions")
class Transaction(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var type: TransactionType = TransactionType.EXPENSE,
    @Column(nullable = false, precision = 19, scale = 2)
    var amount: BigDecimal = BigDecimal.ZERO,
    @Column(nullable = false)
    var category: String = "",
    @Column(nullable = false)
    var date: LocalDate = LocalDate.now(),
)
