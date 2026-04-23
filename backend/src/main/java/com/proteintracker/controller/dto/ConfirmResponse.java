package com.proteintracker.controller.dto;

public record ConfirmResponse(
        int totalProteinGramsToday,
        String acknowledgementText
) {}
