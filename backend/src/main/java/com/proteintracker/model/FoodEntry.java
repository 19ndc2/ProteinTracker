package com.proteintracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodEntry {
    private String foodDescription;
    private int proteinGrams;
    @Builder.Default
    private LocalDateTime loggedAt = LocalDateTime.now();
}
