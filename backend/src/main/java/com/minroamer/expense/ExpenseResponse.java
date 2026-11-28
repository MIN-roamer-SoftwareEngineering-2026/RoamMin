package com.minroamer.expense;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;

public record ExpenseResponse(
    Long id,
    String title,
    @JsonProperty("amount_cents") int amountCents,
    String category,
    LocalDate date,
    @JsonInclude(JsonInclude.Include.NON_NULL) String note
) {}
