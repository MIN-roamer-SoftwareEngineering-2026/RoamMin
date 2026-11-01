package com.minroamer.trip;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TripResponse(Long id, Long ownerId, String title, String destination,
                           LocalDate startDate, LocalDate endDate, boolean isPublic,
                           LocalDateTime createdAt) {
    public static TripResponse from(Trip trip) {
        return new TripResponse(trip.getId(), trip.getOwnerId(), trip.getTitle(), trip.getDestination(),
            trip.getStartDate(), trip.getEndDate(), trip.isPublic(), trip.getCreatedAt());
    }
}
