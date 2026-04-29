package com.financialhub.backend.investments.repository

import com.financialhub.backend.investments.domain.Investment
import org.springframework.data.jpa.repository.JpaRepository

interface InvestmentRepository : JpaRepository<Investment, Long>
