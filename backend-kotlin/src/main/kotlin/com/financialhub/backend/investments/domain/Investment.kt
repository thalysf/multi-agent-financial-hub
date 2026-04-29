package com.financialhub.backend.investments.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal

@Entity
@Table(name = "investments")
class Investment(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
    @Column(nullable = false)
    var asset: String = "",
    @Column(nullable = false, precision = 19, scale = 4)
    var quantity: BigDecimal = BigDecimal.ZERO,
    @Column(nullable = false, precision = 19, scale = 2)
    var averagePrice: BigDecimal = BigDecimal.ZERO,
)
