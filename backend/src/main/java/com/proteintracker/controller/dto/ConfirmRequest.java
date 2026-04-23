package com.proteintracker.controller.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record ConfirmRequest(
        @NotBlank String foodDescription,
        @Min(0) int proteinGrams
) {}
