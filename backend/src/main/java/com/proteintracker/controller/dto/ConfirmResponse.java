package com.proteintracker.controller.dto;

public record ConfirmResponse(
        int totalProteinGrams,
        String date,
        String acknowledgementText
) {}
