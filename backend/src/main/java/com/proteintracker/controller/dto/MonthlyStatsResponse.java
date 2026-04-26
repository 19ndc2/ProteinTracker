package com.proteintracker.controller.dto;

import java.util.List;

public record MonthlyStatsResponse(
        List<DayStat> days,
        int averageProteinGrams,
        int daysLogged
) {
    public record DayStat(String date, int proteinGrams) {}
}
