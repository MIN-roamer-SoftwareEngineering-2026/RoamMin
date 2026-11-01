package com.minroamer.user;

import com.minroamer.api.ApiResponse;
import com.minroamer.user.dto.ProfileUpdateRequest;
import com.minroamer.user.dto.UserSummaryResponse;
import com.minroamer.user.dto.UserResponse;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    private final UserService userService;
    private final AvatarStorageService avatarStorageService;

    public UserController(UserService userService, AvatarStorageService avatarStorageService) {
        this.userService = userService;
        this.avatarStorageService = avatarStorageService;
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UserResponse> uploadAvatar(
        Authentication authentication,
        @RequestParam("file") MultipartFile file
    ) throws IOException {
        String avatarUrl = avatarStorageService.store(file);
        return ApiResponse.success(
            userService.updateAvatar((Long) authentication.getPrincipal(), avatarUrl)
        );
    }

    @GetMapping("/avatars/{filename:.+}")
    public ResponseEntity<Resource> getAvatar(@PathVariable String filename) throws IOException {
        AvatarStorageService.StoredAvatar avatar = avatarStorageService.load(filename);
        return ResponseEntity.ok()
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
            .header("X-Content-Type-Options", "nosniff")
            .contentType(avatar.mediaType())
            .body(avatar.resource());
    }

    @PutMapping("/me")
    public ApiResponse<UserResponse> updateProfile(
        Authentication authentication,
        @Valid @RequestBody ProfileUpdateRequest request
    ) {
        return ApiResponse.success(
            userService.updateProfile((Long) authentication.getPrincipal(), request)
        );
    }

    @GetMapping("/search")
    public ApiResponse<List<UserSummaryResponse>> search(
        Authentication authentication,
        @RequestParam(defaultValue = "") String q
    ) {
        return ApiResponse.success(userService.search(q, (Long) authentication.getPrincipal()));
    }
}
