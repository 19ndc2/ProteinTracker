package com.proteintracker.auth.dto;

public record UserResponse(
        String userId,
        String email,
        String displayName,
        int dailyGoalGrams
) {}
