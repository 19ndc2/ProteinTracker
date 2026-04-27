package com.proteintracker.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record ParseRequest(
        @NotBlank String transcript,
        String localDate   // user's local date (YYYY-MM-DD); used so the agent resolves "yesterday" correctly
) {}
