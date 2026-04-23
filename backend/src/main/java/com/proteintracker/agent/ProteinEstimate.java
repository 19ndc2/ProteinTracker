package com.proteintracker.agent;

public record ProteinEstimate(
        String foodDescription,
        int proteinGrams,
        String confirmationText
) {}
