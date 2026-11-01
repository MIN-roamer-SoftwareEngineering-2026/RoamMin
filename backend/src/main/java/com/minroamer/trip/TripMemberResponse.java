package com.minroamer.trip;

import com.minroamer.user.User;
import java.time.LocalDateTime;

public record TripMemberResponse(Long id, Long userId, String username, String nickname,
                                 String avatarUrl, String role, LocalDateTime joinedAt) {
    public static TripMemberResponse owner(User user) {
        return new TripMemberResponse(null, user.getId(), user.getUsername(), user.getNickname(),
            user.getAvatarUrl(), "owner", null);
    }
    public static TripMemberResponse member(TripMember member, User user) {
        return new TripMemberResponse(member.getId(), user.getId(), user.getUsername(), user.getNickname(),
            user.getAvatarUrl(), "member", member.getJoinedAt());
    }
}
