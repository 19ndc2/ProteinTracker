package com.proteintracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodEntry {
    @Builder.Default
    private String id = UUID.randomUUID().toString();
    private String foodDescription;
    private int proteinGrams;
    @Builder.Default
    private LocalDateTime loggedAt = LocalDateTime.now();
}
