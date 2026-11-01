package com.minroamer.user;

import com.minroamer.common.ApiException;
import com.minroamer.user.dto.ProfileUpdateRequest;
import com.minroamer.user.dto.UserSummaryResponse;
import com.minroamer.user.dto.UserResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public User getEntity(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile(Long id) {
        return UserResponse.from(getEntity(id));
    }

    @Transactional
    public UserResponse updateProfile(Long id, ProfileUpdateRequest request) {
        User user = getEntity(id);
        user.setNickname(request.nickname().trim());
        user.setAvatarUrl(blankToNull(request.avatarUrl()));
        user.setBio(blankToNull(request.bio()));
        user.setLanguage(request.language());
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateAvatar(Long id, String avatarUrl) {
        User user = getEntity(id);
        user.setAvatarUrl(avatarUrl);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> search(String query, Long currentUserId) {
        String normalized = query == null ? "" : query.trim();
        if (normalized.length() < 2) return List.of();
        return userRepository.findTop11ByUsernameContainingIgnoreCaseOrderByUsernameAsc(normalized)
            .stream()
            .filter(user -> !user.getId().equals(currentUserId))
            .map(UserSummaryResponse::from)
            .limit(10)
            .toList();
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
