package com.financialhub.backend.investments.exception

import com.financialhub.backend.investments.controller.InvestmentController
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice(assignableTypes = [InvestmentController::class])
class InvestmentExceptionHandler {
    @ExceptionHandler(InvestmentNotFoundException::class)
    fun handleNotFound(exception: InvestmentNotFoundException): ResponseEntity<Map<String, String>> =
        ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("message" to (exception.message ?: "Investment not found")))

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(exception: MethodArgumentNotValidException): ResponseEntity<Map<String, String>> {
        val firstError = exception.bindingResult.fieldErrors.firstOrNull()?.defaultMessage ?: "Invalid request"
        return ResponseEntity.badRequest().body(mapOf("message" to firstError))
    }
}
