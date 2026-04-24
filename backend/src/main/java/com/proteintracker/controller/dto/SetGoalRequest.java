package com.proteintracker.controller.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record SetGoalRequest(@Min(1) @Max(500) int goalGrams) {}
