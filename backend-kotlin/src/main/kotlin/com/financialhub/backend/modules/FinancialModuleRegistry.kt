package com.financialhub.backend.modules

import org.springframework.stereotype.Component

@Component
class FinancialModuleRegistry(
    private val modules: List<FinancialModule>,
) {
    fun all(): List<FinancialModule> = modules.sortedBy(FinancialModule::name)

    fun findByName(name: String): FinancialModule? = modules.firstOrNull { it.name == name }
}
