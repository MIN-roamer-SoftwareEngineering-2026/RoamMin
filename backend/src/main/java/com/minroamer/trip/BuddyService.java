package com.minroamer.trip;

import com.minroamer.common.ApiException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BuddyService {
    private final BuddyPostRepository posts;
    public BuddyService(BuddyPostRepository posts) { this.posts = posts; }

    @Transactional
    public BuddyPostResponse create(Long authorId, BuddyPostRequest request) {
        BuddyPost post = new BuddyPost();
        post.setAuthorId(authorId);
        post.setTitle(request.title().trim());
        post.setDestination(request.destination().trim());
        post.setTravelDate(request.travelDate());
        post.setDescription(request.description().trim());
        return BuddyPostResponse.from(posts.save(post));
    }

    @Transactional(readOnly = true)
    public List<BuddyPostResponse> mine(Long userId) {
        return posts.findAllByAuthorIdOrderByCreatedAtDesc(userId).stream().map(BuddyPostResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<BuddyPostResponse> byUser(Long userId) {
        return mine(userId);
    }

    @Transactional
    public void delete(Long authorId, Long postId) {
        BuddyPost post = posts.findById(postId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Buddy post not found"));
        if (!post.getAuthorId().equals(authorId)) throw new ApiException(HttpStatus.FORBIDDEN, "Cannot delete another user's post");
        posts.delete(post);
    }
}
