package com.minroamer.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
    @NotBlank @Size(max = 50) String nickname,
    @Size(max = 255) @Pattern(regexp = "(?i)^(?:|https?://[^\\s]+|/api/v1/users/avatars/[a-f0-9-]{36}\\.(?:png|jpg))$") String avatarUrl,
    @Size(max = 500) String bio,
    @NotBlank @Pattern(regexp = "zh|en") String language
) {}
