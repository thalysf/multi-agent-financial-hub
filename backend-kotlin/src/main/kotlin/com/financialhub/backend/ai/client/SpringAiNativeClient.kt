package com.financialhub.backend.ai.client

import io.micrometer.observation.ObservationRegistry
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.model.tool.ToolCallingManager
import org.springframework.ai.openai.OpenAiChatModel
import org.springframework.ai.openai.OpenAiChatOptions
import org.springframework.ai.openai.api.OpenAiApi
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.retry.support.RetryTemplate
import org.springframework.stereotype.Component

@Component
@ConditionalOnProperty(name = ["spring.ai.model.chat"], havingValue = "openai", matchIfMissing = true)
class SpringAiNativeClient(
    @Value("\${spring.ai.openai.api-key}") apiKey: String,
    @Value("\${spring.ai.openai.base-url}") baseUrl: String,
    @Value("\${spring.ai.openai.chat.options.model}") model: String,
    @Value("\${spring.ai.openai.chat.options.temperature}") temperature: Double,
    @Value("\${spring.ai.openai.chat.options.max-tokens}") maxTokens: Int,
) : NativeAiClient {
    private val chatClient: ChatClient =
        ChatClient
            .builder(
                OpenAiChatModel
                    .builder()
                    .openAiApi(
                        OpenAiApi
                            .builder()
                            .baseUrl(baseUrl)
                            .apiKey(apiKey)
                            .build(),
                    ).defaultOptions(
                        OpenAiChatOptions
                            .builder()
                            .model(model)
                            .temperature(temperature)
                            .maxTokens(maxTokens)
                            .build(),
                    ).toolCallingManager(ToolCallingManager.builder().build())
                    .retryTemplate(RetryTemplate.defaultInstance())
                    .observationRegistry(ObservationRegistry.NOOP)
                    .build(),
            ).build()

    override fun generate(
        systemPrompt: String,
        userPrompt: String,
    ): String =
        chatClient
            .prompt()
            .system(systemPrompt)
            .user(userPrompt)
            .call()
            .content()
            ?: throw IllegalStateException("Spring AI returned an empty response")
}
