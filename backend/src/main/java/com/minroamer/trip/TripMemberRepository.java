package com.minroamer.trip;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TripMemberRepository extends JpaRepository<TripMember, Long> {
    List<TripMember> findAllByTripIdOrderByJoinedAtAsc(Long tripId);
    List<TripMember> findAllByUserId(Long userId);
    Optional<TripMember> findByTripIdAndUserId(Long tripId, Long userId);
    boolean existsByTripIdAndUserId(Long tripId, Long userId);
}
