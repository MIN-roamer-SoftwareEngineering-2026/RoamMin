package com.minroamer.trip;

import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findAllByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    @Query("select t from Trip t where t.ownerId = :ownerId and t.isPublic = true order by t.createdAt desc")
    List<Trip> findPublicByOwner(@Param("ownerId") Long ownerId);
    @Query("select t from Trip t where t.isPublic = true order by t.createdAt desc")
    List<Trip> findPublicTrips();
}
