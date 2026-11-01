package com.minroamer.trip;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InviteMemberRequest(@NotBlank @Size(max = 50) String username) {}
