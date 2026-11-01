package com.minroamer.trip;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TripFavoriteRepository extends JpaRepository<TripFavorite, Long> {
    List<TripFavorite> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<TripFavorite> findByTripIdAndUserId(Long tripId, Long userId);
}
