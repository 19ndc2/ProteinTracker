package com.proteintracker.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proteintracker.model.FoodReference;
import com.proteintracker.repository.FoodReferenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class FoodDataSeeder implements ApplicationRunner {

    private final FoodReferenceRepository foodReferenceRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (foodReferenceRepository.count() > 0) return;

        var resource = new ClassPathResource("data/food_seed.json");
        List<FoodReference> foods = objectMapper.readValue(
                resource.getInputStream(),
                new TypeReference<>() {});
        foodReferenceRepository.saveAll(foods);
        log.info("Seeded {} food reference entries", foods.size());
    }
}
