package com.financialhub.backend.ai.client

interface NativeAiClient {
    fun generate(
        systemPrompt: String,
        userPrompt: String,
    ): String
}
