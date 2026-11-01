package com.minroamer.user.dto;

import com.minroamer.user.User;

public record UserSummaryResponse(
    Long id,
    String username,
    String nickname,
    String avatarUrl
) {
    public static UserSummaryResponse from(User user) {
        return new UserSummaryResponse(
            user.getId(),
            user.getUsername(),
            user.getNickname(),
            user.getAvatarUrl()
        );
    }
}
