package com.minroamer.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minroamer.common.ApiException;
import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.springframework.http.HttpStatus;

class QwenClientTest {
    private static final String ENDPOINT = "https://model.example/compatible-mode/v1/chat/completions";
    private static final List<QwenClient.Message> MESSAGES = List.of(new QwenClient.Message("user", "Hello"));
    private final HttpClient http = mock(HttpClient.class);

    @Test
    void extractsTheFirstCompletedAssistantMessage() {
        respond(200, """
            {"choices":[{"finish_reason":"stop","message":{"role":"assistant","content":"Try the train."}}]}
            """);
        assertThat(client(ENDPOINT, "test-key").complete(MESSAGES, false, 100)).isEqualTo("Try the train.");

        var request = ArgumentCaptor.forClass(HttpRequest.class);
        verify(http).sendAsync(request.capture(), ArgumentMatchers.<HttpResponse.BodyHandler<String>>any());
        assertThat(request.getValue().uri()).hasToString(ENDPOINT);
        assertThat(request.getValue().method()).isEqualTo("POST");
        assertThat(request.getValue().headers().firstValue("Authorization")).contains("Bearer test-key");
    }

    @Test
    void cancelsATimedOutRequest() {
        var pending = new CompletableFuture<HttpResponse<String>>();
        when(http.sendAsync(any(), ArgumentMatchers.<HttpResponse.BodyHandler<String>>any())).thenReturn(pending);
        var client = new QwenClient(new ObjectMapper(), ENDPOINT, "model", "test-key", Duration.ofMillis(10), http);
        var error = assertThrows(ApiException.class, () -> client.complete(MESSAGES, true, 100));
        assertThat(error.getStatus()).isEqualTo(HttpStatus.GATEWAY_TIMEOUT);
        assertThat(pending).isCancelled();
    }

    @Test
    void mapsConnectionFailuresWithoutExposingDetails() {
        when(http.sendAsync(any(), ArgumentMatchers.<HttpResponse.BodyHandler<String>>any()))
            .thenReturn(CompletableFuture.failedFuture(new IOException("private transport details")));
        var error = assertThrows(ApiException.class, () -> client(ENDPOINT, "test-key").complete(MESSAGES, false, 100));
        assertThat(error.getStatus()).isEqualTo(HttpStatus.BAD_GATEWAY);
        assertThat(error.getMessage()).doesNotContain("private transport details");
    }

    @ParameterizedTest
    @ValueSource(ints = {401, 429, 500, 504})
    void mapsProviderErrorsWithoutExposingTheResponse(int status) {
        respond(status, "{\"error\":\"sensitive upstream details\"}");
        var error = assertThrows(ApiException.class, () -> client(ENDPOINT, "test-key").complete(MESSAGES, false, 100));
        int expected = switch (status) {
            case 429, 504 -> status;
            default -> 502;
        };
        assertThat(error.getStatus().value()).isEqualTo(expected);
        assertThat(error.getMessage()).doesNotContain("sensitive upstream details", "test-key");
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "not JSON",
        "{\"choices\":[]}",
        "{\"choices\":[{\"finish_reason\":\"length\",\"message\":{\"content\":\"truncated\"}}]}"
    })
    void rejectsMalformedOrTruncatedCompletions(String body) {
        respond(200, body);
        var error = assertThrows(ApiException.class, () -> client(ENDPOINT, "test-key").complete(MESSAGES, false, 100));
        assertThat(error.getStatus()).isEqualTo(HttpStatus.BAD_GATEWAY);
    }

    @Test
    void missingKeyAndPlainHttpFailWithoutAnyProviderRequest() {
        for (QwenClient client : List.of(client(ENDPOINT, ""), client("http://model.example", "test-key"))) {
            var error = assertThrows(ApiException.class, () -> client.complete(MESSAGES, false, 100));
            assertThat(error.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        }
        verifyNoInteractions(http);
    }

    private QwenClient client(String endpoint, String key) {
        return new QwenClient(new ObjectMapper(), endpoint, "model", key, Duration.ofSeconds(1), http);
    }

    @SuppressWarnings("unchecked")
    private void respond(int status, String body) {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(status);
        when(response.body()).thenReturn(body);
        when(http.sendAsync(any(), ArgumentMatchers.<HttpResponse.BodyHandler<String>>any()))
            .thenReturn(CompletableFuture.completedFuture(response));
    }
}
