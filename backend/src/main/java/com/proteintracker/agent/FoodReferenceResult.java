package com.proteintracker.agent;

public record FoodReferenceResult(
        String foodName,
        double proteinPer100g,
        String servingSize,
        double proteinPerServing
) {}
