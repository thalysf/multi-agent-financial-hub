package com.financialhub.backend.transactions.exception

import com.financialhub.backend.transactions.controller.TransactionController
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice(assignableTypes = [TransactionController::class])
class TransactionExceptionHandler {
    @ExceptionHandler(TransactionNotFoundException::class)
    fun handleNotFound(exception: TransactionNotFoundException): ResponseEntity<Map<String, String>> =
        ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("message" to (exception.message ?: "Transaction not found")))

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(exception: MethodArgumentNotValidException): ResponseEntity<Map<String, String>> {
        val firstError = exception.bindingResult.fieldErrors.firstOrNull()?.defaultMessage ?: "Invalid request"
        return ResponseEntity.badRequest().body(mapOf("message" to firstError))
    }
}
