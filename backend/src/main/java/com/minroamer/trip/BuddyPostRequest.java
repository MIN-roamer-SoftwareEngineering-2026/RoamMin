package com.minroamer.trip;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record BuddyPostRequest(@NotBlank @Size(max = 80) String title,
                               @NotBlank @Size(max = 80) String destination,
                               LocalDate travelDate,
                               @NotBlank @Size(max = 1000) String description) {}
