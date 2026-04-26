package com.financialhub.backend.health

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class HealthController(
    private val jdbcTemplate: JdbcTemplate,
) {
    @GetMapping("/health")
    fun health(): ResponseEntity<Map<String, String>> {
        return try {
            jdbcTemplate.queryForObject("select 1", Int::class.java)
            ResponseEntity.ok(
                mapOf(
                    "status" to "UP",
                    "database" to "UP",
                )
            )
        } catch (_: Exception) {
            ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                mapOf(
                    "status" to "DOWN",
                    "database" to "DOWN",
                )
            )
        }
    }
}
