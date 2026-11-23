package com.minroamer.ai.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record ItineraryRequest(
    @NotBlank @Size(max = 80) String destination,
    @NotNull @Min(1) @Max(14) Integer days,
    @DecimalMin("0") @DecimalMax("1000000") @Digits(integer = 7, fraction = 2) BigDecimal budget,
    @Size(max = 6) List<@NotBlank @Size(max = 80) String> preferences,
    @Size(max = 600) String requirements,
    @Pattern(regexp = "zh|en") String language
) {}
