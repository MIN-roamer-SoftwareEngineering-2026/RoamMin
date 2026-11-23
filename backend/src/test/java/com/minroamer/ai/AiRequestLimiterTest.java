package com.minroamer.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.minroamer.common.ApiException;
import java.time.Clock;
import java.time.Instant;
import java.util.function.Supplier;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class AiRequestLimiterTest {
    private final Clock clock = mock(Clock.class);

    @Test
    void perAccountLimitDoesNotBlockAnotherAccountAndResetsNextMinute() {
        when(clock.instant()).thenReturn(Instant.EPOCH);
        var limiter = new AiRequestLimiter(clock);
        for (int request = 0; request < 6; request++) {
            assertThat(limiter.execute(1L, () -> "ok")).isEqualTo("ok");
        }
        assertLimited(limiter, 1L);
        assertThat(limiter.execute(2L, () -> "ok")).isEqualTo("ok");
        when(clock.instant()).thenReturn(Instant.EPOCH.plusSeconds(60));
        assertThat(limiter.execute(1L, () -> "ok")).isEqualTo("ok");
    }

    @Test
    void totalLimitBoundsRequestsFromManyAccounts() {
        when(clock.instant()).thenReturn(Instant.EPOCH);
        var limiter = new AiRequestLimiter(clock);
        for (long account = 1; account <= 30; account++) {
            limiter.execute(account, () -> null);
        }
        assertLimited(limiter, 31L);
    }

    @Test
    void simultaneousWorkIsBoundedAndFailureReleasesCapacity() {
        when(clock.instant()).thenReturn(Instant.EPOCH);
        var limiter = new AiRequestLimiter(clock);
        Supplier<Void> failure = () -> {
            assertLimited(limiter, 5L);
            throw new IllegalStateException("provider failed");
        };
        assertThrows(IllegalStateException.class, () -> limiter.execute(1L, () ->
            limiter.execute(2L, () -> limiter.execute(3L, () -> limiter.execute(4L, failure)))));
        assertThat(limiter.execute(5L, () -> "ok")).isEqualTo("ok");
    }

    private void assertLimited(AiRequestLimiter limiter, long userId) {
        var error = assertThrows(ApiException.class, () -> limiter.execute(userId, () -> {
            throw new AssertionError("A rejected request should not call the provider");
        }));
        assertThat(error.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }
}
