package com.proteintracker.agent;

public record ProteinEstimate(
        String foodDescription,
        int proteinGrams,
        String confirmationText,
        String date  // ISO YYYY-MM-DD if a date was mentioned, null otherwise
) {}
