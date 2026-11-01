package com.minroamer.trip;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BuddyPostRepository extends JpaRepository<BuddyPost, Long> {
    List<BuddyPost> findAllByAuthorIdOrderByCreatedAtDesc(Long authorId);
}
