package com.minroamer.trip;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.minroamer.security.JwtService;
import com.minroamer.user.User;
import com.minroamer.user.UserRepository;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
    "app.jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    "spring.datasource.url=jdbc:h2:mem:trip-invite-test;DB_CLOSE_DELAY=-1",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
class TripInviteTest {
    private static final String TRIPS = "/api/v1/trips";

    @Autowired private MockMvc mvc;
    @Autowired private JwtService jwt;
    @Autowired private UserRepository users;
    @Autowired private TripRepository trips;
    @Autowired private TripMemberRepository members;
    @Autowired private ObjectMapper mapper;

    private User owner;
    private User guest;
    private User outsider;
    private String ownerToken;
    private String guestToken;

    @BeforeEach
    void setUp() {
        members.deleteAll();
        trips.deleteAll();
        users.deleteAll();
        owner = saveUser("invite_owner");
        guest = saveUser("invite_guest");
        outsider = saveUser("invite_outsider");
        ownerToken = jwt.issue(owner);
        guestToken = jwt.issue(guest);
    }

    @Test
    void ownerInvitesMemberAndMemberSeesTheSameTrip() throws Exception {
        long tripId = createPrivateTrip(ownerToken);

        mvc.perform(post(TRIPS + "/" + tripId + "/members")
                .header("Authorization", "Bearer " + ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(inviteBody(guest.getUsername())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(tripId));

        mvc.perform(get(TRIPS + "/" + tripId + "/members")
                .header("Authorization", "Bearer " + ownerToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].role").value("owner"))
            .andExpect(jsonPath("$.data[1].role").value("member"))
            .andExpect(jsonPath("$.data[1].username").value(guest.getUsername()));

        mvc.perform(get(TRIPS + "/mine").header("Authorization", "Bearer " + guestToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].id").value(tripId))
            .andExpect(jsonPath("$.data[0].ownerId").value(owner.getId()));

        assertThat(members.findAllByTripIdOrderByJoinedAtAsc(tripId)).hasSize(1);
    }

    @Test
    void duplicateInviteReturnsConflictAndKeepsOneMembership() throws Exception {
        long tripId = createPrivateTrip(ownerToken);
        invite(ownerToken, tripId, guest.getUsername());

        mvc.perform(post(TRIPS + "/" + tripId + "/members")
                .header("Authorization", "Bearer " + ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(inviteBody(guest.getUsername())))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value(409))
            .andExpect(jsonPath("$.message").value("User is already a trip member"));

        mvc.perform(get(TRIPS + "/" + tripId + "/members")
                .header("Authorization", "Bearer " + ownerToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(2));

        assertThat(members.findAllByTripIdOrderByJoinedAtAsc(tripId)).hasSize(1);
    }

    @Test
    void nonOwnerCannotInvite() throws Exception {
        long tripId = createPrivateTrip(ownerToken);
        invite(ownerToken, tripId, guest.getUsername());

        mvc.perform(post(TRIPS + "/" + tripId + "/members")
                .header("Authorization", "Bearer " + guestToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(inviteBody(outsider.getUsername())))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value(403))
            .andExpect(jsonPath("$.message").value("Only the trip owner can do this"));

        assertThat(members.findAllByTripIdOrderByJoinedAtAsc(tripId))
            .extracting(TripMember::getUserId)
            .containsExactly(guest.getId());
    }

    @Test
    void removedMemberLosesAccessToPrivateTrip() throws Exception {
        long tripId = createPrivateTrip(ownerToken);
        invite(ownerToken, tripId, guest.getUsername());
        long memberId = memberRowId(tripId);

        mvc.perform(delete("/api/v1/trips/members/" + memberId)
                .header("Authorization", "Bearer " + ownerToken))
            .andExpect(status().isOk());

        mvc.perform(get(TRIPS + "/mine").header("Authorization", "Bearer " + guestToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(0));

        mvc.perform(get(TRIPS + "/" + tripId + "/members")
                .header("Authorization", "Bearer " + guestToken))
            .andExpect(status().isNotFound());

        assertThat(members.findAllByTripIdOrderByJoinedAtAsc(tripId)).isEmpty();
    }

    private long createPrivateTrip(String token) throws Exception {
        MvcResult result = mvc.perform(post(TRIPS)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Invite acceptance\",\"destination\":\"Fuzhou\","
                    + "\"startDate\":\"2026-12-01\",\"endDate\":\"2026-12-03\"}"))
            .andExpect(status().isOk())
            .andReturn();
        return json(result).path("data").path("id").asLong();
    }

    private long memberRowId(long tripId) throws Exception {
        MvcResult result = mvc.perform(get(TRIPS + "/" + tripId + "/members")
                .header("Authorization", "Bearer " + ownerToken))
            .andExpect(status().isOk())
            .andReturn();
        return json(result).path("data").get(1).path("id").asLong();
    }

    private void invite(String token, long tripId, String username) throws Exception {
        mvc.perform(post(TRIPS + "/" + tripId + "/members")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(inviteBody(username)))
            .andExpect(status().isOk());
    }

    private JsonNode json(MvcResult result) throws Exception {
        return mapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private static String inviteBody(String username) {
        return "{\"username\":\"" + username + "\"}";
    }

    private User saveUser(String username) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setNickname(username);
        user.setPasswordHash("test-hash");
        return users.save(user);
    }
}
