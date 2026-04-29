package com.financialhub.backend.investments.controller

import com.financialhub.backend.investments.InvestmentModule
import com.financialhub.backend.investments.dto.InvestmentRequest
import com.financialhub.backend.investments.dto.InvestmentResponse
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
@RequestMapping("/investments")
class InvestmentController(
    private val investmentModule: InvestmentModule,
) {
    @PostMapping
    fun create(
        @Valid @RequestBody request: InvestmentRequest,
    ): ResponseEntity<InvestmentResponse> =
        ResponseEntity
            .status(HttpStatus.CREATED)
            .body(InvestmentResponse.fromView(investmentModule.create(request.toCommand())))

    @GetMapping
    fun list(): List<InvestmentResponse> =
        investmentModule
            .list()
            .map(InvestmentResponse::fromView)

    @GetMapping("/{id}")
    fun getById(
        @PathVariable id: Long,
    ): InvestmentResponse = InvestmentResponse.fromView(investmentModule.getById(id))

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: InvestmentRequest,
    ): InvestmentResponse = InvestmentResponse.fromView(investmentModule.update(id, request.toCommand()))

    @DeleteMapping("/{id}")
    fun delete(
        @PathVariable id: Long,
    ): ResponseEntity<Void> {
        investmentModule.delete(id)
        return ResponseEntity.noContent().build()
    }
}
