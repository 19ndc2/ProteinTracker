package com.proteintracker.agent;

import com.proteintracker.repository.FoodReferenceRepository;
import dev.langchain4j.agent.tool.Tool;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProteinAgentTools {

    private final FoodReferenceRepository foodReferenceRepository;

    @Tool("Look up protein content for a food item in the database. Returns null if not found.")
    public FoodReferenceResult lookUpProtein(String foodName) {
        return foodReferenceRepository.findByFoodNameIgnoreCase(foodName)
                .map(ref -> new FoodReferenceResult(
                        ref.getFoodName(),
                        ref.getProteinPer100g(),
                        ref.getServingSize(),
                        ref.getProteinPerServing()))
                .orElse(null);
    }
}
