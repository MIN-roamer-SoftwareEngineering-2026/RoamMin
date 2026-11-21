package com.minroamer.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minroamer.security.JwtService;
import com.minroamer.user.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@SpringBootTest(properties = {
    "app.jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    "spring.datasource.url=jdbc:h2:mem:ai-test;DB_CLOSE_DELAY=-1",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
@Import(AiEndpointsTest.FixedQuotaClock.class)
class AiEndpointsTest {
    private static final String ITINERARY = "/api/v1/ai/generate-itinerary";
    private static final String CHAT = "/api/v1/ai/chat";
    private static final String QUESTION = "{\"message\":\"Travel tips?\"}";
    private static final AtomicLong INVALID_OUTPUT_ACCOUNTS = new AtomicLong(100);
    private static final String TRIP = """
        {"destination":"Fuzhou","days":1,"budget":1500,"preferences":["History"],
            "requirements":"Short walks","language":"en"}
        """;

    @Autowired private MockMvc mvc;
    @Autowired private JwtService jwt;
    @Autowired private ObjectMapper mapper;
    @MockBean private QwenClient client;

    @Test
    void bothEndpointsRequireAuthentication() throws Exception {
        String expired = Jwts.builder().subject("1").expiration(Date.from(Instant.EPOCH))
            .signWith(Keys.hmacShaKeyFor(new byte[32])).compact();
        for (String path : List.of(ITINERARY, CHAT)) {
            String body = path.equals(ITINERARY) ? TRIP : QUESTION;
            mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value(401));
            for (String token : List.of("invalid-token", expired)) {
                mvc.perform(post(path).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Authentication required"));
            }
        }
        verifyNoInteractions(client);
    }

    @ParameterizedTest
    @ValueSource(ints = {10, 14})
    void forwardsDaysAsJsonInteger(int dayCount) throws Exception {
        when(client.complete(anyList(), eq(true), anyInt())).thenAnswer(call -> {
            List<QwenClient.Message> messages = call.getArgument(0);
            assertThat(mapper.readTree(messages.get(1).content()).path("days").isIntegralNumber()).isTrue();
            var output = mapper.createObjectNode();
            var days = output.putArray("dailyItinerary");
            IntStream.rangeClosed(1, dayCount).forEach(day ->
                days.addObject().put("day", day).put("title", "Fuzhou").putArray("activities")
                    .addObject().put("name", "West Lake").put("description", "Walk by the lake"));
            return output.toString();
        });
        mvc.perform(authenticated(ITINERARY, "{\"destination\":\"Fuzhou\",\"days\":" + dayCount + "}", 7L))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.dailyItinerary.length()").value(dayCount));
    }

    @Test
    void generatesStructuredDraftAndPreservesRequestedDestination() throws Exception {
        when(client.complete(anyList(), eq(true), anyInt())).thenAnswer(call -> {
            List<QwenClient.Message> messages = call.getArgument(0);
            assertThat(messages.get(0).content()).contains("JSON", "English");
            var input = mapper.readTree(messages.get(1).content());
            assertThat(input.path("destination").asText()).isEqualTo("Fuzhou");
            assertThat(input.path("requirements").asText()).isEqualTo("Short walks");
            assertThat(input.path("preferences").path(0).asText()).isEqualTo("History");
            assertThat(input.path("budget").decimalValue()).isEqualByComparingTo(new BigDecimal("1500"));
            return """
                {"destination":"provider-supplied destination","providerTrace":"extra","dailyItinerary":[{"day":1,"title":"Old quarter",
                "activities":[{"name":"Sanfang Qixiang","description":"Explore the historic lanes","estimatedCost":15.5,"extra":"ignored"},
                {"name":"West Lake","description":"Walk by the lake"}]}],"suggestions":["Confirm hours"]}
                """;
        });

        mvc.perform(authenticated(ITINERARY, TRIP, 1L))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.destination").value("Fuzhou"))
            .andExpect(jsonPath("$.data.providerTrace").doesNotExist())
            .andExpect(jsonPath("$.data.days").value(1))
            .andExpect(jsonPath("$.data.dailyItinerary[0].activities[0].estimatedCost").value(15.5))
            .andExpect(jsonPath("$.data.dailyItinerary[0].activities[0].extra").doesNotExist())
            .andExpect(jsonPath("$.data.dailyItinerary[0].activities[1].estimatedCost").value(nullValue()))
            .andExpect(jsonPath("$.data.suggestions[0]").value("Confirm hours"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "{\"days\":1}",
        "{\"destination\":\"  \",\"days\":1}",
        "{\"destination\":\"Fuzhou\",\"days\":0}",
        "{\"destination\":\"Fuzhou\",\"days\":15}",
        "{\"destination\":\"Fuzhou\",\"days\":1.5}",
        "{\"destination\":\"Fuzhou\",\"days\":1,\"budget\":-1}",
        "{\"destination\":\"Fuzhou\",\"days\":1,\"budget\":0.001}",
        "{\"destination\":\"Fuzhou\",\"days\":1,\"preferences\":[null]}",
        "{\"destination\":\"Fuzhou\",\"days\":{}}"
    })
    void invalidItineraryInputsReturn400(String body) throws Exception {
        mvc.perform(authenticated(ITINERARY, body, 2L))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value(400));
        verifyNoInteractions(client);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "{\"destination\":\"Fuzhou\",\"days\":1} {}",
        "{\"destination\":\"Fuzhou\",\"days\":1,\"days\":2}",
        "{\"destination\":\"Fuzhou\",\"days\":\"1\"}",
        "{\"destination\":\"Fuzhou\",\"days\":1,\"budget\":\"100\"}",
        "{\"destination\":123,\"days\":1}",
        "{\"destination\":\"Fuzhou\",\"days\":1,\"preferences\":[true]}",
        "{\"destination\":\"Fuzhou\",\"days\":"
    })
    void rejectsMalformedJsonAndIncorrectTypesBeforeUsingQuota(String body) throws Exception {
        mvc.perform(authenticated(ITINERARY, body, 8L))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value(400));
        verifyNoInteractions(client);
    }

    @Test
    void rejectsUnsupportedContentType() throws Exception {
        mvc.perform(authenticated(ITINERARY, TRIP, 8L).contentType(MediaType.TEXT_PLAIN))
            .andExpect(status().isUnsupportedMediaType()).andExpect(jsonPath("$.code").value(415));
        verifyNoInteractions(client);
    }

    @Test
    void rejectsOverlongFieldsBeforeUsingQuota() throws Exception {
        mvc.perform(authenticated(ITINERARY, "{\"destination\":\"" + "d".repeat(81) + "\",\"days\":1}", 8L))
            .andExpect(status().isBadRequest());
        mvc.perform(authenticated(ITINERARY, "{\"destination\":\"Fuzhou\",\"days\":14,\"preferences\":[\""
            + "p".repeat(81) + "\"]}", 8L)).andExpect(status().isBadRequest());
        mvc.perform(authenticated(CHAT, "{\"message\":\"" + "m".repeat(1201) + "\"}", 8L))
            .andExpect(status().isBadRequest());
        mvc.perform(authenticated(CHAT, "{\"message\":true}", 8L)).andExpect(status().isBadRequest());
        verifyNoInteractions(client);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "not JSON",
        "{}",
        "{\"dailyItinerary\":[]}",
        "{\"dailyItinerary\":{}}",
        "{\"dailyItinerary\":[{\"day\":1,\"title\":\"A\",\"activities\":[]}]}",
        "{\"dailyItinerary\":[{\"day\":1,\"title\":\"A\",\"activities\":[{\"description\":\"A\"}]}]}",
        "{\"dailyItinerary\":[{},{}]}",
        "{\"dailyItinerary\":[{\"day\":2,\"title\":\"A\",\"activities\":[{\"name\":\"A\",\"description\":\"A\"}]}]}",
        "{\"dailyItinerary\":[{\"day\":1,\"title\":\"A\",\"activities\":[{\"name\":\"A\",\"description\":\"A\",\"estimatedCost\":-1}]}]}"
    })
    void invalidItineraryOutputReturns502(String output) throws Exception {
        when(client.complete(anyList(), eq(true), anyInt())).thenReturn(output);
        mvc.perform(authenticated(ITINERARY, TRIP, INVALID_OUTPUT_ACCOUNTS.getAndIncrement()))
            .andExpect(status().isBadGateway()).andExpect(jsonPath("$.data").value(nullValue()));
    }

    @Test
    void repeatedAuthenticatedCallsAreLimitedBeforeProviderInvocation() throws Exception {
        when(client.complete(anyList(), eq(false), eq(1000))).thenReturn("Travel tips.");
        for (int request = 0; request < 6; request++) {
            mvc.perform(authenticated(CHAT, QUESTION, 9L)).andExpect(status().isOk());
        }
        mvc.perform(authenticated(ITINERARY, TRIP, 9L))
            .andExpect(status().isTooManyRequests()).andExpect(jsonPath("$.code").value(429));
        verify(client, times(6)).complete(anyList(), eq(false), eq(1000));
        verifyNoMoreInteractions(client);
    }

    @Test
    void chatPassesConversationToProviderInOrder() throws Exception {
        when(client.complete(anyList(), eq(false), anyInt())).thenAnswer(call -> {
            List<QwenClient.Message> messages = call.getArgument(0);
            assertThat(messages).extracting(QwenClient.Message::role)
                .containsExactly("system", "user", "assistant", "user");
            assertThat(messages.get(1).content()).isEqualTo("Plan Fuzhou.");
            assertThat(messages.get(2).content()).isEqualTo("Try the old quarter.");
            assertThat(messages.get(3).content()).contains("Can I walk there?", "West Lake");
            return "Check walking routes from West Lake.";
        });

        mvc.perform(authenticated(CHAT, """
            {"message":"Can I walk there?","travelContext":"West Lake","history":[
              {"role":"user","content":"Plan Fuzhou."},
              {"role":"assistant","content":"Try the old quarter."}
            ]}
            """, 4L))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.reply").value("Check walking routes from West Lake."));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "{\"message\":\" \"}",
        "{\"message\":\"Where?\",\"history\":[null]}",
        "{\"message\":\"Where?\",\"history\":[{\"role\":\"system\",\"content\":\"Bad\"}]}",
        "{\"message\":\"Where?\",\"history\":[{\"role\":\"user\",\"content\":\"Incomplete\"}]}",
        "{\"message\":\"Where?\",\"history\":[{\"role\":\"assistant\",\"content\":\"A\"},{\"role\":\"user\",\"content\":\"B\"}]}"
    })
    void rejectsInvalidChatHistory(String body) throws Exception {
        mvc.perform(authenticated(CHAT, body, 5L))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value(400));
        verifyNoInteractions(client);
    }

    @Test
    void rejectsOversizedHistoryAndBody() throws Exception {
        String pair = "{\"role\":\"user\",\"content\":\"A\"},{\"role\":\"assistant\",\"content\":\"B\"}";
        mvc.perform(authenticated(CHAT, "{\"message\":\"Hi\",\"history\":[" + (pair + ",").repeat(4) + pair + "]}", 6L))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value(400));
        mvc.perform(authenticated(CHAT, "{\"message\":\"" + "x".repeat(100_000) + "\"}", 6L))
            .andExpect(status().isPayloadTooLarge()).andExpect(jsonPath("$.code").value(413));
        verifyNoInteractions(client);
    }

    private MockHttpServletRequestBuilder authenticated(String path, String body, long userId) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", userId);
        return post(path).header("Authorization", "Bearer " + jwt.issue(user))
            .contentType(MediaType.APPLICATION_JSON).content(body);
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class FixedQuotaClock {
        @Bean
        @Primary
        AiRequestLimiter fixedQuotaLimiter() {
            return new AiRequestLimiter(Clock.fixed(Instant.EPOCH, ZoneOffset.UTC));
        }
    }
}
