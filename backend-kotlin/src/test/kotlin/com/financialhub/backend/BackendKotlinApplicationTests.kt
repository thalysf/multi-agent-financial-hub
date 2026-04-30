package com.financialhub.backend

import com.fasterxml.jackson.databind.ObjectMapper
import com.financialhub.backend.investments.InvestmentModule
import com.financialhub.backend.investments.repository.InvestmentRepository
import com.financialhub.backend.modules.FinancialModuleRegistry
import com.financialhub.backend.transactions.TransactionModule
import com.financialhub.backend.transactions.repository.TransactionRepository
import com.sun.net.httpserver.HttpServer
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.net.InetSocketAddress

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(
    properties = [
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "agents.base-url=http://localhost:18080",
    ],
)
class BackendKotlinApplicationTests {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var transactionRepository: TransactionRepository

    @Autowired
    private lateinit var investmentRepository: InvestmentRepository

    @Autowired
    private lateinit var financialModuleRegistry: FinancialModuleRegistry

    @Autowired
    private lateinit var transactionModule: TransactionModule

    @Autowired
    private lateinit var investmentModule: InvestmentModule

    @Test
    fun `ai analyze forwards request to agents service`() {
        val request =
            mapOf(
                "message" to "Analyze my expenses",
            )

        mockMvc
            .perform(
                post("/ai/analyze")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.agent").value("Orchestrator"))
            .andExpect(jsonPath("$.routedTo").value("FinancialAnalyst"))
            .andExpect(jsonPath("$.routingReason").value("test route"))
            .andExpect(jsonPath("$.response").value("test agent response"))
            .andExpect(jsonPath("$.toolsUsed[0]").value("get_transactions"))
    }

    @Test
    fun contextLoads() {
        assertNotNull(transactionModule)
        assertNotNull(investmentModule)
        assertEquals("transactions", transactionModule.name)
        assertEquals("investments", investmentModule.name)
        assertEquals(listOf("investments", "transactions"), financialModuleRegistry.all().map { it.name })
    }

    @Test
    fun `creates and lists transactions`() {
        transactionRepository.deleteAll()

        val request =
            mapOf(
                "type" to "INCOME",
                "amount" to "1200.50",
                "category" to "Salary",
                "date" to "2026-04-28",
            )

        mockMvc
            .perform(
                post("/transactions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)),
            ).andExpect(status().isCreated)
            .andExpect(jsonPath("$.id").isNumber)
            .andExpect(jsonPath("$.type").value("INCOME"))
            .andExpect(jsonPath("$.amount").value(1200.50))
            .andExpect(jsonPath("$.category").value("Salary"))
            .andExpect(jsonPath("$.date").value("2026-04-28"))

        mockMvc
            .perform(get("/transactions"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].type").value("INCOME"))
            .andExpect(jsonPath("$[0].amount").value(1200.50))
            .andExpect(jsonPath("$[0].category").value("Salary"))
            .andExpect(jsonPath("$[0].date").value("2026-04-28"))
    }

    @Test
    fun `investment crud works`() {
        investmentRepository.deleteAll()

        val createRequest =
            mapOf(
                "asset" to "BTC",
                "quantity" to "0.5000",
                "averagePrice" to "300000.00",
            )

        mockMvc
            .perform(
                post("/investments")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createRequest)),
            ).andExpect(status().isCreated)
            .andExpect(jsonPath("$.id").isNumber)
            .andExpect(jsonPath("$.asset").value("BTC"))
            .andExpect(jsonPath("$.quantity").value(0.5))
            .andExpect(jsonPath("$.averagePrice").value(300000.0))

        mockMvc
            .perform(get("/investments"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].asset").value("BTC"))
            .andExpect(jsonPath("$[0].quantity").value(0.5))
            .andExpect(jsonPath("$[0].averagePrice").value(300000.0))

        val investmentId = investmentRepository.findAll().single().id!!

        val updateRequest =
            mapOf(
                "asset" to "BTC",
                "quantity" to "0.7500",
                "averagePrice" to "280000.00",
            )

        mockMvc
            .perform(
                put("/investments/$investmentId")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(updateRequest)),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.asset").value("BTC"))
            .andExpect(jsonPath("$.quantity").value(0.75))
            .andExpect(jsonPath("$.averagePrice").value(280000.0))

        mockMvc
            .perform(get("/investments/$investmentId"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.asset").value("BTC"))
            .andExpect(jsonPath("$.quantity").value(0.75))
            .andExpect(jsonPath("$.averagePrice").value(280000.0))

        mockMvc
            .perform(delete("/investments/$investmentId"))
            .andExpect(status().isNoContent)

        mockMvc
            .perform(get("/investments"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.length()").value(0))
    }

    companion object {
        private lateinit var agentsServer: HttpServer

        @JvmStatic
        @BeforeAll
        fun startAgentsServer() {
            agentsServer = HttpServer.create(InetSocketAddress("localhost", 18080), 0)
            agentsServer.createContext("/analyze") { exchange ->
                val response =
                    """
                    {
                      "agent": "Orchestrator",
                      "routedTo": "FinancialAnalyst",
                      "routingReason": "test route",
                      "response": "test agent response",
                      "toolsUsed": ["get_transactions"],
                      "data": {"transactionCount": 1}
                    }
                    """.trimIndent()

                exchange.responseHeaders.add("Content-Type", "application/json")
                exchange.sendResponseHeaders(200, response.toByteArray().size.toLong())
                exchange.responseBody.use { body ->
                    body.write(response.toByteArray())
                }
            }
            agentsServer.start()
        }

        @JvmStatic
        @AfterAll
        fun stopAgentsServer() {
            agentsServer.stop(0)
        }
    }
}
