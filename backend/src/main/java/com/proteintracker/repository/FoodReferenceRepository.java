package com.proteintracker.repository;

import com.proteintracker.model.FoodReference;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface FoodReferenceRepository extends MongoRepository<FoodReference, String> {
    Optional<FoodReference> findByFoodNameIgnoreCase(String foodName);
}
