package com.proteintracker.repository;

import com.proteintracker.model.DailyLog;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyLogRepository extends MongoRepository<DailyLog, String> {
    Optional<DailyLog> findByUserIdAndDate(String userId, LocalDate date);
    List<DailyLog> findByUserIdOrderByDateDesc(String userId);
    List<DailyLog> findByUserIdAndDateBetween(String userId, LocalDate start, LocalDate end);
}
