package com.minroamer.trip;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record BuddyPostResponse(Long id, Long authorId, String title, String destination,
                                LocalDate travelDate, String description, LocalDateTime createdAt) {
    public static BuddyPostResponse from(BuddyPost post) {
        return new BuddyPostResponse(post.getId(), post.getAuthorId(), post.getTitle(), post.getDestination(),
            post.getTravelDate(), post.getDescription(), post.getCreatedAt());
    }
}
