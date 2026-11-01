package com.minroamer.trip;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record TripRequest(@NotBlank @Size(max = 80) String title,
                          @NotBlank @Size(max = 80) String destination,
                          LocalDate startDate, LocalDate endDate) {}
