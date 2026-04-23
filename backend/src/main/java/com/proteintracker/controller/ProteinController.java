package com.proteintracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.proteintracker.agent.ProteinAgent;
import com.proteintracker.agent.ProteinEstimate;
import com.proteintracker.controller.dto.ConfirmRequest;
import com.proteintracker.controller.dto.ConfirmResponse;
import com.proteintracker.controller.dto.DailyLogResponse;
import com.proteintracker.controller.dto.ParseRequest;
import com.proteintracker.model.DailyLog;
import com.proteintracker.model.FoodEntry;
import com.proteintracker.model.User;
import com.proteintracker.repository.DailyLogRepository;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/protein")
public class ProteinController {

    private final ProteinAgent proteinAgent;
    private final DailyLogRepository dailyLogRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public ProteinController(@Lazy ProteinAgent proteinAgent,
                             DailyLogRepository dailyLogRepository,
                             ObjectMapper objectMapper) {
        this.proteinAgent = proteinAgent;
        this.dailyLogRepository = dailyLogRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/today")
    public ResponseEntity<DailyLogResponse> getToday(@AuthenticationPrincipal User user) {
        DailyLog dailyLog = dailyLogRepository
                .findByUserIdAndDate(user.getId(), LocalDate.now())
                .orElseGet(() -> DailyLog.builder()
                        .userId(user.getId())
                        .date(LocalDate.now())
                        .build());
        return ResponseEntity.ok(new DailyLogResponse(
                dailyLog.getTotalProteinGrams(), dailyLog.getEntries()));
    }

    @GetMapping("/history")
    public ResponseEntity<List<DailyLog>> getHistory(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dailyLogRepository.findByUserIdOrderByDateDesc(user.getId()));
    }

    @PostMapping("/parse")
    public ResponseEntity<?> parse(@Valid @RequestBody ParseRequest request,
                                   @AuthenticationPrincipal User user) {
        try {
            String json = proteinAgent.estimateProtein(request.transcript());
            ProteinEstimate estimate = objectMapper.readValue(json.trim(), ProteinEstimate.class);
            return ResponseEntity.ok(estimate);
        } catch (Exception e) {
            log.error("Agent failed for input: {}", request.transcript(), e);
            return ResponseEntity.unprocessableEntity()
                    .body(Map.of("error", "Could not estimate protein for that input."));
        }
    }

    @PostMapping("/confirm")
    public ResponseEntity<ConfirmResponse> confirm(@Valid @RequestBody ConfirmRequest request,
                                                   @AuthenticationPrincipal User user) {
        DailyLog dailyLog = dailyLogRepository
                .findByUserIdAndDate(user.getId(), LocalDate.now())
                .orElseGet(() -> DailyLog.builder()
                        .userId(user.getId())
                        .date(LocalDate.now())
                        .build());

        FoodEntry entry = FoodEntry.builder()
                .foodDescription(request.foodDescription())
                .proteinGrams(request.proteinGrams())
                .loggedAt(LocalDateTime.now())
                .build();

        dailyLog.addEntry(entry);
        dailyLogRepository.save(dailyLog);

        String ack = String.format("Logged! You've had %d grams of protein today.",
                dailyLog.getTotalProteinGrams());
        return ResponseEntity.ok(new ConfirmResponse(dailyLog.getTotalProteinGrams(), ack));
    }
}
