package com.minroamer.trip;

import com.minroamer.api.ApiResponse;
import com.minroamer.common.ApiException;
import com.minroamer.user.User;
import com.minroamer.user.UserRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class SocialController {
    private final TripService trips;
    private final BuddyService buddies;
    private final UserRepository users;

    public SocialController(TripService trips, BuddyService buddies, UserRepository users) {
        this.trips = trips;
        this.buddies = buddies;
        this.users = users;
    }

    @GetMapping("/users/{id}")
    public ApiResponse<PublicProfileResponse> profile(@PathVariable Long id) {
        User user = users.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        return ApiResponse.success(new PublicProfileResponse(id, user.getUsername(), user.getNickname(),
            user.getAvatarUrl(), user.getBio(), trips.publicTrips(id), buddies.byUser(id)));
    }

    @GetMapping("/trips/mine")
    public ApiResponse<List<TripResponse>> mine(Authentication auth) {
        return ApiResponse.success(trips.mine(userId(auth)));
    }

    @PostMapping("/trips")
    public ApiResponse<TripResponse> createTrip(Authentication auth, @Valid @RequestBody TripRequest request) {
        return ApiResponse.success(trips.create(userId(auth), request));
    }

    @GetMapping("/trips/public")
    public ApiResponse<List<TripResponse>> publicTrips() {
        return ApiResponse.success(trips.allPublicTrips());
    }

    @PutMapping("/trips/{tripId}/publish")
    public ApiResponse<TripResponse> publish(Authentication auth, @PathVariable Long tripId) {
        return ApiResponse.success(trips.publish(userId(auth), tripId, true));
    }

    @DeleteMapping("/trips/{tripId}/publish")
    public ApiResponse<TripResponse> unpublish(Authentication auth, @PathVariable Long tripId) {
        return ApiResponse.success(trips.publish(userId(auth), tripId, false));
    }

    @GetMapping("/trips/{tripId}/members")
    public ApiResponse<List<TripMemberResponse>> members(Authentication auth, @PathVariable Long tripId) {
        return ApiResponse.success(trips.listMembers(userId(auth), tripId));
    }

    @PostMapping("/trips/{tripId}/members")
    public ApiResponse<TripResponse> invite(Authentication auth, @PathVariable Long tripId,
                                             @Valid @RequestBody InviteMemberRequest request) {
        return ApiResponse.success(trips.invite(userId(auth), tripId, request.username()));
    }

    @DeleteMapping("/trips/members/{memberId}")
    public ApiResponse<Void> removeMember(Authentication auth, @PathVariable Long memberId) {
        trips.removeMember(userId(auth), memberId);
        return ApiResponse.success(null);
    }

    @GetMapping("/trips/favorites")
    public ApiResponse<List<TripResponse>> favorites(Authentication auth) {
        return ApiResponse.success(trips.favorites(userId(auth)));
    }

    @PostMapping("/trips/{tripId}/favorite")
    public ApiResponse<Void> favorite(Authentication auth, @PathVariable Long tripId) {
        trips.favorite(userId(auth), tripId, true);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/trips/{tripId}/favorite")
    public ApiResponse<Void> unfavorite(Authentication auth, @PathVariable Long tripId) {
        trips.favorite(userId(auth), tripId, false);
        return ApiResponse.success(null);
    }

    @GetMapping("/buddy/mine")
    public ApiResponse<List<BuddyPostResponse>> myBuddyPosts(Authentication auth) {
        return ApiResponse.success(buddies.mine(userId(auth)));
    }

    @PostMapping("/buddy")
    public ApiResponse<BuddyPostResponse> createBuddyPost(Authentication auth,
                                                           @Valid @RequestBody BuddyPostRequest request) {
        return ApiResponse.success(buddies.create(userId(auth), request));
    }

    @DeleteMapping("/buddy/{postId}")
    public ApiResponse<Void> deleteBuddyPost(Authentication auth, @PathVariable Long postId) {
        buddies.delete(userId(auth), postId);
        return ApiResponse.success(null);
    }

    private Long userId(Authentication auth) { return (Long) auth.getPrincipal(); }

    public record PublicProfileResponse(Long id, String username, String nickname, String avatarUrl,
                                        String bio, List<TripResponse> publishedTrips,
                                        List<BuddyPostResponse> buddyPosts) {}
}
