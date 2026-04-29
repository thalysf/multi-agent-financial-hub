package com.financialhub.backend.investments.service

import com.financialhub.backend.investments.InvestmentModule
import com.financialhub.backend.investments.domain.Investment
import com.financialhub.backend.investments.exception.InvestmentNotFoundException
import com.financialhub.backend.investments.repository.InvestmentRepository
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class InvestmentService(
    private val investmentRepository: InvestmentRepository,
) : InvestmentModule {
    @Transactional
    override fun create(command: InvestmentCommand): InvestmentView {
        val investment = Investment()
        investment.apply(command)

        return investmentRepository.save(investment).toView()
    }

    @Transactional(readOnly = true)
    override fun list(): List<InvestmentView> =
        investmentRepository
            .findAll(Sort.by(Sort.Order.asc("asset"), Sort.Order.asc("id")))
            .map { it.toView() }

    @Transactional(readOnly = true)
    override fun getById(id: Long): InvestmentView = findInvestment(id).toView()

    @Transactional
    override fun update(
        id: Long,
        command: InvestmentCommand,
    ): InvestmentView {
        val investment = findInvestment(id)
        investment.apply(command)

        return investmentRepository.save(investment).toView()
    }

    @Transactional
    override fun delete(id: Long) {
        investmentRepository.delete(findInvestment(id))
    }

    private fun findInvestment(id: Long): Investment =
        investmentRepository.findById(id).orElseThrow { InvestmentNotFoundException(id) }

    private fun Investment.apply(command: InvestmentCommand) {
        asset = command.asset
        quantity = command.quantity
        averagePrice = command.averagePrice
    }

    private fun Investment.toView(): InvestmentView =
        InvestmentView(
            id = checkNotNull(id),
            asset = asset,
            quantity = quantity,
            averagePrice = averagePrice,
        )
}
