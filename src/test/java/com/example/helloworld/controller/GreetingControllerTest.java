package com.example.helloworld.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.helloworld.entity.Greeting;
import com.example.helloworld.repository.GreetingRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class GreetingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private GreetingRepository greetingRepository;

    @BeforeEach
    void cleanDatabase() {
        greetingRepository.deleteAll();
    }

    @Test
    void postGreetingReturnsGeneratedGreetingAndPersistsRecord() throws Exception {
        String payload = objectMapper.writeValueAsString(Map.of("name", "Alice"));

        mockMvc.perform(post("/greeting")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name", is("Alice")))
                .andExpect(jsonPath("$.date").isNotEmpty())
                .andExpect(jsonPath("$.response", is("Hello, Alice!")));

        Greeting stored = greetingRepository.findAll().getFirst();
        org.junit.jupiter.api.Assertions.assertNotNull(stored.getId());
        org.junit.jupiter.api.Assertions.assertEquals("Alice", stored.getName());
        org.junit.jupiter.api.Assertions.assertEquals("Hello, Alice!", stored.getResponse());
        org.junit.jupiter.api.Assertions.assertNotNull(stored.getDate());
    }

    @Test
    void postGreetingResponseMatchesDocumentedContract() throws Exception {
        String payload = objectMapper.writeValueAsString(Map.of("name", "Alice"));

        String body = mockMvc.perform(post("/greeting")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(body);
        assertThat(json.fieldNames()).toIterable()
                .containsExactlyInAnyOrder("id", "name", "date", "response");
        assertThat(UUID.fromString(json.get("id").asText())).isNotNull();
        assertThat(Instant.parse(json.get("date").asText())).isNotNull();
        assertThat(json.get("response").asText()).isEqualTo("Hello, Alice!");
    }

    @Test
    void getGreetingsReturnsPaginatedResultsOrderedByDateDescending() throws Exception {
        Instant now = Instant.now();
        greetingRepository.save(Greeting.builder()
                .id(UUID.randomUUID())
                .name("Oldest")
                .date(now.minus(2, ChronoUnit.HOURS))
                .response("Hello, Oldest!")
                .build());
        greetingRepository.save(Greeting.builder()
                .id(UUID.randomUUID())
                .name("Newest")
                .date(now)
                .response("Hello, Newest!")
                .build());
        greetingRepository.save(Greeting.builder()
                .id(UUID.randomUUID())
                .name("Middle")
                .date(now.minus(1, ChronoUnit.HOURS))
                .response("Hello, Middle!")
                .build());

        mockMvc.perform(get("/greetings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(3)))
                .andExpect(jsonPath("$.content[0].name", is("Newest")))
                .andExpect(jsonPath("$.content[1].name", is("Middle")))
                .andExpect(jsonPath("$.content[2].name", is("Oldest")))
                .andExpect(jsonPath("$.page.size", is(20)));

        mockMvc.perform(get("/greetings").param("page", "1").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(1)))
                .andExpect(jsonPath("$.content[0].name", is("Oldest")))
                .andExpect(jsonPath("$.page.number", is(1)))
                .andExpect(jsonPath("$.page.size", is(2)))
                .andExpect(jsonPath("$.page.totalElements", is(3)));
    }

    @Test
    void getGreetingsDefaultsToTwentyRowsPerPage() throws Exception {
        Instant now = Instant.now();
        for (int i = 0; i < 25; i++) {
            greetingRepository.save(Greeting.builder()
                    .id(UUID.randomUUID())
                    .name("Name" + i)
                    .date(now.minus(i, ChronoUnit.MINUTES))
                    .response("Hello, Name" + i + "!")
                    .build());
        }

        mockMvc.perform(get("/greetings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(20)))
                .andExpect(jsonPath("$.content[0].name", is("Name0")))
                .andExpect(jsonPath("$.content[19].name", is("Name19")))
                .andExpect(jsonPath("$.page.size", is(20)))
                .andExpect(jsonPath("$.page.totalElements", is(25)))
                .andExpect(jsonPath("$.page.totalPages", is(2)));

        mockMvc.perform(get("/greetings").param("page", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(5)))
                .andExpect(jsonPath("$.content[0].name", is("Name20")))
                .andExpect(jsonPath("$.content[4].name", is("Name24")));
    }
}
