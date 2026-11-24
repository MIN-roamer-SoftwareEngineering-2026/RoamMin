package com.minroamer.expense;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record ExpenseRequest(
    @NotBlank @Size(max = 100) String title,
    @JsonProperty("amount_cents") JsonNode amountCents,
    @NotBlank @Pattern(regexp = "transport|lodging|food|ticket|shopping|other") String category,
    @NotNull LocalDate date,
    @Size(max = 500) String note
) {}
