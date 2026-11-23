package com.minroamer.ai.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ChatRequest(
    @NotBlank @Size(max = 1200) String message,
    @Size(max = 8) List<@NotNull @Valid Message> history,
    @Size(max = 600) String travelContext,
    @Pattern(regexp = "zh|en") String language
) {
    public record Message(
        @NotNull @Pattern(regexp = "user|assistant") String role,
        @NotBlank @Size(max = 1600) String content
    ) {}
}
