package com.financialhub.backend.ai.exception

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.client.RestClientException

@RestControllerAdvice
class AiExceptionHandler {
    @ExceptionHandler(RestClientException::class)
    fun handleAgentsServiceError(exception: RestClientException): ResponseEntity<Map<String, String>> =
        ResponseEntity
            .status(HttpStatus.BAD_GATEWAY)
            .body(
                mapOf(
                    "error" to "Agents service is unavailable",
                    "details" to (exception.message ?: "Unknown upstream error"),
                ),
            )
}
