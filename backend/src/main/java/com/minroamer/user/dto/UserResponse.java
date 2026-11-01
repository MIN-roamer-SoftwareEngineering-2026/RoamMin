package com.minroamer.user.dto;

import com.minroamer.user.User;

public record UserResponse(
    Long id,
    String username,
    String email,
    String nickname,
    String avatarUrl,
    String bio,
    String language
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getNickname(),
            user.getAvatarUrl(),
            user.getBio(),
            user.getLanguage()
        );
    }
}
