package com.proteintracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "daily_logs")
@CompoundIndex(name = "user_date_idx", def = "{'userId': 1, 'date': 1}", unique = true)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyLog {

    @Id
    private String id;

    private String userId;
    private LocalDate date;

    @Builder.Default
    private List<FoodEntry> entries = new ArrayList<>();

    @Builder.Default
    private int totalProteinGrams = 0;

    public void addEntry(FoodEntry entry) {
        entries.add(entry);
        totalProteinGrams += entry.getProteinGrams();
    }
}
