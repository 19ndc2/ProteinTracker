package com.proteintracker.config;

import com.proteintracker.agent.ProteinAgent;
import com.proteintracker.agent.ProteinAgentTools;
import dev.langchain4j.model.mistralai.MistralAiChatModel;
import dev.langchain4j.model.mistralai.internal.api.MistralAiResponseFormatType;
import dev.langchain4j.service.AiServices;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

@Configuration
public class ProteinAgentConfig {

    @Value("${app.mistral.api-key}")
    private String mistralApiKey;

    @Lazy
    @Bean
    public MistralAiChatModel mistralChatModel() {
        return MistralAiChatModel.builder()
                .apiKey(mistralApiKey)
                // mistral-small is blocked (0 req/min) on this workspace's free plan;
                // ministral-8b is allowed. Retries off so a 429 doesn't burn the
                // tight per-minute quota with repeat calls.
                .modelName("ministral-8b-latest")
                .temperature(0.1)
                .maxRetries(0)
                // ministral wraps replies in ```json fences unless JSON mode is on,
                // which would break objectMapper.readValue in ProteinController.
                .responseFormat(MistralAiResponseFormatType.JSON_OBJECT)
                .build();
    }

    @Lazy
    @Bean
    public ProteinAgent proteinAgent(MistralAiChatModel chatModel) {
        return AiServices.builder(ProteinAgent.class)
                .chatLanguageModel(chatModel)
                .build();
    }
}
