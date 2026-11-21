package com.minroamer.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import com.minroamer.common.ApiException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
class QwenClient {
    private final ObjectMapper mapper;
    private final ObjectReader reader;
    private final HttpClient http;
    private final String endpoint;
    private final String model;
    private final String apiKey;
    private final Duration timeout;

    @Autowired
    QwenClient(
        ObjectMapper mapper,
        @Value("${app.ai.qwen.endpoint}") String endpoint,
        @Value("${app.ai.qwen.model}") String model,
        @Value("${app.ai.qwen.api-key}") String apiKey,
        @Value("${app.ai.qwen.timeout}") Duration timeout
    ) {
        this(mapper, endpoint, model, apiKey, timeout, HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build());
    }

    QwenClient(ObjectMapper mapper, String endpoint, String model, String apiKey, Duration timeout, HttpClient http) {
        this.mapper = mapper;
        this.reader = mapper.reader().with(DeserializationFeature.FAIL_ON_TRAILING_TOKENS);
        this.endpoint = endpoint;
        this.model = model;
        this.apiKey = apiKey;
        this.timeout = timeout;
        this.http = http;
    }

    String complete(List<Message> messages, boolean json, int maxTokens) {
        HttpRequest request = buildRequest(messages, json, maxTokens);
        var pending = http.sendAsync(request, HttpResponse.BodyHandlers.ofString());
        HttpResponse<String> response;
        try {
            response = pending.get(timeout.toMillis(), TimeUnit.MILLISECONDS);
        } catch (TimeoutException exception) {
            pending.cancel(true);
            throw timeout();
        } catch (InterruptedException exception) {
            pending.cancel(true);
            Thread.currentThread().interrupt();
            throw unavailable();
        } catch (ExecutionException exception) {
            if (exception.getCause() instanceof HttpTimeoutException) throw timeout();
            throw unavailable();
        }

        if (response.statusCode() == 429) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "AI provider quota reached. Wait before retrying.");
        }
        if (response.statusCode() == 408 || response.statusCode() == 504) throw timeout();
        if (response.statusCode() < 200 || response.statusCode() >= 300) throw unavailable();

        try {
            var choice = reader.readTree(response.body()).path("choices").path(0);
            var content = choice.path("message").path("content");
            if ("stop".equals(choice.path("finish_reason").asText()) && content.isTextual()
                && !content.textValue().isBlank()) {
                return content.textValue().strip();
            }
        } catch (JsonProcessingException exception) {
            throw invalidOutput();
        }
        throw invalidOutput();
    }

    private HttpRequest buildRequest(List<Message> messages, boolean json, int maxTokens) {
        if (endpoint.isBlank() || model.isBlank() || apiKey.isBlank()
            || timeout.compareTo(Duration.ofMillis(1)) < 0 || timeout.compareTo(Duration.ofSeconds(60)) > 0) {
            throw configurationError();
        }

        var body = mapper.createObjectNode()
            .put("model", model)
            .put("stream", false)
            .put("enable_thinking", false)
            .put("max_tokens", maxTokens);
        body.set("messages", mapper.valueToTree(messages));
        if (json) body.putObject("response_format").put("type", "json_object");

        try {
            URI uri = URI.create(endpoint);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null) {
                throw configurationError();
            }
            return HttpRequest.newBuilder(uri)
                .timeout(timeout)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .build();
        } catch (IllegalArgumentException exception) {
            throw configurationError();
        }
    }

    static ApiException invalidOutput() {
        return new ApiException(HttpStatus.BAD_GATEWAY, "AI returned an incomplete or invalid response. Try again.");
    }

    private static ApiException unavailable() {
        return new ApiException(HttpStatus.BAD_GATEWAY, "AI provider is unavailable. Try again later.");
    }

    private static ApiException timeout() {
        return new ApiException(HttpStatus.GATEWAY_TIMEOUT, "AI provider took too long to respond. Try again.");
    }

    private static ApiException configurationError() {
        return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI service is not configured.");
    }

    record Message(String role, String content) {}
}
