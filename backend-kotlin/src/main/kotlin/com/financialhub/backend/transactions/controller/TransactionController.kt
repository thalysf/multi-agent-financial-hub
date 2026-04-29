package com.financialhub.backend.transactions.controller

import com.financialhub.backend.transactions.TransactionModule
import com.financialhub.backend.transactions.dto.TransactionRequest
import com.financialhub.backend.transactions.dto.TransactionResponse
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/transactions")
class TransactionController(
    private val transactionModule: TransactionModule,
) {
    @PostMapping
    fun create(
        @Valid @RequestBody request: TransactionRequest,
    ): ResponseEntity<TransactionResponse> =
        ResponseEntity
            .status(HttpStatus.CREATED)
            .body(TransactionResponse.fromView(transactionModule.create(request.toCommand())))

    @GetMapping
    fun list(): List<TransactionResponse> =
        transactionModule
            .list()
            .map(TransactionResponse::fromView)

    @GetMapping("/{id}")
    fun getById(
        @PathVariable id: Long,
    ): TransactionResponse = TransactionResponse.fromView(transactionModule.getById(id))

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: TransactionRequest,
    ): TransactionResponse = TransactionResponse.fromView(transactionModule.update(id, request.toCommand()))

    @DeleteMapping("/{id}")
    fun delete(
        @PathVariable id: Long,
    ): ResponseEntity<Void> {
        transactionModule.delete(id)
        return ResponseEntity.noContent().build()
    }
}
