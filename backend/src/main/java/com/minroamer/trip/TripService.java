package com.minroamer.trip;

import com.minroamer.common.ApiException;
import com.minroamer.user.User;
import com.minroamer.user.UserRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TripService {
    private final TripRepository trips;
    private final TripMemberRepository members;
    private final TripFavoriteRepository favorites;
    private final UserRepository users;

    public TripService(TripRepository trips, TripMemberRepository members,
                       TripFavoriteRepository favorites, UserRepository users) {
        this.trips = trips;
        this.members = members;
        this.favorites = favorites;
        this.users = users;
    }

    @Transactional
    public TripResponse create(Long ownerId, TripRequest request) {
        validateDates(request.startDate(), request.endDate());
        Trip trip = new Trip();
        trip.setOwnerId(ownerId);
        trip.setTitle(request.title().trim());
        trip.setDestination(request.destination().trim());
        trip.setStartDate(request.startDate());
        trip.setEndDate(request.endDate());
        return TripResponse.from(trips.save(trip));
    }

    @Transactional(readOnly = true)
    public List<TripResponse> mine(Long userId) {
        LinkedHashMap<Long, Trip> result = new LinkedHashMap<>();
        trips.findAllByOwnerIdOrderByCreatedAtDesc(userId).forEach(trip -> result.put(trip.getId(), trip));
        members.findAllByUserId(userId).forEach(member -> trips.findById(member.getTripId())
            .ifPresent(trip -> result.put(trip.getId(), trip)));
        return result.values().stream().map(TripResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<TripResponse> publicTrips(Long ownerId) {
        return trips.findPublicByOwner(ownerId)
            .stream().map(TripResponse::from).toList();
    }

    @Transactional
    public TripResponse publish(Long userId, Long tripId, boolean isPublic) {
        Trip trip = requireTrip(tripId);
        requireOwner(trip, userId);
        trip.setPublic(isPublic);
        return TripResponse.from(trips.save(trip));
    }

    @Transactional
    public TripResponse invite(Long ownerId, Long tripId, String username) {
        Trip trip = requireTrip(tripId);
        requireOwner(trip, ownerId);
        User user = users.findByUsernameIgnoreCase(username.trim())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getId().equals(ownerId)) throw new ApiException(HttpStatus.BAD_REQUEST, "You already own this trip");
        if (members.existsByTripIdAndUserId(tripId, user.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "User is already a trip member");
        }
        TripMember member = new TripMember();
        member.setTripId(tripId);
        member.setUserId(user.getId());
        members.save(member);
        return TripResponse.from(trip);
    }

    @Transactional(readOnly = true)
    public List<TripMemberResponse> listMembers(Long userId, Long tripId) {
        Trip trip = requireTrip(tripId);
        if (!trip.getOwnerId().equals(userId) && !members.existsByTripIdAndUserId(tripId, userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Trip not found");
        }
        List<TripMemberResponse> result = new ArrayList<>();
        result.add(TripMemberResponse.owner(users.findById(trip.getOwnerId()).orElseThrow()));
        members.findAllByTripIdOrderByJoinedAtAsc(tripId).forEach(member ->
            users.findById(member.getUserId()).ifPresent(user -> result.add(TripMemberResponse.member(member, user))));
        return result;
    }

    @Transactional
    public void removeMember(Long ownerId, Long memberId) {
        TripMember member = members.findById(memberId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Trip member not found"));
        requireOwner(requireTrip(member.getTripId()), ownerId);
        members.delete(member);
    }

    @Transactional
    public void favorite(Long userId, Long tripId, boolean add) {
        Trip trip = requireTrip(tripId);
        if (!trip.isPublic() && !trip.getOwnerId().equals(userId) && !members.existsByTripIdAndUserId(tripId, userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Trip not found");
        }
        var existing = favorites.findByTripIdAndUserId(tripId, userId);
        if (add && trip.isPublic() && existing.isEmpty()) {
            TripFavorite favorite = new TripFavorite();
            favorite.setTripId(tripId);
            favorite.setUserId(userId);
            favorites.save(favorite);
        } else if (!add) existing.ifPresent(favorites::delete);
    }

    @Transactional(readOnly = true)
    public List<TripResponse> favorites(Long userId) {
        return favorites.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(favorite -> trips.findById(favorite.getTripId()).orElse(null))
            .filter(trip -> trip != null && trip.isPublic())
            .map(TripResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<TripResponse> allPublicTrips() {
        return trips.findPublicTrips().stream().map(TripResponse::from).toList();
    }

    private Trip requireTrip(Long tripId) {
        return trips.findById(tripId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Trip not found"));
    }
    private void requireOwner(Trip trip, Long userId) {
        if (!trip.getOwnerId().equals(userId)) throw new ApiException(HttpStatus.FORBIDDEN, "Only the trip owner can do this");
    }
    private void validateDates(LocalDate start, LocalDate end) {
        if (start != null && end != null && end.isBefore(start)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "End date cannot be before start date");
        }
    }
}
