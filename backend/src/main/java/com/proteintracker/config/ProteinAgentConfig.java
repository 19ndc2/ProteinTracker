package com.proteintracker.config;

import com.proteintracker.agent.ProteinAgent;
import com.proteintracker.agent.ProteinAgentTools;
import dev.langchain4j.model.mistralai.MistralAiChatModel;
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
                .modelName("mistral-small-latest")
                .temperature(0.1)
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
