package com.proteintracker.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Value("${app.elevenlabs.api-key}")
    private String elevenLabsApiKey;

    @Value("${app.elevenlabs.voice-id}")
    private String voiceId;

    @GetMapping("/voice-key")
    public ResponseEntity<Map<String, String>> getVoiceKey() {
        return ResponseEntity.ok(Map.of("apiKey", elevenLabsApiKey, "voiceId", voiceId));
    }
}
