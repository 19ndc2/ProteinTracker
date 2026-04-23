package com.proteintracker.controller.dto;

import com.proteintracker.model.FoodEntry;

import java.util.List;

public record DailyLogResponse(
        int totalProteinGrams,
        List<FoodEntry> entries
) {}
