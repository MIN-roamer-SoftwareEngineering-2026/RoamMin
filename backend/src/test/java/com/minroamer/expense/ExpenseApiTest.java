package com.minroamer.expense;

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
    "spring.datasource.url=jdbc:h2:mem:expense-api-test",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
})
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ExpenseApiTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private String owner;
    private String member;
    private String outsider;
    private String tripPath;
    private String otherTripPath;

    @BeforeAll
    void setUp() throws Exception {
        owner = register("expenseowner");
        member = register("expensemember");
        outsider = register("expenseoutsider");
        tripPath = createTrip("Expense trip");
        otherTripPath = createTrip("Other trip");

        mvc.perform(post(tripPath + "/members")
                .header("Authorization", owner)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"username":"expensemember"}
                    """))
            .andExpect(status().isOk());
    }

    @Test
    void ownerAndMemberCanSaveAndReadExpensesForTheirTrip() throws Exception {
        String saved = mvc.perform(post(tripPath + "/expenses")
                .header("Authorization", owner)
                .contentType(MediaType.APPLICATION_JSON)
                .content(request("2850", "2026-11-23")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.amount_cents").value(2850))
            .andReturn().getResponse().getContentAsString();
        long expenseId = json.readTree(saved).path("data").path("id").asLong();

        mvc.perform(post(tripPath + "/expenses")
                .header("Authorization", member)
                .contentType(MediaType.APPLICATION_JSON)
                .content(request("230", "2026-11-24")))
            .andExpect(status().isOk());

        mvc.perform(get(tripPath + "/expenses").header("Authorization", member))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].date").value("2026-11-24"))
            .andExpect(jsonPath("$.data[1].id").value(expenseId))
            .andExpect(jsonPath("$.data[1].amount_cents").value(2850));

        mvc.perform(get(otherTripPath + "/expenses").header("Authorization", owner))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void rejectsNegativeOversizedAndNonIntegerAmounts() throws Exception {
        for (String amount : new String[]{"-1", "0", "2147483648", "999999999999999999999999", "28.50", "\"2850\""}) {
            mvc.perform(post(tripPath + "/expenses")
                    .header("Authorization", owner)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(request(amount, "2026-11-23")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").isNotEmpty());
        }
    }

    @Test
    void deniesOutsiderReadAndWriteAndRequiresAuthentication() throws Exception {
        mvc.perform(get(tripPath + "/expenses").header("Authorization", outsider))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value(404));

        mvc.perform(post(tripPath + "/expenses")
                .header("Authorization", outsider)
                .contentType(MediaType.APPLICATION_JSON)
                .content(request("2850", "2026-11-23")))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value(404));

        mvc.perform(get(tripPath + "/expenses"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value(401));
    }

    private String register(String username) throws Exception {
        String result = mvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"username":"%s","email":"%s@example.test","password":"fixture-password"}
                    """.formatted(username, username)))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return "Bearer " + json.readTree(result).path("data").path("token").asText();
    }

    private String createTrip(String title) throws Exception {
        String result = mvc.perform(post("/api/v1/trips")
                .header("Authorization", owner)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"%s","destination":"Fuzhou"}
                    """.formatted(title)))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
        return "/api/v1/trips/" + json.readTree(result).path("data").path("id").asLong();
    }

    private String request(String amount, String date) {
        return """
            {"title":"Lunch","amount_cents":%s,"category":"food","date":"%s"}
            """.formatted(amount, date);
    }
}
