package com.minroamer.trip;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:trip-detail-test",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.main.lazy-initialization=true",
    "app.jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
})
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class TripDetailApiTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private String owner;
    private String member;
    private String outsider;
    private String tripPath;

    @BeforeAll
    void setUp() throws Exception {
        owner = register("detailowner");
        member = register("detailmember");
        outsider = register("detailoutsider");

        String created = mvc.perform(post("/api/v1/trips")
                .header("Authorization", owner)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"Weekend in Fuzhou","destination":"Fuzhou",
                     "startDate":"2026-11-28","endDate":"2026-11-29"}
                    """))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
        tripPath = "/api/v1/trips/" + json.readTree(created).path("data").path("id").asLong();

        mvc.perform(post(tripPath + "/members")
                .header("Authorization", owner)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"username":"detailmember"}
                    """))
            .andExpect(status().isOk());
    }

    @Test
    void ownerAndMemberCanReadTripAndItsMemberCount() throws Exception {
        for (String token : new String[]{owner, member}) {
            mvc.perform(get(tripPath).header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.title").value("Weekend in Fuzhou"))
                .andExpect(jsonPath("$.data.destination").value("Fuzhou"))
                .andExpect(jsonPath("$.data.startDate").value("2026-11-28"))
                .andExpect(jsonPath("$.data.endDate").value("2026-11-29"));

            mvc.perform(get(tripPath + "/members").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].role").value("owner"))
                .andExpect(jsonPath("$.data[1].role").value("member"));
        }
    }

    @Test
    void missingAndInaccessibleTripsReturnNotFound() throws Exception {
        mvc.perform(get(tripPath).header("Authorization", outsider))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value(404));

        mvc.perform(get("/api/v1/trips/9223372036854775807").header("Authorization", owner))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    void detailRequiresAuthentication() throws Exception {
        mvc.perform(get(tripPath))
            .andExpect(status().isUnauthorized());
    }

    private String register(String username) throws Exception {
        String response = mvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"username":"%s","email":"%s@example.test","password":"fixture-password"}
                    """.formatted(username, username)))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return "Bearer " + json.readTree(response).path("data").path("token").asText();
    }
}
