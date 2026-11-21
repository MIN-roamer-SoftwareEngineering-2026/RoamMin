package com.minroamer.ai;

import com.minroamer.ai.dto.ChatRequest;
import com.minroamer.ai.dto.ItineraryDraft;
import com.minroamer.ai.dto.ItineraryRequest;
import com.minroamer.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/ai", consumes = MediaType.APPLICATION_JSON_VALUE)
class AiController {
    private final AiService service;

    AiController(AiService service) {
        this.service = service;
    }

    @PostMapping("/generate-itinerary")
    ApiResponse<ItineraryDraft> generate(Authentication auth, @Valid @RequestBody ItineraryRequest request) {
        return ApiResponse.success(service.generate((Long) auth.getPrincipal(), request));
    }

    @PostMapping("/chat")
    ApiResponse<ChatResponse> chat(Authentication auth, @Valid @RequestBody ChatRequest request) {
        return ApiResponse.success(new ChatResponse(service.chat((Long) auth.getPrincipal(), request)));
    }

    record ChatResponse(String reply) {}
}
