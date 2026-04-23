package com.proteintracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "food_reference")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodReference {

    @Id
    private String id;

    @Indexed
    private String foodName;

    private double proteinPer100g;
    private String servingSize;
    private double proteinPerServing;
}
