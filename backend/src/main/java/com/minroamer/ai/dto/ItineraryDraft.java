package com.minroamer.ai.dto;

import java.math.BigDecimal;
import java.util.List;

public record ItineraryDraft(
    String destination,
    int days,
    List<Day> dailyItinerary,
    List<String> suggestions
) {
    public record Day(int day, String title, List<Activity> activities) {}

    public record Activity(String name, String description, BigDecimal estimatedCost) {}
}
