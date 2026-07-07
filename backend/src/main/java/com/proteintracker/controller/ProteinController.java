package com.proteintracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.proteintracker.agent.ProteinAgent;
import com.proteintracker.agent.ProteinEstimate;
import com.proteintracker.controller.dto.ConfirmRequest;
import com.proteintracker.controller.dto.ConfirmResponse;
import com.proteintracker.controller.dto.DailyLogResponse;
import com.proteintracker.controller.dto.MonthlyStatsResponse;
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
    public ResponseEntity<DailyLogResponse> getToday(@RequestParam(required = false) String date,
                                                      @AuthenticationPrincipal User user) {
        LocalDate localDate = (date != null && !date.isBlank()) ? LocalDate.parse(date) : LocalDate.now();
        DailyLog dailyLog = dailyLogRepository
                .findByUserIdAndDate(user.getId(), localDate)
                .orElseGet(() -> DailyLog.builder()
                        .userId(user.getId())
                        .date(localDate)
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
            String today = (request.localDate() != null && !request.localDate().isBlank())
                    ? request.localDate()
                    : LocalDate.now().toString();
            String json = proteinAgent.estimateProtein(request.transcript(), today);
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
        LocalDate date = (request.date() != null && !request.date().isBlank())
                ? LocalDate.parse(request.date())
                : LocalDate.now();

        DailyLog dailyLog = dailyLogRepository
                .findByUserIdAndDate(user.getId(), date)
                .orElseGet(() -> DailyLog.builder()
                        .userId(user.getId())
                        .date(date)
                        .build());

        FoodEntry entry = FoodEntry.builder()
                .foodDescription(request.foodDescription())
                .proteinGrams(request.proteinGrams())
                .loggedAt(LocalDateTime.now())
                .build();

        dailyLog.addEntry(entry);
        dailyLogRepository.save(dailyLog);

        String ack = String.format("Logged! You've had %d grams of protein on %s.",
                dailyLog.getTotalProteinGrams(), date);
        return ResponseEntity.ok(new ConfirmResponse(
                dailyLog.getTotalProteinGrams(), date.toString(), ack));
    }

    @GetMapping("/stats/monthly")
    public ResponseEntity<MonthlyStatsResponse> getMonthlyStats(@AuthenticationPrincipal User user) {
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(29);

        List<MonthlyStatsResponse.DayStat> days = dailyLogRepository
                .findByUserIdAndDateBetween(user.getId(), start, today)
                .stream()
                .sorted(java.util.Comparator.comparing(DailyLog::getDate))
                .map(log -> new MonthlyStatsResponse.DayStat(
                        log.getDate().toString(), log.getTotalProteinGrams()))
                .toList();

        int average = days.isEmpty() ? 0
                : (int) Math.round(days.stream().mapToInt(MonthlyStatsResponse.DayStat::proteinGrams).average().orElse(0));

        return ResponseEntity.ok(new MonthlyStatsResponse(days, average, days.size()));
    }

    @DeleteMapping("/entry/{date}/{entryId}")
    public ResponseEntity<?> deleteEntry(@PathVariable String date,
                                         @PathVariable String entryId,
                                         @AuthenticationPrincipal User user) {
        LocalDate localDate = LocalDate.parse(date);
        return dailyLogRepository.findByUserIdAndDate(user.getId(), localDate)
                .map(log -> {
                    if (!log.removeEntry(entryId)) {
                        return ResponseEntity.notFound().build();
                    }
                    dailyLogRepository.save(log);
                    return ResponseEntity.ok(new DailyLogResponse(
                            log.getTotalProteinGrams(), log.getEntries()));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
