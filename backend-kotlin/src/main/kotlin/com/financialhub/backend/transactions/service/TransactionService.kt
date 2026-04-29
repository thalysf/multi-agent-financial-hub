package com.financialhub.backend.transactions.service

import com.financialhub.backend.transactions.TransactionModule
import com.financialhub.backend.transactions.domain.Transaction
import com.financialhub.backend.transactions.exception.TransactionNotFoundException
import com.financialhub.backend.transactions.repository.TransactionRepository
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class TransactionService(
    private val transactionRepository: TransactionRepository,
) : TransactionModule {
    @Transactional
    override fun create(command: TransactionCommand): TransactionView {
        val transaction = Transaction()
        transaction.apply(command)

        return transactionRepository.save(transaction).toView()
    }

    @Transactional(readOnly = true)
    override fun list(): List<TransactionView> =
        transactionRepository
            .findAll(Sort.by(Sort.Order.desc("date"), Sort.Order.desc("id")))
            .map { it.toView() }

    @Transactional(readOnly = true)
    override fun getById(id: Long): TransactionView = findTransaction(id).toView()

    @Transactional
    override fun update(
        id: Long,
        command: TransactionCommand,
    ): TransactionView {
        val transaction = findTransaction(id)
        transaction.apply(command)

        return transactionRepository.save(transaction).toView()
    }

    @Transactional
    override fun delete(id: Long) {
        transactionRepository.delete(findTransaction(id))
    }

    private fun findTransaction(id: Long): Transaction =
        transactionRepository.findById(id).orElseThrow { TransactionNotFoundException(id) }

    private fun Transaction.apply(command: TransactionCommand) {
        type = command.type
        amount = command.amount
        category = command.category
        date = command.date
    }

    private fun Transaction.toView(): TransactionView =
        TransactionView(
            id = checkNotNull(id),
            type = type,
            amount = amount,
            category = category,
            date = date,
        )
}
