package com.minroamer.ai;

import com.minroamer.common.ApiException;
import java.time.Clock;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
class AiRequestLimiter {
    private static final int ACCOUNT_LIMIT = 6;
    private static final int TOTAL_LIMIT = 30;
    private static final int CONCURRENT_LIMIT = 4;

    private final Clock clock;
    private final Map<Long, Integer> accountRequests = new HashMap<>();
    private long window = -1;
    private int totalRequests;
    private int activeRequests;

    AiRequestLimiter() {
        this(Clock.systemUTC());
    }

    AiRequestLimiter(Clock clock) {
        this.clock = clock;
    }

    <T> T execute(Long userId, Supplier<T> operation) {
        acquire(userId);
        try {
            return operation.get();
        } finally {
            release();
        }
    }

    private synchronized void acquire(Long userId) {
        long minute = clock.instant().getEpochSecond() / 60;
        if (minute != window) {
            window = minute;
            totalRequests = 0;
            accountRequests.clear();
        }

        int requests = accountRequests.getOrDefault(userId, 0);
        if (requests >= ACCOUNT_LIMIT || totalRequests >= TOTAL_LIMIT || activeRequests >= CONCURRENT_LIMIT) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "AI request limit reached. Wait before retrying.");
        }
        accountRequests.put(userId, requests + 1);
        totalRequests++;
        activeRequests++;
    }

    private synchronized void release() {
        activeRequests--;
    }
}
