package com.proteintracker.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record ParseRequest(@NotBlank String transcript) {}
