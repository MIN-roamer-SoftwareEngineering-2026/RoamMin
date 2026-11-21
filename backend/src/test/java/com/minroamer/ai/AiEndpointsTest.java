package com.minroamer.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minroamer.security.JwtService;
import com.minroamer.user.User;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
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
class AiEndpointsTest {
    private static final String ITINERARY = "/api/v1/ai/generate-itinerary";
    private static final String CHAT = "/api/v1/ai/chat";
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
        mvc.perform(post(ITINERARY).contentType(MediaType.APPLICATION_JSON).content(TRIP))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value(401));
        mvc.perform(post(CHAT).header("Authorization", "Bearer invalid-token")
                .contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"Travel tips?\"}"))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.message").value("Authentication required"));
        verifyNoInteractions(client);
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
                {"destination":"provider-supplied destination","dailyItinerary":[{"day":1,"title":"Old quarter",
                "activities":[{"name":"Sanfang Qixiang","description":"Explore the historic lanes","estimatedCost":15.5},
                {"name":"West Lake","description":"Walk by the lake"}]}],"suggestions":["Confirm hours"]}
                """;
        });

        mvc.perform(authenticated(ITINERARY, TRIP, 1L))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.destination").value("Fuzhou"))
            .andExpect(jsonPath("$.data.days").value(1))
            .andExpect(jsonPath("$.data.dailyItinerary[0].activities[0].estimatedCost").value(15.5))
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
        "not JSON",
        "{\"dailyItinerary\":[]}",
        "{\"dailyItinerary\":[{\"day\":2,\"title\":\"A\",\"activities\":[{\"name\":\"A\",\"description\":\"A\"}]}]}",
        "{\"dailyItinerary\":[{\"day\":1,\"title\":\"A\",\"activities\":[{\"name\":\"A\",\"description\":\"A\",\"estimatedCost\":-1}]}]}"
    })
    void invalidItineraryOutputReturns502(String output) throws Exception {
        when(client.complete(anyList(), eq(true), anyInt())).thenReturn(output);
        mvc.perform(authenticated(ITINERARY, TRIP, 3L))
            .andExpect(status().isBadGateway()).andExpect(jsonPath("$.data").value(nullValue()));
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
}
